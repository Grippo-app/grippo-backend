#!/usr/bin/env node
'use strict';

// Inspect and plan by default. --upload is an explicit, conditional S3 write;
// authorization and decoded-pixel/visual review are established by the workflow.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {readPreview, loadPolicy, MAX_MEDIA_BYTES} = require('./exercise-package.cjs');
const {JOURNAL_ROOT, assertLegacyJournalEmpty, inspectDirectory, readPrivateFile} = require('./exercise-state.cjs');
const {awsEnvironment, verifyPublisherProfile} = require('./exercise-aws-access.cjs');

class MediaError extends Error {
    constructor(at, code) {
        super(code);
        this.issue = {path: at, code};
    }
}
const fail = (at, code) => { throw new MediaError(at, code); };
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const checksumBase64 = hex => Buffer.from(hex, 'hex').toString('base64');

function parseArguments(argv) {
    const args = {upload: false, verify: false};
    for (let index = 0; index < argv.length; index++) {
        const flag = argv[index];
        if (flag === '--upload') {
            if (args.upload) fail('$.cli', 'DUPLICATE_FLAG');
            args.upload = true;
        } else if (flag === '--verify') {
            if (args.verify) fail('$.cli', 'DUPLICATE_FLAG');
            args.verify = true;
        } else if (['--file', '--stem', '--out', '--preview', '--expected-package-sha256'].includes(flag)) {
            const key = flag.slice(2);
            if (args[key] !== undefined || argv[index + 1] === undefined) fail('$.cli', 'UNIQUE_FLAGS_REQUIRED');
            args[key] = argv[++index];
        } else {
            fail('$.cli', 'UNKNOWN_FLAG');
        }
    }
    if (!args.file || !args.stem || !args.out) fail('$.cli', 'FILE_STEM_OUT_REQUIRED');
    if (!path.isAbsolute(args.file) || !path.isAbsolute(args.out)) fail('$.cli', 'ABSOLUTE_FILE_AND_OUT_REQUIRED');
    if (args.upload && args.verify) fail('$.cli', 'UPLOAD_VERIFY_MUTUALLY_EXCLUSIVE');
    if ((args.upload || args.verify) && (!args.preview || !path.isAbsolute(args.preview)
        || !args['expected-package-sha256'])) fail('$.cli', 'REVIEWED_PREVIEW_AND_PACKAGE_HASH_REQUIRED');
    if (!args.upload && !args.verify && (args.preview || args['expected-package-sha256'])) fail('$.cli', 'PREVIEW_REQUIRES_UPLOAD_OR_VERIFY');
    return args;
}

const fingerprint = stat => ({dev: stat.dev, ino: stat.ino, bytes: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs});
const sameFingerprint = (left, right) => Object.keys(left).every(key => left[key] === right[key]);

function readSource(file) {
    let fd;
    try {
        if (path.extname(file) !== '.webp') fail('$.file', 'WEBP_EXTENSION_REQUIRED');
        const named = fs.lstatSync(file);
        if (!named.isFile() || named.isSymbolicLink()) fail('$.file', 'REGULAR_FILE_REQUIRED');
        if (named.size > MAX_MEDIA_BYTES) fail('$.file', 'MEDIA_BODY_TOO_LARGE');
        fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
        const before = fs.fstatSync(fd);
        if (!before.isFile() || !sameFingerprint(fingerprint(named), fingerprint(before))) fail('$.file', 'SOURCE_CHANGED_DURING_READ');
        const bytes = fs.readFileSync(fd);
        const after = fs.fstatSync(fd);
        if (!sameFingerprint(fingerprint(before), fingerprint(after)) || bytes.length !== before.size) fail('$.file', 'SOURCE_CHANGED_DURING_READ');
        return {bytes, sha256: sha256(bytes), stat: fingerprint(after)};
    } catch (error) {
        if (error instanceof MediaError) throw error;
        fail('$.file', 'SOURCE_READ_FAILED');
    } finally {
        if (fd !== undefined) fs.closeSync(fd);
    }
}

