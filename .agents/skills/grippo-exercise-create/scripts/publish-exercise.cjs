#!/usr/bin/env node
'use strict';

// Offline unless an explicit mode is selected. A CLI flag/hash is a technical
// gate, never evidence that the person approved the external operation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {API_BASE, canonical, readJson, readPreview, sha256} = require('./exercise-package.cjs');
const {validatePreview} = require('./prepare-exercise.cjs');
const {UUID, requestJson, safeError, verifyPublicMedia} = require('./exercise-http.cjs');
const {JOURNAL_ROOT, assertLegacyJournalEmpty, inspectDirectory, readPrivateFile} = require('./exercise-state.cjs');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const timestamp = () => new Date().toISOString();
const normalizedName = value => typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US') : '';
const lowerId = value => typeof value === 'string' && UUID.test(value) ? value.toLowerCase() : null;
const fixedError = error => ({
    code: typeof error?.safeCode === 'string' && /^[A-Z][A-Z0-9_]+$/.test(error.safeCode) ? error.safeCode : 'PUBLICATION_FAILED',
    ...(Number.isInteger(error?.httpStatus) ? {httpStatus: error.httpStatus} : {}),
});

function parseArguments(argv) {
    const args = {mode: 'offline'};
    const valued = new Set(['--preview', '--dictionaries', '--expected-package-sha256', '--id']);
    const seen = new Set();
    for (let index = 0; index < argv.length; index++) {
        const flag = argv[index];
        if (seen.has(flag)) throw safeError('DUPLICATE_CLI_FLAG');
        seen.add(flag);
        if (flag === '--create' || flag === '--verify-only') {
            if (args.mode !== 'offline') throw safeError('EXCLUSIVE_PUBLICATION_MODE_REQUIRED');
            args.mode = flag === '--create' ? 'create' : 'verify';
            continue;
        }
        if (!valued.has(flag) || typeof argv[index + 1] !== 'string' || argv[index + 1].startsWith('--')) {
            throw safeError('UNKNOWN_OR_INCOMPLETE_CLI_FLAG');
        }
        args[flag.slice(2)] = argv[++index];
    }
    if (![args.preview, args.dictionaries].every(value => typeof value === 'string' && path.isAbsolute(value))) {
        throw safeError('ABSOLUTE_PREVIEW_AND_DICTIONARIES_REQUIRED');
    }
    if (args['expected-package-sha256'] !== undefined && !/^[a-f0-9]{64}$/.test(args['expected-package-sha256'])) {
        throw safeError('PACKAGE_SHA256_REQUIRED');
    }
    if (args.mode !== 'offline' && !args['expected-package-sha256']) throw safeError('APPROVED_PACKAGE_SHA256_REQUIRED');
    if (args.mode === 'verify' && !lowerId(args.id) || args.mode !== 'verify' && args.id !== undefined) {
        throw safeError('VERIFY_ONLY_REQUIRES_UUID');
    }
    return args;
}

