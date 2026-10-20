#!/usr/bin/env node
'use strict';

// Offline only: load the request DTO, never the application or its services.
const fs = require('node:fs');
const path = require('node:path');
const {API_BASE, MAX_API_REQUEST_BYTES, canonical, checkedMedia, identity, loadPolicy} = require('./exercise-package.cjs');

const DRAFT_KEYS = [
    'id', 'name', 'description', 'nameTranslations', 'descriptionTranslations',
    'weightType', 'category', 'experience', 'forceType', 'imageUrl',
    'exerciseExampleBundles', 'equipmentRefs', 'components',
];
const SAFE_KEYS = new Set([
    ...DRAFT_KEYS, 'muscles', 'equipment', 'supportedLanguages', 'muscleId',
    'equipmentId', 'percentage', 'externalWeight', 'bodyWeight', 'extraWeight',
    'assistWeight', 'required', 'multiplier', 'language', 'value',
]);

class PreparationError extends Error {
    constructor(issues) {
        super('Preparation failed');
        this.issues = issues;
    }
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const issue = (issues, at, code) => issues.push({path: at, code});
const safeKey = key => SAFE_KEYS.has(key) || /^\d+$/.test(key) ? key : '[unknown-key]';

function checkKeys(value, allowed, at, issues) {
    if (!isObject(value)) {
        issue(issues, at, 'OBJECT_REQUIRED');
        return false;
    }
    if (Object.keys(value).some(key => !allowed.includes(key))) {
        issue(issues, `${at}.[unknown-key]`, 'FORBIDDEN_KEY');
    }
    return true;
}

function argumentsFrom(argv) {
    const args = {preview: false};
    const allowed = ['--draft', '--dictionaries', '--out', '--media-plan'];
    for (let index = 0; index < argv.length; index++) {
        const key = argv[index];
        if (key === '--preview' && !args.preview) { args.preview = true; continue; }
        const value = argv[++index];
        if (!allowed.includes(key) || own(args, key) || typeof value !== 'string' || !path.isAbsolute(value)) {
            throw new PreparationError([{path: '$.cli', code: 'UNIQUE_FLAGS_WITH_ABSOLUTE_PATHS_REQUIRED'}]);
        }
        args[key] = value;
    }
    if (!args['--draft'] || !args['--dictionaries'] || !args['--out'] || args.preview && !args['--media-plan']) {
        throw new PreparationError([{path: '$.cli', code: 'DRAFT_DICTIONARIES_OUT_AND_PREVIEW_MEDIA_PLAN_REQUIRED'}]);
    }
    if (!args.preview && args['--media-plan']) throw new PreparationError([{path: '$.cli', code: 'MEDIA_PLAN_REQUIRES_PREVIEW_MODE'}]);
    return args;
}

function readJson(file, at, ts) {
    let source;
    let result;
    try {
        source = fs.readFileSync(file, 'utf8');
        result = JSON.parse(source);
    } catch {
        throw new PreparationError([{path: at, code: 'JSON_READ_FAILED'}]);
    }

    // JSON.parse keeps the last duplicate key. Reject that ambiguity before
    // locale maps or other fields can silently lose a value.
    const issues = [];
    const parsed = ts.parseJsonText('input.json', source);
    function visit(node, currentPath) {
        if (ts.isObjectLiteralExpression(node)) {
            const seen = new Set();
            for (const property of node.properties) {
                const key = property.name.text;
                if (seen.has(key)) issue(issues, `${currentPath}.[duplicate-key]`, 'DUPLICATE_JSON_KEY');
                seen.add(key);
                visit(property.initializer, `${currentPath}.${safeKey(key)}`);
            }
        } else if (ts.isArrayLiteralExpression(node)) {
            node.elements.forEach((element, index) => visit(element, `${currentPath}.${index}`));
        }
    }
    visit(parsed.statements[0].expression, at);
    if (issues.length) throw new PreparationError(issues);
    return result;
}

function loadContract(repo, ts) {
    const relativeFiles = [
        'src/modules/exercise-examples/dto/exercise-example.request.ts',
        'src/modules/exercise-examples/dto/exercise-components.dto.ts',
        'src/lib/exercise-category.enum.ts', 'src/lib/weight-type.enum.ts',
        'src/lib/experience.enum.ts', 'src/lib/force-type.enum.ts',
        'src/i18n/i18n.types.ts',
    ];
    const allowedFiles = new Set(relativeFiles.map(file => path.join(repo, file)));
    const allowedPackages = new Set(['@nestjs/swagger', 'class-validator', 'class-transformer']);
    const visited = new Set();
    function check(file) {
        if (visited.has(file)) return;
        if (!allowedFiles.has(file)) throw new PreparationError([{path: '$.runtime', code: 'DTO_DEPENDENCY_GRAPH_DRIFT'}]);
        visited.add(file);
        const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        function visit(node) {
            if (ts.isImportEqualsDeclaration(node)) {
                throw new PreparationError([{path: '$.runtime', code: 'DTO_DEPENDENCY_GRAPH_DRIFT'}]);
            }
            if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
                if (node.moduleSpecifier) {
                    const specifier = node.moduleSpecifier.text;
                    if (typeof specifier !== 'string') throw new PreparationError([{path: '$.runtime', code: 'DTO_DEPENDENCY_GRAPH_DRIFT'}]);
                    if (specifier.startsWith('.')) {
                        check(path.resolve(path.dirname(file), `${specifier}.ts`));
                    } else if (!allowedPackages.has(specifier)) {
                        throw new PreparationError([{path: '$.runtime', code: 'DTO_DEPENDENCY_GRAPH_DRIFT'}]);
                    }
                }
            }
            if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
                || ts.isIdentifier(node.expression) && node.expression.text === 'require')) {
                throw new PreparationError([{path: '$.runtime', code: 'DTO_DYNAMIC_DEPENDENCY_FORBIDDEN'}]);
            }
            ts.forEachChild(node, visit);
        }
        visit(source);
    }
    check(path.join(repo, relativeFiles[0]));

    require(path.join(repo, 'node_modules/reflect-metadata'));
    require(path.join(repo, 'node_modules/ts-node')).register({
        skipProject: true,
        transpileOnly: true,
        compilerOptions: {
            module: 'commonjs', target: 'ES2021', experimentalDecorators: true,
            emitDecoratorMetadata: true, esModuleInterop: true,
        },
    });
    const {ExerciseExampleRequest} = require(path.join(repo, relativeFiles[0]));
    const {SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE} = require(path.join(repo, 'src/i18n/i18n.types.ts'));
    const {ValidationPipe} = require(path.join(repo, 'node_modules/@nestjs/common'));
    const {isUUID} = require(path.join(repo, 'node_modules/class-validator'));
    if (DEFAULT_LANGUAGE !== 'en' || !Array.isArray(SUPPORTED_LANGUAGES)
        || new Set(SUPPORTED_LANGUAGES).size !== SUPPORTED_LANGUAGES.length) {
        throw new PreparationError([{path: '$.runtime', code: 'LOCAL_LANGUAGE_CONTRACT_DRIFT'}]);
    }
    SUPPORTED_LANGUAGES.forEach(language => SAFE_KEYS.add(language));
    return {ExerciseExampleRequest, ValidationPipe, isUUID, languages: [...SUPPORTED_LANGUAGES]};
}

