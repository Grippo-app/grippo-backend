#!/usr/bin/env node
'use strict';

// No application/bootstrap or environment files. A direct invocation is the only
// entry point that opens a connection or private files. Flags/approval files bind
// the reviewed operation; they do not supply human permission or stop writers.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const core = require('./internal/exercise-translations.cjs');
const root = path.resolve(__dirname, '..');

function check(condition, code) { if (!condition) throw Object.assign(new Error(code), {code}); }
function fileHash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function backupHash(file, expectedSize) {
    const descriptor = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
        const before = fs.fstatSync(descriptor);
        check(before.isFile() && before.size === expectedSize, 'BACKUP_FILE_MISMATCH');
        const digest = createHash('sha256');
        const buffer = Buffer.allocUnsafe(65536);
        let count;
        while ((count = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) digest.update(buffer.subarray(0, count));
        const after = fs.fstatSync(descriptor);
        check(before.size === after.size && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs,
            'BACKUP_CHANGED_DURING_CHECK');
        return digest.digest('hex');
    } finally { fs.closeSync(descriptor); }
}
function privatePath(file, {missing = false} = {}) {
    check(typeof file === 'string' && path.isAbsolute(file), 'ABSOLUTE_PRIVATE_PATH_REQUIRED');
    const parent = path.dirname(file);
    check(fs.realpathSync(parent) === parent, 'SYMLINK_PATH_FORBIDDEN');
    const directory = fs.lstatSync(parent);
    check(directory.isDirectory() && (directory.mode & 0o077) === 0
        && (!process.getuid || directory.uid === process.getuid()), 'PRIVATE_DIRECTORY_REQUIRED');
    const relative = path.relative(root, file);
    check(relative.startsWith(`..${path.sep}`), 'PRIVATE_ARTIFACT_MUST_BE_OUTSIDE_CHECKOUT');
    if (!missing || fs.existsSync(file)) {
        const stat = fs.lstatSync(file);
        check(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && (stat.mode & 0o077) === 0
            && (!process.getuid || stat.uid === process.getuid()), 'PRIVATE_REGULAR_FILE_REQUIRED');
    }
    return file;
}
function readPrivate(file) { return JSON.parse(fs.readFileSync(privatePath(file), 'utf8')); }
function verifyBackupArtifacts(backup) {
    check(backup && /^[a-f0-9]{64}$/.test(backup.sha256 || '') && Number.isSafeInteger(backup.bytes) && backup.bytes > 0
        && backup.snapshot && backup.latest && backup.recovery && backup.source?.root && backup.source?.db,
    'BACKUP_RECEIPT_REQUIRED');
    check(new Set([backup.snapshot, backup.latest, backup.recovery]).size === 3, 'BACKUP_PATHS_OVERLAP');
    const inodes = new Set();
    for (const file of [backup.snapshot, backup.latest, backup.recovery]) {
        check(path.isAbsolute(file) && fs.realpathSync(file) === file, 'BACKUP_SYMLINK_FORBIDDEN');
        const stat = fs.lstatSync(file);
        check(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && (stat.mode & 0o077) === 0
            && (!process.getuid || stat.uid === process.getuid()) && stat.size === backup.bytes,
        'BACKUP_FILE_MISMATCH');
        const inode = `${stat.dev}/${stat.ino}`;
        check(!inodes.has(inode), 'BACKUP_COPIES_NOT_INDEPENDENT');
        inodes.add(inode);
        check(backupHash(file, backup.bytes) === backup.sha256, 'BACKUP_CHECKSUM_MISMATCH');
    }
    privatePath(backup.recovery);
}
function syncDirectory(directory) {
    const descriptor = fs.openSync(directory, 'r');
    try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
}
function writeNew(file, value) {
    privatePath(file, {missing: true});
    const descriptor = fs.openSync(file, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY | fs.constants.O_NOFOLLOW, 0o600);
    try { fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`); fs.fsyncSync(descriptor); }
    finally { fs.closeSync(descriptor); }
    syncDirectory(path.dirname(file));
}
function receiptWriter(file) {
    // Append-only, synchronous journal: a disconnect leaves the last fully synced
    // PREPARED/TRANSACTION/COMMITTING event available for manual reconciliation.
    privatePath(file, {missing: true});
    const descriptor = fs.openSync(file, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY | fs.constants.O_NOFOLLOW, 0o600);
    syncDirectory(path.dirname(file));
    return {
        write(event) { fs.writeFileSync(descriptor, `${JSON.stringify(event)}\n`); fs.fsyncSync(descriptor); },
        close() { fs.closeSync(descriptor); },
    };
}
function readReceipt(file) {
    const lines = fs.readFileSync(privatePath(file), 'utf8').trim().split('\n');
    check(lines.length > 0, 'EMPTY_RECEIPT');
    // A partial final line is never silently discarded: establish state manually.
    const events = lines.map(line => JSON.parse(line));
    check(events.every(event => event.attemptId === events[0].attemptId), 'MIXED_RECEIPT');
    return events[events.length - 1];
}
function parseArgs(args) {
    const options = {};
    const flags = new Set(['--apply', '--reconcile']);
    const values = new Set(['--connection', '--dataset', '--manifest', '--code-revision', '--receipt', '--approval', '--replacements']);
    for (let index = 0; index < args.length; index += 1) {
        const flag = args[index];
        check((flags.has(flag) || values.has(flag)) && options[flag] === undefined, 'INVALID_ARGUMENTS');
        if (flags.has(flag)) options[flag] = true;
        else {
            const value = args[++index];
            check(value && !value.startsWith('--'), 'INVALID_ARGUMENTS');
            options[flag] = value;
        }
    }
    check(!(options['--apply'] && options['--reconcile']), 'INVALID_ARGUMENTS');
    for (const required of ['--connection', '--dataset', '--manifest', '--code-revision']) {
        check(typeof options[required] === 'string', 'MISSING_ARGUMENTS');
    }
    check(options['--code-revision'].length === 40 && /^[a-f0-9]{40}$/.test(options['--code-revision']), 'INVALID_CODE_REVISION');
    check(!(options['--replacements'] && (options['--apply'] || options['--reconcile'])), 'REPLACEMENTS_ONLY_IN_PLAN');
    if (options['--apply']) check(options['--approval'] && options['--receipt'], 'APPLY_REQUIRES_APPROVAL_AND_RECEIPT');
    if (options['--reconcile']) check(options['--receipt'], 'RECONCILE_REQUIRES_RECEIPT');
    return options;
}

async function main(args = process.argv.slice(2)) {
    if (args.length === 1 && args[0] === '--help') {
        process.stdout.write('Usage: node scripts/import-exercise-translations.cjs --connection /private/connection.json --dataset /private/dataset.json --manifest /private/manifest.json --code-revision FULL_SHA [--replacements /private/exact-replacements.json]\n'
            + 'Default: read-only dry-run, creates a new private manifest.\n'
            + 'Apply: same arguments + --apply --approval /private/approval.json --receipt /private/new-attempt.jsonl\n'
            + 'Reconcile: same arguments + --reconcile --receipt /private/existing-attempt.jsonl\n'
            + 'No automatic retry. Human approval, verified fresh dump and an actual writer freeze are required independently.\n');
        return 0;
    }
    const options = parseArgs(args);
    const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
    check(revision === options['--code-revision'], 'CHECKOUT_REVISION_MISMATCH');
    const toolSha256 = core.hash(['scripts/import-exercise-translations.cjs', 'scripts/internal/exercise-translations.cjs',
        'scripts/sql/add-portuguese-locales.sql'].map(file => [file, fileHash(fs.readFileSync(path.join(root, file)))]));
    const dataset = readPrivate(options['--dataset']);
    core.validateDataset(dataset);
    let manifest;
    let approval;
    let backupReceiptSha256;
    if (options['--apply'] || options['--reconcile']) {
        manifest = readPrivate(options['--manifest']);
        check(manifest.toolSha256 === toolSha256 && manifest.codeRevision === revision, 'TOOL_PROVENANCE_MISMATCH');
    }
    if (options['--apply']) {
        // Applying code must be committed locally. This does not push anything.
        const committedTools = execFileSync('git', ['ls-tree', '--name-only', 'HEAD', '--',
            'scripts/import-exercise-translations.cjs', 'scripts/internal/exercise-translations.cjs',
            'scripts/sql/add-portuguese-locales.sql'], {cwd: root, encoding: 'utf8'}).trim().split('\n');
        check(committedTools.length === 3 && committedTools.every(file => file.startsWith('scripts/')), 'TOOLS_NOT_COMMITTED');
        execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'src', 'scripts'], {cwd: root, stdio: 'ignore'});
        approval = readPrivate(options['--approval']);
        check(approval && approval.manifestSha256 === core.hash(manifest)
            && approval.toolSha256 === toolSha256 && approval.writersFrozen === true
            && typeof approval.approvalReference === 'string' && approval.approvalReference.trim().length > 0
            && typeof approval.targetLabel === 'string' && approval.targetLabel.trim().length > 0
            && core.hash(approval.target) === core.hash(manifest.target)
            && typeof approval.attemptId === 'string' && approval.attemptId.length === 36
            && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(approval.attemptId),
        'APPROVAL_BINDING_MISMATCH');
        const backup = readPrivate(approval.backupReceipt);
        verifyBackupArtifacts(backup);
        backupReceiptSha256 = fileHash(fs.readFileSync(privatePath(approval.backupReceipt)));
        check(approval.backupReceiptSha256 === backupReceiptSha256
            && approval.backupSourceSha256 === core.hash(backup.source)
            && core.hash(approval.backupDatabaseIdentity) === core.hash(manifest.target)
            && approval.backupSourceVerified === true, 'BACKUP_PROVENANCE_BINDING_MISMATCH');
        // Docker receipt identifies its daemon/container; the SQL session may be
        // reached through a local tunnel. The operator must independently verify
        // that mapping and retain it in the approval. No flag proves that fact.
    }
    const connection = readPrivate(options['--connection']);
    check(connection && Object.keys(connection).every(key => ['host', 'port', 'database', 'user', 'password', 'ssl'].includes(key))
        && ['host', 'database', 'user', 'password'].every(key => typeof connection[key] === 'string' && connection[key].length > 0)
        && Number.isInteger(connection.port) && connection.port > 0 && connection.port <= 65535
        && (connection.ssl === false || connection.ssl === true
            || (connection.ssl && connection.ssl.rejectUnauthorized === true && typeof connection.ssl.ca === 'string')),
    'EXPLICIT_CONNECTION_REQUIRED');
    // pg otherwise accepts ambient PGHOST/PGSERVICE/PGOPTIONS/PGSSLMODE defaults.
    for (const name of Object.keys(process.env)) if (name.startsWith('PG')) delete process.env[name];
    const {Client} = require('pg');
    const client = new Client({...connection, application_name: `grippo_pt_${approval?.attemptId || 'readonly'}`,
        connectionTimeoutMillis: 5000,
        options: `-c default_transaction_read_only=${options['--apply'] ? 'off' : 'on'} -c statement_timeout=30000 -c lock_timeout=5000`});
    client.on('error', () => {});
    let journal;
    try {
        await client.connect();
        if (options['--reconcile']) {
            const result = await core.reconcileImport(client, {dataset, manifest, receipt: readReceipt(options['--receipt'])});
            process.stdout.write(`${JSON.stringify(result)}\n`);
            return result.outcome === 'UNKNOWN' || result.outcome === 'MISMATCH' ? 2 : 0;
        }
        if (options['--apply']) {
            journal = receiptWriter(options['--receipt']);
            const result = await core.applyImport(client, {dataset, manifest, codeRevision: revision,
                attemptId: approval.attemptId, onReceipt: event => journal.write({...event, targetLabel: approval.targetLabel,
                    approvalReference: approval.approvalReference, toolSha256, backupReceiptSha256})});
            process.stdout.write(`${JSON.stringify({phase: result.receipt.phase, changed: result.changed, attemptId: approval.attemptId})}\n`);
        } else {
            const replacements = options['--replacements'] ? readPrivate(options['--replacements']) : [];
            manifest = await core.planImport(client, {dataset, codeRevision: revision, replacements});
            manifest.toolSha256 = toolSha256;
            writeNew(options['--manifest'], manifest);
            process.stdout.write(`${JSON.stringify({mode: 'DRY_RUN', records: dataset.records.length,
                manifestSha256: core.hash(manifest), datasetSha256: manifest.datasetSha256, toolSha256})}\n`);
        }
        return 0;
    } finally {
        journal?.close();
        await client.end().catch(() => {});
    }
}

if (require.main === module) main().then(code => { process.exitCode = code; }, error => {
    // Never log driver error details, query parameters, config or dataset text.
    process.stderr.write(`Translation operation stopped: ${/^[A-Z_]+$/.test(error.code || '') ? error.code : 'FAILED'}\n`);
    process.exitCode = 1;
});

module.exports = {parseArgs, verifyBackupArtifacts, main};
