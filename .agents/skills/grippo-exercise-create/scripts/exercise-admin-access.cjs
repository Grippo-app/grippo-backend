#!/usr/bin/env node
'use strict';

// Credentials come only from this process's terminal. No browser session,
// credential file, environment token, refresh, redirects, retries or cache.
const https = require('node:https');
const {StringDecoder} = require('node:string_decoder');
const {TextDecoder} = require('node:util');
const publisher = require('./publish-exercise.cjs');
const {UUID, safeError} = require('./exercise-http.cjs');

const API_BASE = 'https://grippo-app.com';
const LANGUAGES = ['en', 'ua', 'ru', 'pt-BR', 'pt-PT'];
const MAX_LOGIN_BYTES = 100 * 1024;
const MAX_CATALOG_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 20000;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validUuid = value => typeof value === 'string' && value.length === 36 && UUID.test(value);
const validToken = value => typeof value === 'string' && value.length >= 16 && value.length <= 16384 && !/[^A-Za-z0-9._~-]/.test(value);
const validText = value => value === null || typeof value === 'string';

function parseArguments(argv) {
    if (!argv.length || argv.length === 1 && argv[0] === '--check') return {mode: 'check'};
    if (argv.length === 1 && argv[0] === '--help') return {mode: 'help'};
    if (argv[0] === '--publisher') return {mode: 'publisher', publisherArgs: publisher.parseArguments(argv.slice(1))};
    throw safeError('ACCESS_CLI_ARGUMENTS_INVALID');
}

function readHiddenLine(label, deps = {}) {
    const input = deps.input || process.stdin;
    const output = deps.output || process.stderr;
    const signals = deps.signals || process;
    if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function') {
        return Promise.reject(safeError('INTERACTIVE_TERMINAL_REQUIRED'));
    }
    return new Promise((resolve, reject) => {
        const wasRaw = Boolean(input.isRaw);
        const wasPaused = input.readableFlowing !== true;
        const decoder = new StringDecoder('utf8');
        let value = '';
        let settled = false;
        const finish = error => {
            if (settled) return;
            settled = true;
            input.removeListener('data', onData);
            input.removeListener('error', onError);
            input.removeListener('end', onEnd);
            input.removeListener('close', onEnd);
            signals.removeListener('SIGINT', onInterrupt);
            signals.removeListener('SIGTERM', onInterrupt);
            let restoreFailed = false;
            try { input.setRawMode(wasRaw); } catch { restoreFailed = true; }
            try { if (wasPaused) input.pause(); output.write('\n'); } catch { restoreFailed = true; }
            const captured = value;
            value = '';
            if (error || restoreFailed) reject(error || safeError('TERMINAL_RESTORE_FAILED'));
            else resolve(captured);
        };
        const onError = () => finish(safeError('TERMINAL_INPUT_FAILED'));
        const onEnd = () => finish(safeError('TERMINAL_INPUT_CLOSED'));
        const onInterrupt = () => finish(safeError('AUTH_INPUT_CANCELLED'));
        const onData = chunk => {
            for (const character of decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))) {
                if (character === '\r' || character === '\n') { finish(); return; }
                if (character === '\u0003' || character === '\u0004') { onInterrupt(); return; }
                if (character === '\u007f' || character === '\b') value = [...value].slice(0, -1).join('');
                else if (character === '\u0015') value = '';
                else if (/[\p{Cc}\p{Cf}]/u.test(character)) { finish(safeError('TERMINAL_CONTROL_INPUT_FORBIDDEN')); return; }
                else value += character;
                if (Buffer.byteLength(value, 'utf8') > 16384) { finish(safeError('AUTH_INPUT_TOO_LARGE')); return; }
            }
        };
        input.on('data', onData);
        input.once('error', onError);
        input.once('end', onEnd);
        input.once('close', onEnd);
        signals.once('SIGINT', onInterrupt);
        signals.once('SIGTERM', onInterrupt);
        try {
            input.setRawMode(true);
            output.write(label);
            input.resume();
        } catch { finish(safeError('TERMINAL_INPUT_FAILED')); }
    });
}

async function promptCredentials(deps) {
    const email = (await readHiddenLine('Admin email (hidden): ', deps)).trim();
    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw safeError('AUTH_EMAIL_INVALID');
    const password = await readHiddenLine('Admin password (hidden): ', deps);
    if (!password.length) throw safeError('AUTH_PASSWORD_REQUIRED');
    return {email, password};
}

