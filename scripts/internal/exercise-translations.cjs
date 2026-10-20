'use strict';

// Inert on import: no env/config/bootstrap/files/network. Every SQL operation uses
// the exclusive, caller-owned pg Client or TypeORM QueryRunner supplied to it.
const {createHash, randomUUID} = require('node:crypto');

const VERSION = 'grippo.exercise-translation-import.v1';
const LANGUAGES = Object.freeze(['pt-BR', 'pt-PT']);
// A strict end assertion also rejects the final line terminator that `$` permits.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?![\s\S])/;
const HASH = /^[0-9a-f]{64}(?![\s\S])/;
const REVISION = /^[0-9a-f]{40}(?![\s\S])/;

function fail(code) { throw Object.assign(new Error(code), {code}); }
function check(value, code) { if (!value) fail(code); }
function hash(value) { return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex'); }
function compare(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
async function query(client, sql, parameters = []) {
    check(client && typeof client.query === 'function', 'OWNED_CONNECTION_REQUIRED');
    const result = await client.query(sql, parameters);
    return Array.isArray(result) ? result : result.rows;
}

function validateDataset(dataset) {
    check(dataset && dataset.version === 1 && Array.isArray(dataset.records) && dataset.records.length > 0,
        'INVALID_DATASET');
    check(Object.keys(dataset).every(key => ['version', 'records'].includes(key)), 'INVALID_DATASET');
    const seen = new Set();
    const records = dataset.records.map(row => {
        check(row && Object.keys(row).sort().join(',') === 'description,exerciseExampleId,language,name', 'INVALID_RECORD');
        check(typeof row.exerciseExampleId === 'string' && UUID.test(row.exerciseExampleId), 'INVALID_EXERCISE_ID');
        check(LANGUAGES.includes(row.language), 'INVALID_LANGUAGE');
        for (const field of ['name', 'description']) {
            check(typeof row[field] === 'string' && row[field].trim().length > 0
                && !row[field].includes('\0') && Buffer.byteLength(row[field], 'utf8') <= 100000
                && Buffer.from(row[field], 'utf8').toString('utf8') === row[field], 'INVALID_TEXT');
        }
        const key = `${row.exerciseExampleId}/${row.language}`;
        check(!seen.has(key), 'DUPLICATE_RECORD');
        seen.add(key);
        return {exerciseExampleId: row.exerciseExampleId, language: row.language, name: row.name, description: row.description};
    }).sort((a, b) => compare(a.exerciseExampleId, b.exerciseExampleId) || compare(a.language, b.language));
    const ids = [...new Set(records.map(row => row.exerciseExampleId))];
    check(ids.every(id => LANGUAGES.every(language => seen.has(`${id}/${language}`))), 'INCOMPLETE_DATASET');
    return {records, ids, datasetSha256: hash([VERSION, records])};
}

async function identity(client) {
    const [row] = await query(client, `SELECT current_database() AS database, current_user AS role,
        (SELECT oid::text FROM pg_database WHERE datname=current_database()) AS database_oid,
        inet_server_addr()::text AS address, inet_server_port() AS port,
        pg_postmaster_start_time()::text AS server_start,
        current_setting('server_version_num') AS version`);
    return row;
}

async function assertSchema(client) {
    const rows = await query(client, `SELECT e.enumlabel AS label FROM pg_enum e
        WHERE e.enumtypid='public.supported_language_enum'::regtype ORDER BY e.enumsortorder`);
    check(rows.map(row => row.label).join(',') === 'en,ua,ru,pt-BR,pt-PT', 'SCHEMA_ENUM_MISMATCH');
    const [row] = await query(client, `SELECT EXISTS (SELECT FROM pg_constraint c
        WHERE c.conrelid='public.exercise_example_translations'::regclass
          AND c.conname='uq_exercise_example_translations_language'
          AND c.contype='u' AND NOT c.condeferrable AND c.convalidated
          AND c.conkey=ARRAY[
              (SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='exercise_example_id'),
              (SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='language')
          ]::smallint[]) AND EXISTS (SELECT FROM pg_attribute a
        WHERE a.attrelid='public.exercise_example_translations'::regclass AND a.attname='language'
          AND NOT a.attisdropped AND a.atttypid='public.supported_language_enum'::regtype) AS valid`);
    check(row.valid, 'SCHEMA_CONSTRAINT_MISMATCH');
}

function targetHash(row) { return hash(row ? [row.name, row.description] : null); }
function sourceHash(example, english) {
    return hash(['grippo.exercise-translation-source.v1', example.id,
        [example.name, example.description], english ? [english.name, english.description] : null]);
}
async function snapshot(client, {lock = false} = {}) {
    const examples = await query(client, `SELECT id, name, description FROM public.exercise_examples ORDER BY id${lock ? ' FOR UPDATE' : ''}`);
    const translations = await query(client, `SELECT exercise_example_id, language::text, name, description
        FROM public.exercise_example_translations WHERE language::text IN ('en','pt-BR','pt-PT')
        ORDER BY exercise_example_id, language::text`);
    const byKey = new Map(translations.map(row => [`${row.exercise_example_id}/${row.language}`, row]));
    return {ids: examples.map(row => row.id), examples, byKey};
}

function buildManifest(data, state, codeRevision, target, replacements) {
    check(REVISION.test(codeRevision || ''), 'INVALID_CODE_REVISION');
    check(hash(data.ids) === hash(state.ids), 'CATALOG_ID_SET_CHANGED');
    check(Array.isArray(replacements), 'INVALID_REPLACEMENTS');
    const permissions = new Map();
    for (const permission of replacements) {
        check(permission && UUID.test(permission.exerciseExampleId || '') && LANGUAGES.includes(permission.language)
            && HASH.test(permission.expectedBeforeSha256 || '') && HASH.test(permission.desiredSha256 || ''), 'INVALID_REPLACEMENTS');
        const key = `${permission.exerciseExampleId}/${permission.language}`;
        check(!permissions.has(key), 'INVALID_REPLACEMENTS');
        permissions.set(key, permission);
    }
    const sources = state.examples.map(example => ({exerciseExampleId: example.id,
        sha256: sourceHash(example, state.byKey.get(`${example.id}/en`))}));
    const targets = data.records.map(record => {
        const key = `${record.exerciseExampleId}/${record.language}`;
        const before = state.byKey.get(key);
        const expectedBeforeSha256 = targetHash(before);
        const desiredSha256 = targetHash(record);
        const replacement = !!before && expectedBeforeSha256 !== desiredSha256;
        if (replacement) {
            const permitted = permissions.get(key);
            check(permitted && permitted.expectedBeforeSha256 === expectedBeforeSha256
                && permitted.desiredSha256 === desiredSha256, 'TARGET_CONFLICT');
            permissions.delete(key);
        }
        return {exerciseExampleId: record.exerciseExampleId, language: record.language,
            expectedBeforeSha256, desiredSha256, replacement};
    });
    check(permissions.size === 0, 'UNUSED_REPLACEMENT_PERMISSION');
    return {version: VERSION, codeRevision, datasetSha256: data.datasetSha256,
        catalogIds: data.ids, target, sources, targets};
}

async function planImport(client, {dataset, codeRevision, replacements = []}) {
    const data = validateDataset(dataset);
    await query(client, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    try {
        await assertSchema(client);
        const manifest = buildManifest(data, await snapshot(client), codeRevision, await identity(client), replacements);
        await query(client, 'COMMIT');
        return manifest;
    } catch (error) {
        await query(client, 'ROLLBACK').catch(() => {});
        throw error;
    }
}

function validateManifest(data, manifest, codeRevision) {
    check(manifest && manifest.version === VERSION && manifest.codeRevision === codeRevision
        && REVISION.test(codeRevision || '') && manifest.datasetSha256 === data.datasetSha256
        && hash(manifest.catalogIds) === hash(data.ids), 'MANIFEST_MISMATCH');
    check(Array.isArray(manifest.sources) && manifest.sources.length === data.ids.length
        && manifest.sources.every((source, index) => source.exerciseExampleId === data.ids[index] && HASH.test(source.sha256 || '')),
    'MANIFEST_MISMATCH');
    check(Array.isArray(manifest.targets) && manifest.targets.length === data.records.length, 'MANIFEST_MISMATCH');
    manifest.targets.forEach((target, index) => {
        const record = data.records[index];
        check(target.exerciseExampleId === record.exerciseExampleId && target.language === record.language
            && HASH.test(target.expectedBeforeSha256 || '') && target.desiredSha256 === targetHash(record)
            && typeof target.replacement === 'boolean', 'MANIFEST_MISMATCH');
    });
}

function checkState(data, manifest, state) {
    check(hash(state.ids) === hash(data.ids), 'CATALOG_ID_SET_CHANGED');
    state.examples.forEach((example, index) => check(
        sourceHash(example, state.byKey.get(`${example.id}/en`)) === manifest.sources[index].sha256, 'SOURCE_CHANGED'));
    manifest.targets.forEach(target => {
        const before = state.byKey.get(`${target.exerciseExampleId}/${target.language}`);
        const current = targetHash(before);
        // Repeating an already applied batch is safe, including timestamp/ID no-op.
        check(current === target.expectedBeforeSha256 || current === target.desiredSha256, 'TARGET_CHANGED');
        check(!before || current === target.desiredSha256 || target.replacement, 'TARGET_CONFLICT');
    });
}

async function applyImport(client, {dataset, manifest, codeRevision, onReceipt, attemptId = randomUUID()}) {
    const data = validateDataset(dataset);
    validateManifest(data, manifest, codeRevision);
    check(UUID.test(attemptId), 'INVALID_ATTEMPT');
    check(typeof onReceipt === 'function', 'DURABLE_RECEIPT_REQUIRED');
    let receipt = {version: VERSION, attemptId, processId: process.pid,
        processStartedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(), manifestSha256: hash(manifest),
        datasetSha256: data.datasetSha256, codeRevision, phase: 'PREPARED', startedAt: new Date().toISOString()};
    const publish = async phase => { receipt = {...receipt, phase}; await onReceipt({...receipt}); };
    await publish('PREPARED');
    let begun = false;
    let committing = false;
    let changed = 0;
    try {
        begun = true;
        await query(client, 'BEGIN ISOLATION LEVEL READ COMMITTED');
        await query(client, "SET LOCAL lock_timeout='5s'");
        await query(client, "SET LOCAL statement_timeout='30s'");
        await assertSchema(client);
        const target = await identity(client);
        check(hash(target) === hash(manifest.target), 'TARGET_IDENTITY_CHANGED');
        const [session] = await query(client, `SELECT pg_backend_pid() AS pid,
            backend_start::text, pg_current_xact_id()::text AS transaction_id
            FROM pg_stat_activity WHERE pid=pg_backend_pid()`);
        receipt = {...receipt, target, session};
        await publish('TRANSACTION');
        const state = await snapshot(client, {lock: true});
        checkState(data, manifest, state);
        for (const record of data.records) {
            const before = state.byKey.get(`${record.exerciseExampleId}/${record.language}`);
            if (targetHash(before) === targetHash(record)) continue;
            // Column names/enum are static; neither SQL identifiers nor values come from a shell.
            await query(client, `INSERT INTO public.exercise_example_translations
                (id, exercise_example_id, language, name, description, created_at, updated_at)
                VALUES ($1::uuid,$2::uuid,$3::public.supported_language_enum,$4,$5,now(),now())
                ON CONFLICT ON CONSTRAINT uq_exercise_example_translations_language
                DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, updated_at=now()`,
            [randomUUID(), record.exerciseExampleId, record.language, record.name, record.description]);
            changed += 1;
        }
        receipt = {...receipt, changed};
        await publish('COMMITTING');
        committing = true;
        await query(client, 'COMMIT');
        begun = false;
        await publish('COMMITTED');
        return {changed, receipt};
    } catch (error) {
        if (!committing && begun) {
            try { await query(client, 'ROLLBACK'); begun = false; }
            catch { /* Unknown connection state must be reconciled; never retry. */ }
        }
        const phase = committing || begun ? 'UNKNOWN' : 'ROLLED_BACK';
        try { await publish(phase); } catch { /* Earlier durable COMMITTING record remains authoritative. */ }
        if (phase === 'UNKNOWN') throw Object.assign(new Error('COMMIT_OUTCOME_UNKNOWN'), {code: 'COMMIT_OUTCOME_UNKNOWN', receipt});
        throw error;
    }
}

async function reconcileImport(client, {dataset, manifest, receipt}) {
    const data = validateDataset(dataset);
    validateManifest(data, manifest, manifest.codeRevision);
    check(receipt && receipt.manifestSha256 === hash(manifest) && receipt.datasetSha256 === data.datasetSha256,
        'RECEIPT_MISMATCH');
    // Establish that the original transaction ended BEFORE opening the data
    // snapshot. A REPEATABLE READ snapshot opened before this observation could
    // retain before-state even when the original COMMIT has just finished.
    const observedTarget = await identity(client);
    if (hash(observedTarget) !== hash(manifest.target) || !receipt.session) {
        return {outcome: 'UNKNOWN', reason: 'UNCONFIRMED_OR_CHANGED_IDENTITY'};
    }
    const active = await query(client, `SELECT state, xact_start::text, backend_xid::text
        FROM pg_stat_activity WHERE pid=$1 AND backend_start=$2::timestamptz`,
    [receipt.session.pid, receipt.session.backend_start]);
    if (active.some(row => row.state !== 'idle' || row.xact_start !== null || row.backend_xid !== null)) {
        return {outcome: 'UNKNOWN', reason: 'ORIGINAL_SESSION_NOT_FINISHED'};
    }
    await query(client, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    try {
        const target = await identity(client);
        if (hash(target) !== hash(manifest.target)) {
            await query(client, 'COMMIT');
            return {outcome: 'UNKNOWN', reason: 'UNCONFIRMED_OR_CHANGED_IDENTITY'};
        }
        await assertSchema(client);
        const state = await snapshot(client);
        let consistent = hash(state.ids) === hash(data.ids);
        consistent = consistent && state.examples.every((example, index) =>
            sourceHash(example, state.byKey.get(`${example.id}/en`)) === manifest.sources[index]?.sha256);
        let before = consistent;
        let after = consistent;
        for (const record of manifest.targets) {
            const actual = targetHash(state.byKey.get(`${record.exerciseExampleId}/${record.language}`));
            before = before && actual === record.expectedBeforeSha256;
            after = after && actual === record.desiredSha256;
        }
        await query(client, 'COMMIT');
        return {outcome: before && after ? 'NO_CHANGE' : after ? 'APPLIED' : before ? 'NOT_APPLIED' : 'MISMATCH'};
    } catch (error) {
        await query(client, 'ROLLBACK').catch(() => {});
        throw error;
    }
}

module.exports = {VERSION, LANGUAGES, hash, validateDataset, planImport, applyImport, reconcileImport};