function inspectWebP(bytes, policy) {
    // Structural inspection follows the Google WebP RIFF specification.
    // It does not decode the compressed pixels or establish visual correctness.
    if (bytes.length < 20 || bytes.toString('latin1', 0, 4) !== 'RIFF'
        || bytes.toString('latin1', 8, 12) !== 'WEBP') fail('$.file', 'RIFF_WEBP_HEADER_REQUIRED');
    if (bytes.readUInt32LE(4) + 8 !== bytes.length) fail('$.file', 'RIFF_FILE_SIZE_MISMATCH');
    const chunks = [];
    for (let offset = 12; offset < bytes.length;) {
        if (offset + 8 > bytes.length) fail('$.file', 'TRUNCATED_CHUNK_HEADER');
        const kind = bytes.toString('latin1', offset, offset + 4);
        const length = bytes.readUInt32LE(offset + 4);
        const start = offset + 8;
        const end = start + length;
        if (end + (length & 1) > bytes.length) fail('$.file', 'TRUNCATED_CHUNK_DATA');
        if ((length & 1) && bytes[end] !== 0) fail('$.file', 'NONZERO_RIFF_PADDING');
        chunks.push({kind, data: bytes.subarray(start, end)});
        offset = end + (length & 1);
    }
    if (chunks.some(chunk => chunk.kind === 'ALPH')) fail('$.file', 'ALPHA_NOT_ALLOWED');
    if (chunks.some(chunk => ['ANIM', 'ANMF'].includes(chunk.kind))) fail('$.file', 'ANIMATION_NOT_ALLOWED');
    const extended = chunks.filter(chunk => chunk.kind === 'VP8X');
    const bitstreams = chunks.filter(chunk => ['VP8 ', 'VP8L'].includes(chunk.kind));
    if (extended.length > 1 || bitstreams.length !== 1) fail('$.file', 'SINGLE_IMAGE_BITSTREAM_REQUIRED');
    if (extended.length && chunks[0].kind !== 'VP8X') fail('$.file', 'VP8X_MUST_BE_FIRST');
    let canvas;
    if (extended.length) {
        const header = extended[0].data;
        if (header.length !== 10 || (header[0] & 0xc1) || header[1] || header[2] || header[3]) fail('$.file', 'INVALID_VP8X_HEADER');
        if (header[0] & 0x10) fail('$.file', 'ALPHA_NOT_ALLOWED');
        if (header[0] & 0x02) fail('$.file', 'ANIMATION_NOT_ALLOWED');
        canvas = {width: 1 + header.readUIntLE(4, 3), height: 1 + header.readUIntLE(7, 3)};
    }
    const {kind, data} = bitstreams[0];
    let width;
    let height;
    if (kind === 'VP8 ') {
        if (data.length < 11 || data[0] & 1 || ((data[0] >> 1) & 7) > 3
            || !(data[0] & 0x10) || data.toString('hex', 3, 6) !== '9d012a'
            || (data.readUIntLE(0, 3) >> 5) + 10 > data.length) fail('$.file', 'INVALID_VP8_FRAME_HEADER');
        width = data.readUInt16LE(6) & 0x3fff;
        height = data.readUInt16LE(8) & 0x3fff;
    } else {
        if (data.length < 6 || data[0] !== 0x2f) fail('$.file', 'INVALID_VP8L_HEADER');
        const header = data.readUInt32LE(1);
        if (header >>> 29) fail('$.file', 'UNSUPPORTED_VP8L_VERSION');
        if (header & 0x10000000) fail('$.file', 'ALPHA_NOT_ALLOWED');
        width = 1 + (header & 0x3fff);
        height = 1 + ((header >>> 14) & 0x3fff);
    }
    if (!width || !height || canvas && (canvas.width !== width || canvas.height !== height)) fail('$.file', 'CANVAS_BITSTREAM_DIMENSIONS_MISMATCH');
    if (width !== policy.width || height !== policy.height) fail('$.file', 'MEDIA_DIMENSIONS_MISMATCH');
    return {format: 'webp', width, height, bitstream: kind.trim(), extended: Boolean(extended.length), alphaFlag: false, animatedFlag: false};
}

function syncDirectory(directory) {
    const fd = fs.openSync(directory, fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY ?? 0));
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

