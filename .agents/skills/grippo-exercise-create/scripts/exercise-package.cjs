'use strict';

// Shared local package identity. A matching hash binds bytes/destinations;
// it never proves that the human authorized an external operation.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const API_BASE = 'https://grippo-app.com';
// Tool resource bound, not a claimed S3/catalog restriction. All stages agree.
const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
// Current Nest/Express JSON parser uses its default 100 KiB request limit.
const MAX_API_REQUEST_BYTES = 100 * 1024;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = code => { throw Object.assign(new Error(code), {safeCode: code}); };

function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
}

function loadPolicy() {
    const policy = JSON.parse(fs.readFileSync(path.join(__dirname, '../references/media-policy.json'), 'utf8'));
    const expected = {
        bucket: 'grippo-bucket', region: 'eu-north-1', prefix: 'example-images/',
        publicBaseUrl: 'https://dsikfdo0rac0e.cloudfront.net/', format: 'webp',
        contentType: 'image/webp', width: 1024, height: 1024,
        stemPattern: '^[a-z0-9]+(?:_[a-z0-9]+)*$', overwrite: false,
    };
    if (!object(policy) || canonical(policy) !== canonical(expected)) fail('MEDIA_POLICY_DRIFT');
    return policy;
}

function readJson(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { fail('PACKAGE_JSON_READ_FAILED'); }
}

function checkedMedia(plan, verifyFile = true) {
    const policy = loadPolicy();
    if (!object(plan)) fail('MEDIA_PLAN_REQUIRED');
    const stem = typeof plan.key === 'string' && plan.key.startsWith(policy.prefix)
        && plan.key.endsWith('.webp') ? plan.key.slice(policy.prefix.length, -5) : '';
    if (new RegExp(policy.stemPattern).exec(stem)?.[0] !== stem || !stem
        || Buffer.byteLength(plan.key, 'utf8') > 1024) fail('MEDIA_KEY_POLICY_MISMATCH');
    if (plan.bucket !== policy.bucket || plan.region !== policy.region
        || plan.publicUrl !== new URL(plan.key, policy.publicBaseUrl).href
        || plan.contentType !== policy.contentType) fail('MEDIA_DESTINATION_MISMATCH');
    if (!/^[a-f0-9]{64}$/.test(plan.sha256) || !Number.isSafeInteger(plan.bytes) || plan.bytes <= 0
        || typeof plan.sourcePath !== 'string' || !path.isAbsolute(plan.sourcePath)) fail('MEDIA_IDENTITY_REQUIRED');
    if (plan.bytes > MAX_MEDIA_BYTES) fail('MEDIA_BODY_TOO_LARGE');
    if (verifyFile) {
        let bytes;
        try {
            const stat = fs.lstatSync(plan.sourcePath);
            if (!stat.isFile() || stat.isSymbolicLink()) fail('MEDIA_REGULAR_FILE_REQUIRED');
            if (stat.size > MAX_MEDIA_BYTES) fail('MEDIA_BODY_TOO_LARGE');
            if (stat.size !== plan.bytes) fail('MEDIA_SOURCE_CHANGED');
            bytes = fs.readFileSync(plan.sourcePath);
        } catch (error) {
            if (error.safeCode) throw error;
            fail('MEDIA_SOURCE_READ_FAILED');
        }
        if (bytes.length !== plan.bytes || sha256(bytes) !== plan.sha256) fail('MEDIA_SOURCE_CHANGED');
    }
    return Object.fromEntries(['bucket', 'region', 'key', 'publicUrl', 'contentType', 'sha256', 'bytes', 'sourcePath']
        .map(key => [key, plan[key]]));
}

function identity(preview) {
    const {sourcePath, ...media} = checkedMedia(preview.media, false);
    return sha256(canonical({schemaVersion: 1, target: preview.target, draft: preview.draft, payloadCandidate: preview.payloadCandidate, media}));
}

function readPreview(file, expectedHash) {
    const preview = readJson(file);
    if (!object(preview) || preview.schemaVersion !== 1 || preview.status !== 'local_preview'
        || !object(preview.target) || preview.target.apiBase !== API_BASE
        || !Array.isArray(preview.target.languages) || !object(preview.payloadCandidate)
        || !object(preview.draft) || Object.hasOwn(preview.draft, 'imageUrl')) fail('PREVIEW_PACKAGE_REQUIRED');
    checkedMedia(preview.media);
    if (preview.payloadCandidate.imageUrl !== preview.media.publicUrl
        || preview.packageSha256 !== identity(preview)) fail('PREVIEW_IDENTITY_MISMATCH');
    if (expectedHash !== undefined && (!/^[a-f0-9]{64}$/.test(expectedHash)
        || preview.packageSha256 !== expectedHash)) fail('APPROVED_PACKAGE_CHANGED');
    return preview;
}

module.exports = {API_BASE, MAX_MEDIA_BYTES, MAX_API_REQUEST_BYTES, canonical, checkedMedia, identity, loadPolicy, readJson, readPreview, sha256};