function validateDictionaries(dictionaries, contract, issues) {
    if (!checkKeys(dictionaries, ['muscles', 'equipment', 'supportedLanguages'], '$.dictionaries', issues)) return {};
    const result = {};
    for (const field of ['muscles', 'equipment']) {
        const rows = dictionaries[field];
        result[field] = new Set();
        if (!Array.isArray(rows)) {
            issue(issues, `$.dictionaries.${field}`, 'ARRAY_REQUIRED');
            continue;
        }
        rows.forEach((row, index) => {
            const at = `$.dictionaries.${field}.${index}`;
            if (!checkKeys(row, ['id', 'name'], at, issues)) return;
            if (typeof row.id !== 'string' || !contract.isUUID(row.id)) {
                issue(issues, `${at}.id`, 'UUID_REQUIRED');
            } else {
                const id = row.id.toLowerCase();
                if (result[field].has(id)) issue(issues, `${at}.id`, 'DUPLICATE_DICTIONARY_ID');
                result[field].add(id);
            }
            if (typeof row.name !== 'string' || !row.name.trim()) issue(issues, `${at}.name`, 'NONEMPTY_STRING_REQUIRED');
        });
    }
    if (!own(dictionaries, 'supportedLanguages')) {
        issue(issues, '$.dictionaries.supportedLanguages', 'TARGET_LANGUAGES_REQUIRED');
    } else {
        const languages = dictionaries.supportedLanguages;
        if (!Array.isArray(languages) || languages.some(language => typeof language !== 'string')
            || new Set(languages).size !== languages.length) {
            issue(issues, '$.dictionaries.supportedLanguages', 'UNIQUE_LANGUAGE_ARRAY_REQUIRED');
        } else if (languages.length !== contract.languages.length
            || languages.some(language => !contract.languages.includes(language))) {
            issue(issues, '$.dictionaries.supportedLanguages', 'TARGET_LANGUAGE_DRIFT');
        }
    }
    return result;
}

