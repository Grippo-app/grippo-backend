'use strict';

// Deliberately inert on require. CLI callers cannot supply another host or
// transport; injected transports are only available to isolated harnesses.
const https = require('node:https');
const {API_BASE, MAX_MEDIA_BYTES, MAX_API_REQUEST_BYTES, checkedMedia, sha256} = require('./exercise-package.cjs');

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const LANGUAGES = ['en', 'ua', 'ru', 'pt-BR', 'pt-PT'];
const MAX_JSON_RESPONSE_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 20000;

function safeError(code, httpStatus) {
    const error = new Error(code);
    error.safeCode = code;
    if (Number.isInteger(httpStatus)) error.httpStatus = httpStatus;
    return error;
}

function tokenHeader(token) {
    if (typeof token !== 'string' || token.length < 16 || token.length > 16384 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
        throw safeError('ADMIN_TOKEN_REQUIRED');
    }
    return `Bearer ${token}`;
}

function receive(url, options, limit, deps = {}) {
    const transport = deps.https || https;
    return new Promise((resolve, reject) => {
        let request;
        let timer;
        let settled = false;
        const finish = (error, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) reject(error); else resolve(value);
        };
        try {
            request = transport.request(url, {...options, rejectUnauthorized: true}, response => {
                const statusCode = response.statusCode;
                response.on('error', () => finish(safeError('HTTP_RESPONSE_FAILED', statusCode)));
                if (!Number.isInteger(statusCode)) {
                    response.destroy();
                    finish(safeError('HTTP_STATUS_MISSING'));
                    return;
                }
                if (statusCode >= 300 && statusCode < 400) {
                    response.destroy();
                    finish(safeError('HTTP_REDIRECT_FORBIDDEN', statusCode));
                    return;
                }
                const lengthHeader = response.headers['content-length'];
                if (lengthHeader !== undefined && (!/^\d+$/.test(String(lengthHeader)) || Number(lengthHeader) > limit)) {
                    response.destroy();
                    finish(safeError('HTTP_BODY_TOO_LARGE', statusCode));
                    return;
                }
                let count = 0;
                const chunks = [];
                response.on('data', chunk => {
                    count += chunk.length;
                    if (count > limit) {
                        response.destroy();
                        finish(safeError('HTTP_BODY_TOO_LARGE', statusCode));
                    } else chunks.push(Buffer.from(chunk));
                });
                response.on('end', () => {
                    if (lengthHeader !== undefined && count !== Number(lengthHeader)) {
                        finish(safeError('HTTP_BODY_TRUNCATED', statusCode));
                    } else finish(null, {statusCode, headers: response.headers, bytes: Buffer.concat(chunks)});
                });
                response.on('aborted', () => finish(safeError('HTTP_RESPONSE_ABORTED', statusCode)));
            });
            request.on('error', () => finish(safeError('HTTP_REQUEST_FAILED')));
            timer = setTimeout(() => {
                finish(safeError('HTTP_TIMEOUT'));
                request.destroy();
            }, TIMEOUT_MS);
            if (options.body) request.write(options.body);
            request.end();
        } catch {
            if (request) request.destroy();
            finish(safeError('HTTP_REQUEST_FAILED'));
        }
    });
}

async function verifyPublicMedia(media, deps = {}) {
    checkedMedia(media, false);
    if (media.bytes > MAX_MEDIA_BYTES) throw safeError('MEDIA_BODY_TOO_LARGE');
    const response = await receive(new URL(media.publicUrl), {
        method: 'GET', headers: {Accept: 'image/webp', 'Accept-Encoding': 'identity'},
    }, media.bytes, deps);
    if (response.statusCode !== 200) throw safeError('CDN_STATUS_NOT_200', response.statusCode);
    const encoding = response.headers['content-encoding'];
    if (encoding !== undefined && String(encoding).trim().toLowerCase() !== 'identity') {
        throw safeError('CDN_CONTENT_ENCODING_UNSUPPORTED', response.statusCode);
    }
    const contentType = String(response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'image/webp') throw safeError('CDN_CONTENT_TYPE_MISMATCH', response.statusCode);
    if (response.bytes.length !== media.bytes || sha256(response.bytes) !== media.sha256) {
        throw safeError('CDN_BYTES_MISMATCH', response.statusCode);
    }
    return {
        status: 'verified', publicUrl: media.publicUrl, sha256: media.sha256,
        bytes: media.bytes, contentType, checkedAt: new Date().toISOString(),
    };
}

async function requestJson(input, deps = {}) {
    const {method, path, token, body, language} = input;
    const detail = /^\/exercise-examples\/([^/]+)$/.exec(path);
    const raw = /^\/admin\/exercise-examples\/([^/]+)\/translations$/.exec(path);
    const allowedGet = path === '/exercise-examples' || detail && UUID.test(detail[1]) || raw && UUID.test(raw[1]);
    if (!(method === 'GET' && allowedGet || method === 'POST' && path === '/admin/exercise-examples')) {
        throw safeError('API_ROUTE_FORBIDDEN');
    }
    if (language !== undefined && !LANGUAGES.includes(language)) throw safeError('API_LANGUAGE_FORBIDDEN');
    if (method === 'GET' && body !== undefined) throw safeError('GET_BODY_FORBIDDEN');
    let encoded;
    if (method === 'POST') {
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw safeError('POST_OBJECT_REQUIRED');
        encoded = Buffer.from(JSON.stringify(body), 'utf8');
        if (encoded.length > MAX_API_REQUEST_BYTES) throw safeError('API_BODY_TOO_LARGE');
    }
    const headers = {Authorization: tokenHeader(token), Accept: 'application/json', 'Accept-Encoding': 'identity'};
    if (language !== undefined) headers['Accept-Language'] = language;
    if (encoded) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = String(encoded.length);
    }
    const response = await receive(new URL(path, API_BASE), {method, headers, body: encoded}, MAX_JSON_RESPONSE_BYTES, deps);
    let json;
    try { json = JSON.parse(response.bytes.toString('utf8')); } catch { json = undefined; }
    // Return only what the reconciler needs. Callers must never print bodies.
    return {statusCode: response.statusCode, headers: response.headers, json};
}

module.exports = {UUID, requestJson, safeError, verifyPublicMedia};