function writeNew(file, value, created, journalRoot) {
    let fd;
    try {
        if (journalRoot) inspectDirectory(path.dirname(file), {root: journalRoot});
        fd = fs.openSync(file, 'wx', 0o600);
        if (journalRoot) {
            const stat = fs.fstatSync(fd);
            if (stat.uid !== process.getuid() || (stat.mode & 0o7777) !== 0o600) throw new Error('JOURNAL_FILE_UNSAFE');
        }
        created?.push(file);
        fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`);
        fs.fsyncSync(fd);
        // Persist the new directory entry as well as the file's contents.
        syncDirectory(path.dirname(file));
    } catch {
        fail('$.out', 'ARTIFACT_WRITE_FAILED');
    } finally {
        if (fd !== undefined) fs.closeSync(fd);
    }
}

function createPlanDirectory(out, plan, qa) {
    try { fs.mkdirSync(out, {mode: 0o700}); } catch { fail('$.out', 'NEW_OUTPUT_DIRECTORY_REQUIRED'); }
    const created = [];
    try {
        syncDirectory(path.dirname(out));
        writeNew(path.join(out, 'media-plan.json'), plan, created);
        writeNew(path.join(out, 'media-qa.json'), qa, created);
    } catch (error) {
        // Only these fresh artifacts belong to this invocation.
        for (const file of created.reverse()) {
            try { fs.unlinkSync(file); } catch { /* Leave other files alone. */ }
        }
        try { fs.rmdirSync(out); } catch { /* Never recursively remove another writer's files. */ }
        throw error;
    }
}

function upload(plan, original, out, journalRoot = JOURNAL_ROOT, legacyJournalRoot) {
    assertLegacyJournalEmpty(legacyJournalRoot);
    // A named profile may have been edited since setup. Check the exact local
    // credential process and restricted actor before recording any upload intent.
    verifyPublisherProfile();
    const current = readSource(plan.sourcePath);
    if (current.sha256 !== original.sha256 || !sameFingerprint(current.stat, original.stat)) fail('$.file', 'SOURCE_CHANGED_BEFORE_UPLOAD');
    const started = {outcome: 'started', automaticRetry: false, startedAt: new Date().toISOString(), publicReadbackPending: true,
        packageSha256: plan.packageSha256, sha256: plan.sha256, bucket: plan.bucket, region: plan.region, key: plan.key};
    // Stable per-object intent survives a changed --out or copied preview. An
    // unfinished or completed attempt is reconciled read-only, never replayed.
    const objectIdentity = sha256(`${plan.bucket}/${plan.key}`);
    try { inspectDirectory(journalRoot, {root: journalRoot, create: true}); } catch (error) {
        if (error instanceof MediaError) throw error;
        fail('$.upload', error.safeCode || 'JOURNAL_UNAVAILABLE');
    }
    const intentFile = path.join(journalRoot, `s3-${objectIdentity}.json`);
    const resultFile = path.join(journalRoot, `s3-${objectIdentity}-result.json`);
    if ([intentFile, resultFile].some(file => readPrivateFile(file, journalRoot) !== null)) {
        fail('$.upload', 'PREVIOUS_UPLOAD_ATTEMPT_REQUIRES_RECONCILIATION');
    }
    writeNew(intentFile, started, undefined, journalRoot);
    writeNew(path.join(out, 'media-upload-started.json'), started);
    const args = [
        's3api', 'put-object', '--bucket', plan.bucket, '--region', plan.region,
        '--profile', 'grippo-exercise-publisher-keychain',
        '--endpoint-url', `https://s3.${plan.region}.amazonaws.com`,
        '--key', plan.key, '--body', plan.sourcePath, '--content-type', plan.contentType,
        '--if-none-match', '*', '--checksum-algorithm', 'SHA256', '--checksum-sha256', plan.checksumSHA256,
        '--output', 'json', '--no-cli-pager',
        '--cli-connect-timeout', '10', '--cli-read-timeout', '30',
    ];
    // No shell, ACL, IAM changes, or SDK/CLI automatic retries. The server-side
    // checksum also protects the gap between revalidation and AWS reading --body.
    const result = spawnSync('aws', args, {
        shell: false, encoding: 'utf8', timeout: 50000, maxBuffer: 1024 * 1024,
        env: awsEnvironment(),
    });
    let outcome = 'outcome_unknown';
    let code = 'AWS_COMMAND_OUTCOME_UNKNOWN';
    if (result.error?.code === 'ENOENT') {
        outcome = 'failed'; code = 'AWS_CLI_NOT_FOUND';
    } else if (result.status === 0 && !result.error && !result.signal) {
        try {
            const response = JSON.parse(result.stdout);
            if (response.ChecksumSHA256 === plan.checksumSHA256) {
                outcome = 'uploaded'; code = 'S3_CHECKSUM_CONFIRMED';
            } else {
                code = 'AWS_RESPONSE_CHECKSUM_UNCONFIRMED';
            }
        } catch {
            code = 'AWS_RESPONSE_INVALID';
        }
    } else if (!result.error && !result.signal && Number.isInteger(result.status) && result.status !== 0) {
        // Read only known service error identifiers; never persist CLI stderr,
        // stdout, credentials, request traces, or unrecognized error text.
        const known = {
            PreconditionFailed: 'OBJECT_EXISTS_NO_OVERWRITE',
            ConditionalRequestConflict: 'CONDITIONAL_REQUEST_CONFLICT',
            AccessDenied: 'AWS_ACCESS_DENIED', BadDigest: 'AWS_CHECKSUM_REJECTED',
            NoSuchBucket: 'AWS_BUCKET_NOT_FOUND', InvalidAccessKeyId: 'AWS_AUTH_REJECTED',
            InvalidClientTokenId: 'AWS_AUTH_REJECTED',
            ExpiredToken: 'AWS_AUTH_REJECTED', InvalidToken: 'AWS_AUTH_REJECTED',
            SignatureDoesNotMatch: 'AWS_AUTH_REJECTED',
        };
        for (const [serviceCode, safeCode] of Object.entries(known)) {
            if (typeof result.stderr === 'string' && result.stderr.includes(`(${serviceCode})`)) {
                outcome = 'failed'; code = safeCode;
                break;
            }
        }
    }
    let identifiers = {};
    if (outcome === 'uploaded') {
        const response = JSON.parse(result.stdout);
        if (typeof response.ETag === 'string' && /^"[a-f0-9-]+"$/.test(response.ETag)) identifiers.ETag = response.ETag;
        if (typeof response.VersionId === 'string' && /^[a-zA-Z0-9+/=._-]{1,1024}$/.test(response.VersionId)) identifiers.VersionId = response.VersionId;
    }
    const receipt = {
        outcome, code, bucket: plan.bucket, region: plan.region, key: plan.key,
        publicUrl: plan.publicUrl, sourcePath: plan.sourcePath, bytes: plan.bytes,
        sha256: plan.sha256, checksumSHA256: plan.checksumSHA256,
        packageSha256: plan.packageSha256, ...identifiers,
        automaticRetry: false, publicReadbackPending: true, finishedAt: new Date().toISOString(),
    };
    try {
        writeNew(path.join(out, 'media-upload.json'), receipt);
        writeNew(resultFile, receipt, undefined, journalRoot);
    } catch {
        fail('$.upload', 'UPLOAD_RECEIPT_WRITE_FAILED_OUTCOME_UNKNOWN');
    }
    return receipt;
}