async function requestAccessJson(input, deps = {}) {
    const {method, path, token, body} = input;
    const raw = /^\/admin\/exercise-examples\/([^/]+)\/translations$/.exec(path);
    const login = method === 'POST' && path === '/auth/login';
    const catalog = method === 'GET' && path === '/exercise-examples';
    if (!(login || method === 'GET' && (path === '/users' || catalog || raw && validUuid(raw[1])))) {
        throw safeError('ACCESS_API_ROUTE_FORBIDDEN');
    }
    const headers = {Accept: 'application/json', 'Accept-Encoding': 'identity'};
    let encoded;
    if (login) {
        if (!object(body) || Object.keys(body).length !== 2 || typeof body.email !== 'string' || typeof body.password !== 'string') {
            throw safeError('AUTH_CREDENTIALS_INVALID');
        }
        encoded = Buffer.from(JSON.stringify({email: body.email, password: body.password}), 'utf8');
        if (encoded.length > MAX_LOGIN_BYTES) { encoded.fill(0); throw safeError('AUTH_REQUEST_TOO_LARGE'); }
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = String(encoded.length);
    } else {
        if (body !== undefined) throw safeError('ACCESS_GET_BODY_FORBIDDEN');
        if (!validToken(token)) throw safeError('AUTH_TOKEN_INVALID');
        headers.Authorization = `Bearer ${token}`;
        headers['Accept-Language'] = 'en';
    }
    const limit = catalog ? MAX_CATALOG_BYTES : MAX_LOGIN_BYTES;
    try {
        return await new Promise((resolve, reject) => {
            let request;
            let timer;
            let settled = false;
            const finish = (error, result) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (error) reject(error); else resolve(result);
            };
            try {
                request = (deps.https || https).request(new URL(path, API_BASE), {
                    method, headers, rejectUnauthorized: true,
                }, response => {
                    const statusCode = response.statusCode;
                    response.on('error', () => finish(safeError('ACCESS_HTTP_RESPONSE_FAILED')));
                    response.on('aborted', () => finish(safeError('ACCESS_HTTP_RESPONSE_ABORTED')));
                    if (statusCode !== 200) {
                        finish(null, {statusCode, json: undefined});
                        response.destroy();
                        return;
                    }
                    const length = response.headers['content-length'];
                    const encoding = String(response.headers['content-encoding'] || 'identity').trim().toLowerCase();
                    const type = String(response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
                    if (encoding !== 'identity' || type !== 'application/json') {
                        finish(safeError('ACCESS_HTTP_CONTENT_INVALID'));
                        response.destroy();
                        return;
                    }
                    if (length !== undefined && (!/^\d+$/.test(String(length)) || Number(length) > limit)) {
                        finish(safeError('ACCESS_HTTP_BODY_TOO_LARGE'));
                        response.destroy();
                        return;
                    }
                    let count = 0;
                    const chunks = [];
                    response.on('data', chunk => {
                        count += chunk.length;
                        if (count > limit) { finish(safeError('ACCESS_HTTP_BODY_TOO_LARGE')); response.destroy(); }
                        else chunks.push(Buffer.from(chunk));
                    });
                    response.on('end', () => {
                        if (settled) return;
                        if (length !== undefined && count !== Number(length)) { finish(safeError('ACCESS_HTTP_BODY_TRUNCATED')); return; }
                        let json;
                        try { json = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks))); }
                        catch { finish(safeError('ACCESS_HTTP_JSON_INVALID')); return; }
                        finish(null, {statusCode, json});
                    });
                });
                request.on('error', () => finish(safeError('ACCESS_HTTP_REQUEST_FAILED')));
                timer = setTimeout(() => { finish(safeError('ACCESS_HTTP_TIMEOUT')); request.destroy(); }, TIMEOUT_MS);
                if (encoded) request.write(encoded);
                request.end();
            } catch {
                if (request) request.destroy();
                finish(safeError('ACCESS_HTTP_REQUEST_FAILED'));
            }
        });
    } finally { if (encoded) encoded.fill(0); }
}

async function authenticate(credentials, send) {
    let response;
    try {
        response = await send({method: 'POST', path: '/auth/login', body: credentials});
    } finally {
        credentials.email = '';
        credentials.password = '';
    }
    if (response.statusCode !== 200) throw safeError('ADMIN_LOGIN_REJECTED', response.statusCode);
    const auth = response.json;
    if (!object(auth) || !validUuid(auth.id) || !validToken(auth.accessToken) || !validToken(auth.refreshToken)) {
        throw safeError('AUTH_RESPONSE_INVALID');
    }
    const session = {id: auth.id.toLowerCase(), token: auth.accessToken};
    delete auth.accessToken;
    delete auth.refreshToken;
    return session;
}

