'use strict';

// One local user's publication history must survive checkout cleanup/cloning.
// These locations are fixed in production, with injection only in internal tests.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Bind to the OS user's home, rather than a caller-supplied HOME override.
const PRIVATE_ROOT = path.join(os.userInfo().homedir, '.grippo-private');
const JOURNAL_ROOT = path.join(PRIVATE_ROOT, 'exercise-create/publication-journal');
const LEGACY_JOURNAL_ROOT = path.resolve(__dirname, '../../../../tasks/exercise-create/.publication-journal');
const uid = () => process.getuid();
const failure = code => Object.assign(new Error(code), {safeCode: code});

function syncDirectory(directory) {
    const fd = fs.openSync(directory, fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY ?? 0));
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

function inspectDirectory(directory, {root = JOURNAL_ROOT, create = false} = {}) {
    const absolute = path.resolve(directory);
    const journal = path.resolve(root);
    if (absolute !== journal && !absolute.startsWith(`${journal}${path.sep}`)) throw failure('JOURNAL_DIRECTORY_UNSAFE');
    const managed = journal === JOURNAL_ROOT ? PRIVATE_ROOT : journal;
    let current = path.parse(absolute).root;
    for (const segment of absolute.slice(current.length).split(path.sep)) {
        current = path.join(current, segment);
        let created = false;
        let stat;
        try { stat = fs.lstatSync(current); }
        catch (error) {
            if (error.code !== 'ENOENT') throw failure('JOURNAL_DIRECTORY_UNAVAILABLE');
            if (!create) return false;
            try { fs.mkdirSync(current, {mode: 0o700}); created = true; }
            catch (mkdirError) { if (mkdirError.code !== 'EEXIST') throw failure('JOURNAL_DIRECTORY_UNAVAILABLE'); }
            stat = fs.lstatSync(current);
        }
        const owned = stat.uid === uid();
        const isManaged = current === managed || current.startsWith(`${managed}${path.sep}`);
        const mode = stat.mode & 0o7777;
        // Root-owned sticky /tmp is a legitimate ancestor of isolated test state.
        const safeAncestor = (owned || stat.uid === 0) && (!(mode & 0o022) || stat.uid === 0 && Boolean(mode & 0o1000));
        if (!stat.isDirectory() || stat.isSymbolicLink() || (isManaged ? !owned || mode !== 0o700 : !safeAncestor)) {
            throw failure('JOURNAL_DIRECTORY_UNSAFE');
        }
        if (created) {
            try { syncDirectory(path.dirname(current)); }
            catch { throw failure('JOURNAL_DIRECTORY_SYNC_FAILED'); }
        }
    }
    return true;
}

function readPrivateFile(file, root = JOURNAL_ROOT) {
    if (!inspectDirectory(path.dirname(file), {root})) return null;
    let fd;
    try {
        const named = fs.lstatSync(file);
        if (!named.isFile() || named.isSymbolicLink() || named.uid !== uid() || (named.mode & 0o7777) !== 0o600) {
            throw failure('JOURNAL_FILE_UNSAFE');
        }
        fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
        const opened = fs.fstatSync(fd);
        if (!opened.isFile() || opened.dev !== named.dev || opened.ino !== named.ino
            || opened.uid !== uid() || (opened.mode & 0o7777) !== 0o600) throw failure('JOURNAL_FILE_UNSAFE');
        return fs.readFileSync(fd);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error.safeCode ? error : failure('JOURNAL_READ_FAILED');
    } finally { if (fd !== undefined) fs.closeSync(fd); }
}

function assertLegacyJournalEmpty(directory = LEGACY_JOURNAL_ROOT) {
    const absolute = path.resolve(directory);
    let current = path.parse(absolute).root;
    for (const segment of absolute.slice(current.length).split(path.sep)) {
        current = path.join(current, segment);
        let stat;
        try { stat = fs.lstatSync(current); }
        catch (error) {
            if (error.code === 'ENOENT') return;
            throw failure('LEGACY_JOURNAL_MIGRATION_REQUIRED');
        }
        if (!stat.isDirectory() || stat.isSymbolicLink()) throw failure('LEGACY_JOURNAL_MIGRATION_REQUIRED');
    }
    try {
        if (fs.readdirSync(absolute).length) throw failure('LEGACY_JOURNAL_MIGRATION_REQUIRED');
    } catch { throw failure('LEGACY_JOURNAL_MIGRATION_REQUIRED'); }
}

function assertPublicationHistoryReady({root = PRIVATE_ROOT, migrationStatus} = {}) {
    const setup = path.join(root, 'mac-setup');
    if (!inspectDirectory(setup, {root})) return;
    const lock = readPrivateFile(path.join(setup, 'import.lock'), root);
    const imports = path.join(setup, 'imports');
    const hasImports = inspectDirectory(imports, {root}) && fs.readdirSync(imports).length > 0;
    // Original installations have no Mac transfer receipts. Their existing
    // journal gates still apply; no Mac-only dependency is loaded here.
    if (!lock && !hasImports) return;
    let status;
    try {
        status = migrationStatus ? migrationStatus() : require('../../../../scripts/internal/mac-transfer.cjs')
            .createTransfer({home: path.dirname(root)}).checkMigrationStatus({includeServerAccess: false});
    } catch { throw failure('PUBLICATION_HISTORY_MIGRATION_UNVERIFIED'); }
    if (status?.status !== 'ready') throw failure('PUBLICATION_HISTORY_MIGRATION_INCOMPLETE');
}

module.exports = {JOURNAL_ROOT, LEGACY_JOURNAL_ROOT, assertLegacyJournalEmpty, assertPublicationHistoryReady, inspectDirectory, readPrivateFile};