async function main() {
    const args = parseArguments(process.argv.slice(2));
    const policy = loadPolicy();
    if (new RegExp(policy.stemPattern).exec(args.stem)?.[0] !== args.stem) fail('$.stem', 'LOWERCASE_ENGLISH_SNAKE_CASE_REQUIRED');
    const source = readSource(args.file);
    const inspected = inspectWebP(source.bytes, policy);
    const key = `${policy.prefix}${args.stem}.${policy.format}`;
    if (Buffer.byteLength(key, 'utf8') > 1024) fail('$.stem', 'S3_KEY_TOO_LONG');
    const plan = {
        mode: args.upload ? 'conditional_upload' : args.verify ? 'public_readback' : 'offline_plan',
        bucket: policy.bucket, region: policy.region, key,
        publicUrl: new URL(key, policy.publicBaseUrl).href,
        sourcePath: args.file, bytes: source.bytes.length, sha256: source.sha256,
        checksumSHA256: checksumBase64(source.sha256), contentType: policy.contentType,
        overwrite: false, condition: 'If-None-Match: *', uploadRequested: args.upload,
    };
    if (args.upload || args.verify) {
        const preview = readPreview(args.preview, args['expected-package-sha256']);
        if (['bucket', 'region', 'key', 'publicUrl', 'contentType', 'bytes', 'sha256']
            .some(field => preview.media[field] !== plan[field])) fail('$.preview', 'APPROVED_MEDIA_PLAN_MISMATCH');
        plan.packageSha256 = preview.packageSha256;
    }
    const qa = {
        status: 'HEADERS_PASS', scope: 'container_headers_only', ...inspected,
        sourcePath: plan.sourcePath, bytes: plan.bytes, sha256: plan.sha256,
        checks: ['webp_extension', 'riff_webp_signature', 'exact_riff_file_size', 'chunk_bounds_and_padding',
            'single_image_header_dimensions', 'no_alpha_or_animation_flags_or_chunks', 'safe_object_key'],
        remainingValidation: ['full_image_decode', 'decoded_pixel_opacity', 'visual_and_canon_review',
            'authorized_upload', 'public_HTTP_checksum_and_content_type_readback'],
        upload: 'pending', publicReadbackPending: true,
    };
    createPlanDirectory(args.out, plan, qa);
    if (args.verify) {
        const {verifyPublicMedia} = require('./exercise-http.cjs');
        const receipt = await verifyPublicMedia(plan);
        writeNew(path.join(args.out, 'media-public.json'), {...receipt, packageSha256: plan.packageSha256});
        process.stdout.write(`${JSON.stringify({status: 'MEDIA_VERIFIED', uploadedByThisCommand: false})}\n`);
        return;
    }
    if (!args.upload) {
        process.stdout.write(`${JSON.stringify({status: 'HEADERS_PASS', mode: 'offline_plan', upload: 'pending'})}\n`);
        return;
    }
    const receipt = upload(plan, source, args.out);
    process.stdout.write(`${JSON.stringify({outcome: receipt.outcome, code: receipt.code, publicReadbackPending: true})}\n`);
    if (receipt.outcome !== 'uploaded') process.exitCode = 1;
}

main().catch(error => {
    const issue = error instanceof MediaError ? error.issue : {path: '$.runtime', code: error.safeCode || 'MEDIA_OPERATION_FAILED'};
    process.stderr.write(`${JSON.stringify({status: 'FAIL', issues: [issue]})}\n`);
    process.exitCode = 1;
});