async function checkAccess(session, send) {
    const summary = {
        status: 'access_pending', authenticated: true, adminRole: false, profilePresent: false,
        catalogVerified: false, catalogCount: 0, adminTranslationsRouteVerified: false,
        translationsRevisionVerified: false, requiredLanguageCount: LANGUAGES.length,
        observedLanguageCount: 0, requiredLanguagesObserved: false, publicationPerformed: false,
    };
    const user = await send({method: 'GET', path: '/users', token: session.token});
    if (user.statusCode !== 200 || !object(user.json) || !validUuid(user.json.id)
        || user.json.id.toLowerCase() !== session.id || !['admin', 'default'].includes(user.json.role)
        || !(user.json.profile === null || object(user.json.profile) && validUuid(user.json.profile.id))) {
        throw safeError('SELF_USER_CHECK_FAILED', user.statusCode);
    }
    summary.adminRole = user.json.role === 'admin';
    summary.profilePresent = user.json.profile !== null;
    if (!summary.adminRole || !summary.profilePresent) return summary;
    const catalog = await send({method: 'GET', path: '/exercise-examples', token: session.token});
    if (catalog.statusCode !== 200 || !Array.isArray(catalog.json)) throw safeError('ACCESS_CATALOG_CHECK_FAILED', catalog.statusCode);
    const seen = new Set();
    for (const row of catalog.json) {
        const entity = row?.entity;
        if (!object(entity) || !validUuid(entity.id) || seen.has(entity.id.toLowerCase())
            || typeof entity.name !== 'string' || typeof entity.imageUrl !== 'string') throw safeError('ACCESS_CATALOG_SHAPE_INVALID');
        seen.add(entity.id.toLowerCase());
    }
    summary.catalogVerified = true;
    summary.catalogCount = seen.size;
    if (!seen.size) return summary;
    const id = [...seen][0];
    const raw = await send({method: 'GET', path: `/admin/exercise-examples/${id}/translations`, token: session.token});
    if (raw.statusCode !== 200) return summary;
    const json = raw.json;
    if (!object(json) || !validUuid(json.id) || json.id.toLowerCase() !== id || !object(json.base)
        || !validText(json.base.name) || !validText(json.base.description) || !Array.isArray(json.translations)) {
        throw safeError('ACCESS_TRANSLATIONS_SHAPE_INVALID');
    }
    const languages = new Set();
    for (const row of json.translations) {
        if (!object(row) || !LANGUAGES.includes(row.language) || languages.has(row.language)
            || !validText(row.name) || !validText(row.description)) throw safeError('ACCESS_TRANSLATIONS_SHAPE_INVALID');
        languages.add(row.language);
    }
    summary.adminTranslationsRouteVerified = true;
    summary.translationsRevisionVerified = typeof json.translationsRevision === 'string'
        && json.translationsRevision.length === 64 && /^[a-f0-9]{64}$/.test(json.translationsRevision);
    summary.observedLanguageCount = languages.size;
    summary.requiredLanguagesObserved = LANGUAGES.every(language => languages.has(language));
    // An old card may legitimately have fewer stored languages. This observes
    // its rows; it does not establish or replace the target API's locale contract.
    if (summary.translationsRevisionVerified) summary.status = 'admin_access_verified';
    return summary;
}

async function run(args, deps = {}) {
    const publish = deps.publisherRun || publisher.run;
    if (args.mode === 'help') return {status: 'help', usage: 'exercise-admin-access.cjs [--check] | --publisher <publish-exercise flags>'};
    if (!['check', 'publisher'].includes(args.mode)) throw safeError('ACCESS_MODE_INVALID');
    if (args.mode === 'publisher') {
        // Validate the complete package before requesting credentials. An
        // offline publisher invocation must not prompt or touch the network.
        const preflight = await publish({...args.publisherArgs, mode: 'offline'});
        if (args.publisherArgs.mode === 'offline') return preflight;
    }
    const send = deps.requestAccessJson || requestAccessJson;
    const credentials = await (deps.promptCredentials || promptCredentials)(deps.terminal);
    let session;
    try {
        session = await authenticate(credentials, send);
        const access = await checkAccess(session, send);
        if (args.mode === 'check') return access;
        if (access.status !== 'admin_access_verified') throw safeError('ADMIN_ACCESS_PREREQUISITES_PENDING');
        const publication = await publish(args.publisherArgs, {token: session.token});
        return {status: publication.status, access, publication};
    } finally {
        credentials.email = '';
        credentials.password = '';
        if (session) session.token = '';
    }
}

module.exports = {authenticate, checkAccess, parseArguments, promptCredentials, readHiddenLine, requestAccessJson, run};
if (require.main === module) Promise.resolve().then(() => run(parseArguments(process.argv.slice(2)))).then(result => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!['help', 'admin_access_verified', 'offline_validated', 'verified'].includes(result.status)) process.exitCode = 1;
}).catch(error => {
    const code = typeof error?.safeCode === 'string' && /^[A-Z][A-Z0-9_]+$/.test(error.safeCode) ? error.safeCode : 'ADMIN_ACCESS_FAILED';
    process.stderr.write(`${JSON.stringify({status: 'FAIL', code})}\n`);
    process.exitCode = 1;
});