function durableWrite(file, value, root) {
    let fd;
    try {
        inspectDirectory(path.dirname(file), {root});
        fd = fs.openSync(file, 'wx', 0o600);
        const stat = fs.fstatSync(fd);
        if (stat.uid !== process.getuid() || (stat.mode & 0o7777) !== 0o600) throw safeError('JOURNAL_FILE_UNSAFE');
        fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`);
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        fd = undefined;
        const parent = fs.openSync(path.dirname(file), 'r');
        try { fs.fsyncSync(parent); } finally { fs.closeSync(parent); }
    } catch (error) {
        if (fd !== undefined) try { fs.closeSync(fd); } catch { /* Keep any intent file; never retry POST. */ }
        throw error.safeCode ? error : safeError(error.code === 'EEXIST' ? 'PUBLICATION_ALREADY_STARTED_USE_VERIFY_ONLY' : 'JOURNAL_WRITE_FAILED');
    }
}

function readJournal(directory, packageHash, root) {
    if (!inspectDirectory(directory, {root})) return null;
    const read = (name, optional = false) => {
        const file = path.join(directory, name);
        try {
            const bytes = readPrivateFile(file, root);
            if (bytes === null) return null;
            let value;
            try { value = JSON.parse(bytes.toString('utf8')); }
            catch {
                if (optional) return {
                    status: 'receipt_corrupt', packageSha256: packageHash,
                    receiptFile: name, receiptSha256: sha256(bytes),
                };
                throw safeError('JOURNAL_READ_FAILED');
            }
            if (!object(value) || value.packageSha256 !== packageHash) throw safeError('JOURNAL_IDENTITY_MISMATCH');
            return value;
        } catch (error) {
            if (error.code === 'ENOENT') return null;
            throw error.safeCode ? error : safeError('JOURNAL_READ_FAILED');
        }
    };
    const intent = read('intent.json');
    if (!intent) throw safeError('JOURNAL_INTENT_MISSING_MANUAL_RECONCILIATION_REQUIRED');
    return {intent, outcome: read('outcome.json', true), recovered: read('recovered.json', true)};
}

function requireOk(response, code) {
    if (response.statusCode !== 200 || response.json === undefined) throw safeError(code, response.statusCode);
}

async function checkCatalog(preview, token, send) {
    const expectedNames = new Set(preview.payloadCandidate.name.map(row => normalizedName(row.value)));
    let count;
    let identity;
    for (const language of preview.target.languages) {
        const response = await send({method: 'GET', path: '/exercise-examples', token, language});
        requireOk(response, 'CATALOG_PREREQUISITE_FAILED');
        if (!Array.isArray(response.json)) throw safeError('CATALOG_SHAPE_INVALID');
        if (count !== undefined && response.json.length !== count) throw safeError('CATALOG_CHANGED_DURING_PREFLIGHT');
        count = response.json.length;
        const ids = new Set();
        for (const wrapper of response.json) {
            const entity = wrapper?.entity;
            const id = lowerId(entity?.id);
            if (!id || ids.has(id) || typeof entity.name !== 'string' || typeof entity.imageUrl !== 'string') {
                throw safeError('CATALOG_SHAPE_INVALID');
            }
            ids.add(id);
            if (expectedNames.has(normalizedName(entity.name)) || entity.imageUrl === preview.media.publicUrl) {
                throw safeError('POSSIBLE_DUPLICATE_EXERCISE_REQUIRES_REVIEW');
            }
        }
        const currentIdentity = sha256(canonical([...ids].sort()));
        if (identity !== undefined && identity !== currentIdentity) throw safeError('CATALOG_CHANGED_DURING_PREFLIGHT');
        identity = currentIdentity;
    }
    return {status: 'checked', scope: 'exact_normalized_names_and_image_url_only', languages: preview.target.languages, count, idsSha256: identity, checkedAt: timestamp()};
}

function relationProjection(rows, key, percentages) {
    if (!Array.isArray(rows)) throw safeError('READBACK_RELATIONS_INVALID');
    const seen = new Set();
    return rows.map(row => {
        const id = lowerId(row?.[key]);
        if (!id || seen.has(id)) throw safeError('READBACK_DUPLICATE_OR_INVALID_REFERENCE');
        seen.add(id);
        if (percentages && (!Number.isInteger(row.percentage) || row.percentage < 0 || row.percentage > 100)) {
            throw safeError('READBACK_PERCENTAGE_INVALID');
        }
        return percentages ? {[key]: id, percentage: row.percentage} : {[key]: id};
    }).sort((a, b) => a[key].localeCompare(b[key]));
}

function componentProjection(components) {
    const keys = ['externalWeight', 'bodyWeight', 'extraWeight', 'assistWeight'];
    if (!object(components) || Object.keys(components).length !== keys.length) throw safeError('READBACK_COMPONENTS_INVALID');
    return Object.fromEntries(keys.map(key => {
        const value = components[key];
        if (value === null) return [key, null];
        const body = key === 'bodyWeight';
        if (!object(value) || typeof value.required !== 'boolean'
            || Object.keys(value).length !== (body ? 2 : 1)
            || !Object.hasOwn(value, 'required') || body && !Object.hasOwn(value, 'multiplier')) {
            throw safeError('READBACK_COMPONENTS_INVALID');
        }
        if (!body) return [key, {required: value.required}];
        const raw = value.multiplier;
        if (!(typeof raw === 'number' || typeof raw === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw))
            || !Number.isFinite(Number(raw))) throw safeError('READBACK_MULTIPLIER_INVALID');
        return [key, {required: value.required, multiplier: Number(raw)}];
    }));
}

function reconcileGraph(response, preview, id, language) {
    requireOk(response, 'LOCALIZED_READBACK_FAILED');
    const vary = String(response.headers?.vary || '').split(',').map(value => value.trim().toLowerCase());
    if (!vary.includes('accept-language')) throw safeError('READBACK_VARY_ACCEPT_LANGUAGE_MISSING');
    const entity = response.json?.entity;
    if (!object(entity) || lowerId(entity.id) !== id) throw safeError('READBACK_ID_MISMATCH');
    const expected = preview.payloadCandidate;
    for (const field of ['weightType', 'category', 'experience', 'forceType', 'imageUrl']) {
        if (entity[field] !== expected[field]) throw safeError('READBACK_SCALAR_MISMATCH');
    }
    for (const field of ['name', 'description']) {
        if (entity[field] !== expected[field].find(row => row.language === language)?.value) {
            throw safeError('READBACK_LOCALIZED_TEXT_MISMATCH');
        }
    }
    for (const [field, key, percentages] of [
        ['exerciseExampleBundles', 'muscleId', true], ['equipmentRefs', 'equipmentId', false],
    ]) {
        if (canonical(relationProjection(entity[field], key, percentages)) !== canonical(relationProjection(expected[field], key, percentages))) {
            throw safeError('READBACK_RELATION_MISMATCH');
        }
    }
    if (canonical(componentProjection(entity.components)) !== canonical(componentProjection(expected.components))) {
        throw safeError('READBACK_COMPONENTS_MISMATCH');
    }
}

function reconcileRaw(response, preview, id) {
    requireOk(response, 'RAW_TRANSLATIONS_READBACK_FAILED');
    const raw = response.json;
    if (!object(raw) || lowerId(raw.id) !== id || !object(raw.base) || !Array.isArray(raw.translations)
        || raw.translations.length !== preview.target.languages.length) throw safeError('RAW_TRANSLATIONS_SHAPE_MISMATCH');
    if (typeof raw.translationsRevision !== 'string' || raw.translationsRevision.length !== 64
        || !/^[a-f0-9]{64}$/.test(raw.translationsRevision)) throw safeError('RAW_TRANSLATIONS_REVISION_INVALID');
    for (const field of ['name', 'description']) {
        if (raw.base[field] !== preview.payloadCandidate[field].find(row => row.language === 'en')?.value) {
            throw safeError('RAW_BASE_TEXT_MISMATCH');
        }
    }
    const seen = new Set();
    for (const row of raw.translations) {
        if (!object(row) || !preview.target.languages.includes(row.language) || seen.has(row.language)) {
            throw safeError('RAW_TRANSLATIONS_DUPLICATE_OR_UNEXPECTED_LANGUAGE');
        }
        seen.add(row.language);
        for (const field of ['name', 'description']) {
            if (row[field] !== preview.payloadCandidate[field].find(item => item.language === row.language)?.value) {
                throw safeError('RAW_TRANSLATION_TEXT_MISMATCH');
            }
        }
    }
}

async function readBack(preview, id, token, send) {
    const checks = [];
    for (const language of preview.target.languages) {
        try {
            const response = await send({method: 'GET', path: `/exercise-examples/${id}`, token, language});
            reconcileGraph(response, preview, id, language);
            checks.push({check: 'localized_graph', language, status: 'PASS'});
        } catch (error) {
            checks.push({check: 'localized_graph', language, status: 'FAIL', ...fixedError(error)});
        }
    }
    try {
        const response = await send({method: 'GET', path: `/admin/exercise-examples/${id}/translations`, token});
        reconcileRaw(response, preview, id);
        checks.push({check: 'stored_translations', status: 'PASS'});
    } catch (error) {
        checks.push({check: 'stored_translations', status: 'FAIL', ...fixedError(error)});
    }
    return {status: checks.every(check => check.status === 'PASS') ? 'verified' : 'created_readback_pending', checks, checkedAt: timestamp()};
}

async function run(args, deps = {}) {
    const preview = (deps.readPreview || readPreview)(args.preview, args['expected-package-sha256']);
    const snapshot = (deps.readJson || readJson)(args.dictionaries);
    await (deps.validatePreview || validatePreview)(preview, snapshot);
    if (args.mode === 'offline') return {
        status: 'offline_validated', packageSha256: preview.packageSha256, apiBase: API_BASE,
        createRoute: '/admin/exercise-examples', mediaUrl: preview.media.publicUrl,
        networkingPerformed: false, publicationPerformed: false, readbackVerified: false,
    };
    if (args['expected-package-sha256'] !== preview.packageSha256) throw safeError('APPROVED_PACKAGE_SHA256_REQUIRED');
    const token = deps.token === undefined ? process.env.GRIPPO_ADMIN_TOKEN : deps.token;
    // Validate before reading or writing the journal and before the CDN check.
    if (typeof token !== 'string' || token.length < 16 || token.length > 16384 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
        throw safeError('ADMIN_TOKEN_REQUIRED');
    }
    const send = deps.requestJson || requestJson;
    const verifyMedia = deps.verifyPublicMedia || verifyPublicMedia;
    const root = deps.journalRoot || JOURNAL_ROOT;
    assertLegacyJournalEmpty(deps.legacyJournalRoot);
    const directory = path.join(root, preview.packageSha256);
    // No directory creation is needed for verification or the existence gate.
    const existing = readJournal(directory, preview.packageSha256, root);
    if (args.mode === 'create' && existing) throw safeError('PUBLICATION_ALREADY_STARTED_USE_VERIFY_ONLY');
    if (args.mode === 'verify') {
        if (!existing) throw safeError('PUBLICATION_INTENT_REQUIRED');
        const id = lowerId(args.id);
        // Only the original, durably recorded 201 response establishes this
        // attempt's ID. An identical existing resource cannot establish who
        // created it; older recovered receipts are retained only as evidence.
        const recordedId = existing.outcome?.status === 'created' && existing.outcome.httpStatus === 201
            ? lowerId(existing.outcome.id) : null;
        if (!id || recordedId && recordedId !== id) throw safeError('JOURNAL_EXERCISE_ID_MISMATCH');
        const media = await verifyMedia(preview.media);
        const result = await readBack(preview, id, token, send);
        const resourceReadbackVerified = result.status === 'verified';
        const attribution = recordedId ? {id} : {
            candidateResourceId: id,
            ...(resourceReadbackVerified ? {verifiedResourceId: id} : {}),
            manualReconciliationRequired: true,
        };
        if (!recordedId) result.status = existing.outcome?.status === 'create_rejected' ? 'create_rejected' : 'outcome_unknown';
        const journalWarnings = [existing.outcome, existing.recovered]
            .filter(value => value?.status === 'receipt_corrupt')
            .map(value => ({code: 'OPTIONAL_RECEIPT_CORRUPT', file: value.receiptFile, sha256: value.receiptSha256}));
        const receipt = {...result, packageSha256: preview.packageSha256, ...attribution, resourceReadbackVerified, media, journalWarnings};
        durableWrite(path.join(directory, `verification-${crypto.randomUUID()}.json`), receipt, root);
        return {
            status: result.status, ...attribution, resourceReadbackVerified,
            packageSha256: preview.packageSha256, checks: result.checks, journalWarnings, postPerformed: false,
        };
    }
    if (args.mode !== 'create' || args['expected-package-sha256'] !== preview.packageSha256) {
        throw safeError('APPROVED_PACKAGE_SHA256_REQUIRED');
    }
    const media = await verifyMedia(preview.media);
    const catalog = await checkCatalog(preview, token, send);
    // Slow read-only prerequisites cannot make an edited local package eligible
    // for publication. Re-read bytes and recompute identity just before intent.
    const freshPreview = (deps.readPreview || readPreview)(args.preview, args['expected-package-sha256']);
    const freshSnapshot = (deps.readJson || readJson)(args.dictionaries);
    await (deps.validatePreview || validatePreview)(freshPreview, freshSnapshot);
    if (freshPreview.packageSha256 !== preview.packageSha256) throw safeError('APPROVED_PACKAGE_CHANGED');
    // Recheck the fixed legacy location after slow read-only prerequisites.
    assertLegacyJournalEmpty(deps.legacyJournalRoot);
    inspectDirectory(directory, {root, create: true});
    durableWrite(path.join(directory, 'intent.json'), {
        schemaVersion: 1, status: 'create_started', packageSha256: preview.packageSha256,
        apiBase: API_BASE, payloadSha256: sha256(canonical(preview.payloadCandidate)),
        mediaSha256: preview.media.sha256, startedAt: timestamp(),
    }, root);
    let response;
    let outcome;
    try {
        response = await send({method: 'POST', path: '/admin/exercise-examples', token, body: preview.payloadCandidate});
        if (response.statusCode === 201 && object(response.json) && Object.keys(response.json).length === 1 && lowerId(response.json.id)) {
            outcome = {status: 'created', id: lowerId(response.json.id), httpStatus: 201};
        } else {
            const definitive = [400, 401, 403, 404, 405, 409, 415, 422, 429].includes(response.statusCode);
            outcome = {status: definitive ? 'create_rejected' : 'outcome_unknown', code: definitive ? 'CREATE_REJECTED' : 'CREATE_RESPONSE_UNCERTAIN', httpStatus: response.statusCode};
        }
    } catch (error) {
        outcome = {status: 'outcome_unknown', ...fixedError(error)};
    }
    // A failed receipt leaves the durable intent blocking every future POST.
    durableWrite(path.join(directory, 'outcome.json'), {...outcome, packageSha256: preview.packageSha256, checkedAt: timestamp()}, root);
    if (outcome.status !== 'created') return {packageSha256: preview.packageSha256, ...outcome, postPerformed: true};
    const result = await readBack(preview, outcome.id, token, send);
    durableWrite(path.join(directory, `verification-${crypto.randomUUID()}.json`), {
        ...result, packageSha256: preview.packageSha256, id: outcome.id, media, catalog,
    }, root);
    return {status: result.status, id: outcome.id, packageSha256: preview.packageSha256, checks: result.checks, postPerformed: true};
}

module.exports = {checkCatalog, parseArguments, readBack, reconcileGraph, reconcileRaw, run};
if (require.main === module) Promise.resolve().then(() => run(parseArguments(process.argv.slice(2)))).then(result => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!['offline_validated', 'verified'].includes(result.status)) process.exitCode = 1;
}).catch(error => {
    process.stderr.write(`${JSON.stringify({status: 'FAIL', ...fixedError(error)})}\n`);
    process.exitCode = 1;
});