function validateDraft(draft, contract, dictionaries, issues, mediaPolicy) {
    if (!checkKeys(draft, DRAFT_KEYS, '$.draft', issues)) return;
    if (own(draft, 'id') && draft.id !== null && draft.id !== '') issue(issues, '$.draft.id', 'CREATE_REQUIRES_REMOVING_ID');
    const normalized = {};
    for (const field of ['name', 'description']) {
        const value = draft[field];
        if (typeof value !== 'string' || !value.trim()) {
            issue(issues, `$.draft.${field}`, 'NONEMPTY_SCALAR_STRING_REQUIRED');
        } else {
            normalized[field] = value.trim();
        }
        const mapField = `${field}Translations`;
        const map = draft[mapField];
        if (!checkKeys(map, contract.languages, `$.draft.${mapField}`, issues)) continue;
        normalized[mapField] = {};
        contract.languages.forEach(language => {
            if (typeof map[language] !== 'string' || !map[language].trim()) {
                issue(issues, `$.draft.${mapField}.${language}`, 'NONEMPTY_TRANSLATION_REQUIRED');
            } else {
                normalized[mapField][language] = map[language].trim();
            }
        });
        if (normalized[field] && normalized[mapField].en && normalized[field] !== normalized[mapField].en) {
            issue(issues, `$.draft.${field}`, 'BASE_MUST_EQUAL_ENGLISH');
        }
    }
    for (const [field, idField, dictionary] of [
        ['exerciseExampleBundles', 'muscleId', 'muscles'],
        ['equipmentRefs', 'equipmentId', 'equipment'],
    ]) {
        if (!Array.isArray(draft[field])) continue; // The real DTO checks the shape.
        const seen = new Set();
        draft[field].forEach((row, index) => {
            if (!checkKeys(row, field === 'exerciseExampleBundles' ? ['muscleId', 'percentage'] : ['equipmentId'],
                `$.draft.${field}.${index}`, issues) || typeof row[idField] !== 'string') return;
            const id = row[idField].toLowerCase();
            const at = `$.draft.${field}.${index}.${idField}`;
            if (seen.has(id)) issue(issues, at, 'DUPLICATE_REFERENCE');
            seen.add(id);
            if (!dictionaries[dictionary]?.has(id)) issue(issues, at, 'UNKNOWN_DICTIONARY_REFERENCE');
        });
    }
    const componentFields = ['externalWeight', 'bodyWeight', 'extraWeight', 'assistWeight'];
    if (checkKeys(draft.components, componentFields, '$.draft.components', issues)) {
        for (const field of componentFields) {
            if (draft.components[field] !== null && draft.components[field] !== undefined) {
                checkKeys(draft.components[field], field === 'bodyWeight' ? ['required', 'multiplier'] : ['required'],
                    `$.draft.components.${field}`, issues);
            }
        }
    }
    if (typeof draft.imageUrl !== 'string') {
        issue(issues, '$.draft.imageUrl', 'HTTPS_IMAGE_URL_REQUIRED');
    } else {
        try {
            const url = new URL(draft.imageUrl);
            if (draft.imageUrl !== draft.imageUrl.trim()
                || url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error();
            const prefix = new URL(mediaPolicy.prefix, mediaPolicy.publicBaseUrl).href;
            const extension = `.${mediaPolicy.format}`;
            const file = draft.imageUrl.slice(prefix.length);
            const stem = file.slice(0, -extension.length);
            if (!draft.imageUrl.startsWith(prefix) || !file.endsWith(extension)
                || new RegExp(mediaPolicy.stemPattern).exec(stem)?.[0] !== stem) {
                issue(issues, '$.draft.imageUrl', 'MEDIA_POLICY_URL_REQUIRED');
            }
        } catch {
            issue(issues, '$.draft.imageUrl', 'HTTPS_IMAGE_URL_REQUIRED');
        }
    }
    return normalized;
}

function validateComponentRules(components, issues, weightType) {
    const {externalWeight, bodyWeight, extraWeight, assistWeight} = components;
    if (externalWeight !== null && bodyWeight !== null) issue(issues, '$.draft.components', 'EXTERNAL_BODY_MUTUALLY_EXCLUSIVE');
    if (extraWeight !== null && bodyWeight === null) issue(issues, '$.draft.components.extraWeight', 'BODY_WEIGHT_REQUIRED');
    if (assistWeight !== null && bodyWeight === null) issue(issues, '$.draft.components.assistWeight', 'BODY_WEIGHT_REQUIRED');
    if (externalWeight !== null && (extraWeight !== null || assistWeight !== null)) {
        issue(issues, '$.draft.components.externalWeight', 'EXTERNAL_EXTRA_ASSIST_MUTUALLY_EXCLUSIVE');
    }
    if (bodyWeight !== null && Number(bodyWeight.multiplier.toFixed(2)) !== bodyWeight.multiplier) {
        issue(issues, '$.draft.components.bodyWeight.multiplier', 'MAX_TWO_DECIMAL_PLACES');
    }
    if (weightType === 'body_weight' && (bodyWeight === null || externalWeight !== null)
        || weightType !== 'body_weight' && (bodyWeight !== null || externalWeight === null)) {
        issue(issues, '$.draft.components', 'WEIGHT_TYPE_COMPONENT_MISMATCH');
    }
}

function flattenValidationErrors(errors, issues, at = '$.draft') {
    for (const error of errors) {
        const currentPath = `${at}.${safeKey(String(error.property))}`;
        for (const code of Object.keys(error.constraints ?? {})) {
            issue(issues, currentPath, /^[a-zA-Z][a-zA-Z0-9_]*$/.test(code) ? code : 'DTO_VALIDATION_FAILED');
        }
        flattenValidationErrors(error.children ?? [], issues, currentPath);
    }
}

function writeOutputs(out, artifacts) {
    const created = [];
    let madeDirectory = false;
    try {
        fs.mkdirSync(out, {mode: 0o700});
        madeDirectory = true;
        for (const [name, value] of Object.entries(artifacts)) {
            const file = path.join(out, name);
            const fd = fs.openSync(file, 'wx', 0o600);
            created.push(file);
            try {
                fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`);
            } finally {
                fs.closeSync(fd);
            }
        }
    } catch {
        for (const file of created.reverse()) {
            try { fs.unlinkSync(file); } catch { /* Report the failure without leaking paths. */ }
        }
        if (madeDirectory) {
            try { fs.rmdirSync(out); } catch { /* Never remove files belonging to another writer. */ }
        }
        throw new PreparationError([{path: '$.cli.out', code: madeDirectory ? 'OUTPUT_WRITE_FAILED' : 'NEW_OUTPUT_DIRECTORY_REQUIRED'}]);
    }
}

async function validateInput(draft, snapshot) {
    // This script is installed at .agents/skills/grippo-exercise-create/scripts/.
    const repo = path.resolve(__dirname, '../../../..');
    const ts = require(path.join(repo, 'node_modules/typescript'));
    const contract = loadContract(repo, ts);
    const issues = [];
    const dictionaries = validateDictionaries(snapshot, contract, issues);
    const mediaPolicy = loadPolicy();
    const normalized = validateDraft(draft, contract, dictionaries, issues, mediaPolicy);
    if (issues.length) throw new PreparationError(issues);

    const apiPayload = {
        name: contract.languages.map(language => ({language, value: normalized.nameTranslations[language]})),
        description: contract.languages.map(language => ({language, value: normalized.descriptionTranslations[language]})),
    };
    for (const field of ['weightType', 'category', 'experience', 'forceType', 'imageUrl',
        'exerciseExampleBundles', 'equipmentRefs', 'components']) apiPayload[field] = draft[field];

    const pipe = new contract.ValidationPipe({
        transform: true, whitelist: true, forbidNonWhitelisted: true,
        validationError: {target: false, value: false},
        exceptionFactory: errors => {
            flattenValidationErrors(errors, issues);
            return new PreparationError(issues);
        },
    });
    await pipe.transform(apiPayload, {type: 'body', metatype: contract.ExerciseExampleRequest});
    validateComponentRules(apiPayload.components, issues, apiPayload.weightType);
    if (Buffer.byteLength(JSON.stringify(apiPayload), 'utf8') > MAX_API_REQUEST_BYTES) {
        issue(issues, '$.draft', 'API_BODY_TOO_LARGE');
    }
    if (issues.length) throw new PreparationError(issues);

    const adminImport = {...normalized};
    for (const field of ['weightType', 'category', 'experience', 'forceType', 'imageUrl',
        'exerciseExampleBundles', 'equipmentRefs', 'components']) adminImport[field] = draft[field];
    const validation = {
        status: 'PASS',
        scope: 'offline_contract',
        supportedLanguages: contract.languages,
        targetLanguageSnapshot: 'matches_local',
        checks: [
            'current_ExerciseExampleRequest_ValidationPipe', 'complete_translations_and_english_base',
            'unique_dictionary_ids_and_reference_membership', 'service_component_invariants', 'catalog_media_url_policy',
        ],
        notVerified: [
            'target_deployed_schema', 'dictionary_freshness', 'duplicate_exercise_search',
            'scientific_and_editorial_correctness', 'image_public_access_and_visual_quality',
            'HTTP_auth_persistence_and_readback',
        ],
    };
    return {apiPayload, adminImport, validation};
}

async function main() {
    const args = argumentsFrom(process.argv.slice(2));
    const repo = path.resolve(__dirname, '../../../..');
    const ts = require(path.join(repo, 'node_modules/typescript'));
    let draft = readJson(args['--draft'], '$.draft', ts);
    const snapshot = readJson(args['--dictionaries'], '$.dictionaries', ts);
    let media;
    if (args.preview) {
        media = checkedMedia(readJson(args['--media-plan'], '$.mediaPlan', ts));
        if (own(draft, 'imageUrl') && draft.imageUrl !== media.publicUrl) {
            throw new PreparationError([{path: '$.draft.imageUrl', code: 'PREVIEW_MEDIA_URL_MISMATCH'}]);
        }
        draft = {...draft, imageUrl: media.publicUrl};
    }
    const {apiPayload, adminImport, validation} = await validateInput(draft, snapshot);
    if (args.preview) {
        const {imageUrl, ...localDraft} = adminImport;
        const preview = {
            schemaVersion: 1, status: 'local_preview',
            target: {apiBase: API_BASE, languages: validation.supportedLanguages},
            draft: localDraft, payloadCandidate: apiPayload, media,
        };
        preview.packageSha256 = identity(preview);
        validation.scope = 'offline_preview_contract';
        validation.publicUrlVerified = false;
        validation.uploadPerformed = false;
        validation.packageSha256 = preview.packageSha256;
        writeOutputs(args['--out'], {'preview.json': preview, 'validation.json': validation});
        process.stdout.write(`${JSON.stringify({status: 'PASS', scope: validation.scope, packageSha256: preview.packageSha256, imagePublished: false})}\n`);
    } else {
        writeOutputs(args['--out'], {'api-payload.json': apiPayload, 'admin-import.json': adminImport, 'validation.json': validation});
        process.stdout.write(`${JSON.stringify({status: 'PASS', scope: 'offline_contract', publicUrlVerified: false, issues: []})}\n`);
    }
}

async function validatePreview(preview, snapshot) {
    const checked = await validateInput({...preview.draft, imageUrl: preview.media.publicUrl}, snapshot);
    if (canonical(checked.apiPayload) !== canonical(preview.payloadCandidate)
        || canonical(checked.validation.supportedLanguages) !== canonical(preview.target.languages)) {
        throw new PreparationError([{path: '$.preview', code: 'PREVIEW_MODEL_MISMATCH'}]);
    }
    return checked;
}

module.exports = {validateInput, validatePreview};
if (require.main === module) main().catch(error => {
    const issues = error instanceof PreparationError ? error.issues
        : [{path: '$.runtime', code: error.safeCode || 'OFFLINE_PREPARATION_FAILED'}];
    process.stderr.write(`${JSON.stringify({status: 'FAIL', issues})}\n`);
    process.exitCode = 1;
});
