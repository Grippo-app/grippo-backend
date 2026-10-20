'use strict';

// Migration has no network operations. Only the two publisher records and the
// complete fixed publication journal enter an authenticated, encrypted bundle.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const {promisify, TextDecoder} = require('node:util');

const scrypt = promisify(crypto.scrypt);
const FORMAT = 'grippo-mac-transfer';
const SCRYPT = Object.freeze({N: 131072, r: 8, p: 1, keyLength: 32});
const MAX_FILE = 16 * 1024 * 1024;
const MAX_JOURNAL = 48 * 1024 * 1024;
const MAX_PAYLOAD = 68 * 1024 * 1024;
const MAX_ENVELOPE = 92 * 1024 * 1024;
const MAX_ENTRIES = 10000;
const ERROR = /^MAC_TRANSFER_[A-Z_]+$/;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = code => Object.assign(new Error(code), {code, safeCode: code});
const sanitize = (error, fallback) => {
    const code = error?.safeCode || error?.code;
    return fail(typeof code === 'string' && /^(?:MAC_(?:TRANSFER|ACCESS|AWS|SERVER)_[A-Z_]+|VAULT_[A-Z_]+|LEGACY_JOURNAL_MIGRATION_REQUIRED)$/.test(code) ? code : fallback);
};
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value, names) => object(value) && Object.keys(value).sort().join(',') === [...names].sort().join(',');
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const validTime = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && !Number.isNaN(Date.parse(value));
const text = bytes => new TextDecoder('utf-8', {fatal: true}).decode(bytes);
const serialize = value => Buffer.from(JSON.stringify(value));

function childEnvironment() {
    const env = {...process.env};
    for (const name of Object.keys(env)) {
        if (name.startsWith('DYLD_') || ['NODE_OPTIONS', 'NODE_PATH', 'PYTHONPATH', 'PYTHONHOME', 'LD_PRELOAD', 'LD_LIBRARY_PATH'].includes(name)) delete env[name];
    }
    return env;
}

async function nativePassphrase({confirm = false} = {}) {
    const question = confirm ? 'Повторите пароль шифрования переноса Grippo.' : 'Пароль шифрования переноса Grippo: минимум 16 символов. Он понадобится на новом Mac.';
    const script = `text returned of (display dialog ${JSON.stringify(question)} default answer "" with hidden answer buttons {"Отмена", "OK"} default button "OK" cancel button "Отмена" with title "Grippo — безопасный перенос")`;
    return new Promise((resolve, reject) => {
        let child;
        let size = 0;
        let settled = false;
        let timer;
        const chunks = [];
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            for (const chunk of chunks) chunk.fill(0);
            if (error) reject(error); else resolve(result);
        };
        try { child = spawn('/usr/bin/osascript', ['-e', script], {stdio: ['ignore', 'pipe', 'pipe'], shell: false, env: childEnvironment()}); }
        catch { finish(fail('MAC_TRANSFER_PROMPT_FAILED')); return; }
        child.on('error', () => finish(fail('MAC_TRANSFER_PROMPT_FAILED')));
        child.stderr.on('data', chunk => chunk.fill(0));
        child.stdout.on('data', chunk => {
            size += chunk.length;
            if (settled || size > 4096) { chunk.fill(0); child.kill(); finish(fail('MAC_TRANSFER_PASSPHRASE_INVALID')); }
            else chunks.push(chunk);
        });
        child.on('close', code => {
            if (settled) return;
            if (code !== 0) { finish(fail('MAC_TRANSFER_PROMPT_CANCELLED')); return; }
            const response = Buffer.concat(chunks);
            try {
                const result = Buffer.from(text(response).replace(/\n$/, ''));
                finish(null, result);
            } catch { finish(fail('MAC_TRANSFER_PASSPHRASE_INVALID')); }
            finally { response.fill(0); }
        });
        timer = setTimeout(() => { child.kill(); finish(fail('MAC_TRANSFER_PROMPT_TIMEOUT')); }, 300000);
    });
}

function passphraseValid(value) {
    if (!Buffer.isBuffer(value) || value.length > 1024) throw fail('MAC_TRANSFER_PASSPHRASE_INVALID');
    let decoded;
    try { decoded = text(value); } catch { throw fail('MAC_TRANSFER_PASSPHRASE_INVALID'); }
    if (Array.from(decoded.trim()).length < 16 || /[\p{Cc}\p{Cf}]/u.test(decoded)) throw fail('MAC_TRANSFER_PASSPHRASE_INVALID');
}

function base64(value, limit, exact) {
    if (typeof value !== 'string' || value.length > Math.ceil(limit / 3) * 4 || /[^A-Za-z0-9+/=]/.test(value)) throw fail('MAC_TRANSFER_BUNDLE_INVALID');
    const decoded = Buffer.from(value, 'base64');
    if (decoded.toString('base64') !== value || decoded.length > limit || exact !== undefined && decoded.length !== exact) {
        decoded.fill(0);
        throw fail('MAC_TRANSFER_BUNDLE_INVALID');
    }
    return decoded;
}

function relativeName(value) {
    if (typeof value !== 'string' || value.length < 1 || value.length > 512 || value.split('/').some(part => !/^[A-Za-z0-9_.-]{1,128}$/.test(part) || ['.', '..'].includes(part))) throw fail('MAC_TRANSFER_JOURNAL_PATH_INVALID');
    return value;
}

function statToken(stat) {
    return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs, stat.mode, stat.uid, stat.nlink].map(String).join(':');
}

function createTransfer({home = os.userInfo().homedir, access, serverAccess, promptPassphrase = nativePassphrase, assertLegacyJournalEmpty, platform = process.platform, uid = process.getuid?.()} = {}) {
    // Injection is confined to this internal module for isolated temporary tests;
    // the user-facing command never accepts home, target, or record overrides.
    const userHome = path.resolve(home);
    const privateRoot = path.join(userHome, '.grippo-private');
    const journalRoot = path.join(privateRoot, 'exercise-create', 'publication-journal');
    const setupRoot = path.join(privateRoot, 'mac-setup');
    const importsRoot = path.join(setupRoot, 'imports');
    const lockPath = path.join(setupRoot, 'import.lock');
    const getAccess = () => access || require('./mac-access.cjs');
    const getServerAccess = () => serverAccess || require('./mac-server-access.cjs');
    const legacyCheck = assertLegacyJournalEmpty || require('../../.agents/skills/grippo-exercise-create/scripts/exercise-state.cjs').assertLegacyJournalEmpty;

    function platformCheck(options) {
        if (platform !== 'darwin' || !Number.isInteger(uid) || uid === 0) throw fail('MAC_TRANSFER_MACOS_USER_REQUIRED');
        if (options?.writersStopped !== true) throw fail('MAC_TRANSFER_STOP_WRITERS_REQUIRED');
    }

    function statMaybe(file) {
        try { return fs.lstatSync(file, {bigint: true}); }
        catch (error) { if (error.code === 'ENOENT') return null; throw fail('MAC_TRANSFER_PATH_UNSAFE'); }
    }

    function checkDirectory(directory, {create = false, privateLeaf = false} = {}) {
        const absolute = path.resolve(directory);
        let current = path.parse(absolute).root;
        for (const component of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
            current = path.join(current, component);
            let stat = statMaybe(current);
            if (!stat) {
                if (!create) return false;
                if (current !== privateRoot && !current.startsWith(`${privateRoot}${path.sep}`)) throw fail('MAC_TRANSFER_PATH_UNSAFE');
                try { fs.mkdirSync(current, {mode: 0o700}); syncDirectory(path.dirname(current)); }
                catch { throw fail('MAC_TRANSFER_DIRECTORY_CREATE_FAILED'); }
                stat = statMaybe(current);
            }
            const mode = Number(stat.mode) & 0o7777;
            const owned = Number(stat.uid) === uid;
            const managed = current === privateRoot || current.startsWith(`${privateRoot}${path.sep}`);
            const safeAncestor = (owned || Number(stat.uid) === 0) && (!(mode & 0o022) || Number(stat.uid) === 0 && Boolean(mode & 0o1000));
            if (!stat.isDirectory() || stat.isSymbolicLink() || (managed ? !owned || mode !== 0o700 : !safeAncestor)) throw fail('MAC_TRANSFER_PATH_UNSAFE');
            if (privateLeaf && current === absolute && (!owned || mode !== 0o700)) throw fail('MAC_TRANSFER_PATH_UNSAFE');
        }
        return true;
    }

    function syncDirectory(directory) {
        const fd = fs.openSync(directory, fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY || 0) | (fs.constants.O_NOFOLLOW || 0));
        try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    }

    function checkedRead(file, limit) {
        if (!checkDirectory(path.dirname(file))) throw fail('MAC_TRANSFER_PATH_UNSAFE');
        const named = statMaybe(file);
        if (!named || !named.isFile() || named.isSymbolicLink() || Number(named.uid) !== uid || (Number(named.mode) & 0o7777) !== 0o600 || named.nlink !== 1n || named.size > BigInt(limit)) throw fail('MAC_TRANSFER_FILE_UNSAFE');
        let fd;
        let bytes;
        try {
            fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
            if (statToken(fs.fstatSync(fd, {bigint: true})) !== statToken(named)) throw fail('MAC_TRANSFER_FILE_CHANGED');
            // Read at most the checked size plus one byte, even if another
            // process grows the file after fstat. Never read an unbounded fd.
            bytes = Buffer.alloc(Number(named.size) + 1);
            let count = 0;
            while (count < bytes.length) {
                const read = fs.readSync(fd, bytes, count, bytes.length - count, null);
                if (!read) break;
                count += read;
            }
            if (count !== Number(named.size) || statToken(fs.fstatSync(fd, {bigint: true})) !== statToken(named) || statToken(fs.lstatSync(file, {bigint: true})) !== statToken(named)) throw fail('MAC_TRANSFER_FILE_CHANGED');
            return {bytes: bytes.subarray(0, count), token: statToken(named)};
        } catch (error) { bytes?.fill(0); throw ERROR.test(error.code || '') ? error : fail('MAC_TRANSFER_FILE_READ_FAILED'); }
        finally { if (fd !== undefined) fs.closeSync(fd); }
    }

    function createOnly(file, bytes) {
        if (!checkDirectory(path.dirname(file), {privateLeaf: true})) throw fail('MAC_TRANSFER_PATH_UNSAFE');
        let fd;
        try {
            fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | (fs.constants.O_NOFOLLOW || 0), 0o600);
            const stat = fs.fstatSync(fd, {bigint: true});
            if (!stat.isFile() || Number(stat.uid) !== uid || (Number(stat.mode) & 0o7777) !== 0o600 || stat.nlink !== 1n) throw fail('MAC_TRANSFER_FILE_UNSAFE');
            fs.writeFileSync(fd, bytes);
            fs.fsyncSync(fd);
        } catch (error) { throw error.code === 'EEXIST' ? fail('MAC_TRANSFER_DESTINATION_EXISTS') : ERROR.test(error.code || '') ? error : fail('MAC_TRANSFER_FILE_WRITE_FAILED'); }
        finally { if (fd !== undefined) fs.closeSync(fd); }
        syncDirectory(path.dirname(file));
    }

    function bundlePath(file, output) {
        if (typeof file !== 'string' || !path.isAbsolute(file) || path.resolve(file) !== file || !/^[A-Za-z0-9_.-]{1,128}$/.test(path.basename(file))) throw fail('MAC_TRANSFER_BUNDLE_PATH_INVALID');
        if (!checkDirectory(path.dirname(file), {privateLeaf: true})) throw fail('MAC_TRANSFER_PATH_UNSAFE');
        let directory = path.dirname(file);
        while (true) {
            if (statMaybe(path.join(directory, '.git'))) throw fail('MAC_TRANSFER_BUNDLE_IN_REPOSITORY');
            const parent = path.dirname(directory);
            if (parent === directory) break;
            directory = parent;
        }
        // A bundle must never become publication history or an imported artifact.
        if (file === privateRoot || file.startsWith(`${journalRoot}${path.sep}`) || file.startsWith(`${importsRoot}${path.sep}`)) throw fail('MAC_TRANSFER_BUNDLE_PATH_INVALID');
        if (output && statMaybe(file)) throw fail('MAC_TRANSFER_DESTINATION_EXISTS');
        return file;
    }

    function snapshot() {
        const entries = [];
        const tokens = [];
        let total = 0;
        if (!checkDirectory(journalRoot)) return {journal: {exists: false, entries}, token: hash(serialize([]))};
        const visit = (directory, relative) => {
            const stat = statMaybe(directory);
            if (!stat || !checkDirectory(directory, {privateLeaf: true})) throw fail('MAC_TRANSFER_JOURNAL_CHANGED');
            tokens.push([relative, statToken(stat)]);
            const names = fs.readdirSync(directory).sort();
            const folded = new Set();
            for (const name of names) {
                const relativePath = relative ? `${relative}/${name}` : name;
                relativeName(relativePath);
                if (folded.has(name.toLowerCase())) throw fail('MAC_TRANSFER_JOURNAL_CASE_COLLISION');
                folded.add(name.toLowerCase());
                if (entries.length >= MAX_ENTRIES) throw fail('MAC_TRANSFER_JOURNAL_TOO_LARGE');
                const full = path.join(directory, name);
                const child = statMaybe(full);
                if (!child || child.isSymbolicLink()) throw fail('MAC_TRANSFER_JOURNAL_UNSAFE');
                if (child.isDirectory()) {
                    entries.push({path: relativePath, type: 'directory'});
                    visit(full, relativePath);
                } else {
                    const read = checkedRead(full, MAX_FILE);
                    total += read.bytes.length;
                    if (total > MAX_JOURNAL) { read.bytes.fill(0); throw fail('MAC_TRANSFER_JOURNAL_TOO_LARGE'); }
                    entries.push({path: relativePath, type: 'file', bytes: read.bytes.length, sha256: hash(read.bytes), data: read.bytes.toString('base64')});
                    tokens.push([relativePath, read.token]);
                    read.bytes.fill(0);
                }
            }
            if (statToken(fs.lstatSync(directory, {bigint: true})) !== statToken(stat)) throw fail('MAC_TRANSFER_JOURNAL_CHANGED');
        };
        visit(journalRoot, '');
        return {journal: {exists: true, entries}, token: hash(serialize(tokens))};
    }

    function validateJournal(journal) {
        if (!keys(journal, ['exists', 'entries']) || typeof journal.exists !== 'boolean' || !Array.isArray(journal.entries) || journal.entries.length > MAX_ENTRIES || !journal.exists && journal.entries.length) throw fail('MAC_TRANSFER_BUNDLE_INVALID');
        if (!journal.exists || !journal.entries.some(entry => entry?.type === 'file' && Number.isSafeInteger(entry.bytes) && entry.bytes > 0)) throw fail('MAC_TRANSFER_JOURNAL_HISTORY_REQUIRED');
        const paths = new Map();
        const folded = new Set();
        let total = 0;
        const decoded = new Map();
        try {
            for (const entry of journal.entries) {
                if (!object(entry) || !['file', 'directory'].includes(entry.type) || !keys(entry, entry.type === 'file' ? ['path', 'type', 'bytes', 'sha256', 'data'] : ['path', 'type'])) throw fail('MAC_TRANSFER_BUNDLE_INVALID');
                relativeName(entry.path);
                if (paths.has(entry.path) || folded.has(entry.path.toLowerCase())) throw fail('MAC_TRANSFER_JOURNAL_CASE_COLLISION');
                paths.set(entry.path, entry);
                folded.add(entry.path.toLowerCase());
                if (entry.type === 'file') {
                    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes > MAX_FILE || !sha(entry.sha256)) throw fail('MAC_TRANSFER_BUNDLE_INVALID');
                    const bytes = base64(entry.data, MAX_FILE);
                    decoded.set(entry.path, bytes);
                    total += bytes.length;
                    if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256 || total > MAX_JOURNAL) throw fail('MAC_TRANSFER_BUNDLE_INVALID');
                }
            }
            for (const entry of journal.entries) {
                const parent = path.posix.dirname(entry.path);
                if (parent !== '.' && paths.get(parent)?.type !== 'directory') throw fail('MAC_TRANSFER_JOURNAL_PATH_INVALID');
            }
            return decoded;
        } catch (error) { for (const bytes of decoded.values()) bytes.fill(0); throw error; }
    }

    function journalConflicts(journal, current) {
        const existing = new Map(current.entries.map(entry => [entry.path.toLowerCase(), entry]));
        for (const entry of journal.entries) {
            const previous = existing.get(entry.path.toLowerCase());
            if (previous && (previous.path !== entry.path || previous.type !== entry.type || entry.type === 'file' && (previous.bytes !== entry.bytes || previous.sha256 !== entry.sha256 || previous.data !== entry.data))) throw fail('MAC_TRANSFER_JOURNAL_CONFLICT');
        }
    }

    function readMetadata(file, limit = 8192) {
        const read = checkedRead(file, limit);
        try {
            const value = JSON.parse(text(read.bytes));
            if (JSON.stringify(value) !== text(read.bytes)) throw fail('MAC_TRANSFER_INTENT_INVALID');
            return value;
        } catch { throw fail('MAC_TRANSFER_INTENT_INVALID'); }
        finally { read.bytes.fill(0); }
    }

    function journalInventory(journal) {
        return journal.entries.map(entry => entry.type === 'file'
            ? {path: entry.path, type: 'file', bytes: entry.bytes, sha256: entry.sha256}
            : {path: entry.path, type: 'directory'});
    }

    function validateInventory(inventory) {
        if (!Array.isArray(inventory) || !inventory.length || inventory.length > MAX_ENTRIES) throw fail('MAC_TRANSFER_INTENT_INVALID');
        const paths = new Map();
        const folded = new Set();
        let total = 0;
        for (const entry of inventory) {
            if (!object(entry) || !['file', 'directory'].includes(entry.type) || !keys(entry, entry.type === 'file' ? ['path', 'type', 'bytes', 'sha256'] : ['path', 'type'])) throw fail('MAC_TRANSFER_INTENT_INVALID');
            relativeName(entry.path);
            if (paths.has(entry.path) || folded.has(entry.path.toLowerCase())) throw fail('MAC_TRANSFER_INTENT_INVALID');
            paths.set(entry.path, entry);
            folded.add(entry.path.toLowerCase());
            if (entry.type === 'file') {
                if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes > MAX_FILE || !sha(entry.sha256)) throw fail('MAC_TRANSFER_INTENT_INVALID');
                total += entry.bytes;
                if (total > MAX_JOURNAL) throw fail('MAC_TRANSFER_INTENT_INVALID');
            }
        }
        for (const entry of inventory) {
            const parent = path.posix.dirname(entry.path);
            if (parent !== '.' && paths.get(parent)?.type !== 'directory') throw fail('MAC_TRANSFER_INTENT_INVALID');
        }
        if (!total) throw fail('MAC_TRANSFER_INTENT_INVALID');
    }

    function validateServerInventory(inventory) {
        if (inventory === null) return;
        if (!keys(inventory, ['schemaVersion', 'sshKey', 'envFile']) || inventory.schemaVersion !== 1 || inventory.sshKey === null && inventory.envFile === null) throw fail('MAC_TRANSFER_INTENT_INVALID');
        for (const kind of ['sshKey', 'envFile']) {
            const item = inventory[kind];
            if (item !== null && (!keys(item, ['bytes', 'sha256']) || !Number.isSafeInteger(item.bytes) || item.bytes < 1 || item.bytes > MAX_FILE || !sha(item.sha256))) throw fail('MAC_TRANSFER_INTENT_INVALID');
        }
    }

    function inspectIntents() {
        const intents = new Map();
        const outcomes = new Map();
        if (!checkDirectory(importsRoot)) return {intents, outcomes};
        const names = fs.readdirSync(importsRoot);
        if (names.length > MAX_ENTRIES) throw fail('MAC_TRANSFER_INTENT_INVALID');
        for (const name of names) {
            if (!/^[a-f0-9]{64}\.(intent|outcome)\.json$/.test(name)) throw fail('MAC_TRANSFER_INTENT_INVALID');
            const identity = name.slice(0, 64);
            const isIntent = name.endsWith('.intent.json');
            const item = readMetadata(path.join(importsRoot, name), isIntent ? 8 * 1024 * 1024 : 8192);
            const expected = ['schemaVersion', 'bundleSha256', 'journalSha256', 'inventorySha256', 'serverAccessSha256', 'createdAt', 'phase', ...(isIntent ? ['inventory', 'serverAccessInventory'] : [])];
            if (!keys(item, expected) || item.schemaVersion !== 1 || item.bundleSha256 !== identity || !sha(item.journalSha256) || !sha(item.inventorySha256) || !sha(item.serverAccessSha256) || !validTime(item.createdAt) || item.phase !== (isIntent ? 'intent' : 'complete')) throw fail('MAC_TRANSFER_INTENT_INVALID');
            if (isIntent) {
                validateInventory(item.inventory);
                if (hash(serialize(item.inventory)) !== item.inventorySha256) throw fail('MAC_TRANSFER_INTENT_INVALID');
                validateServerInventory(item.serverAccessInventory);
                if (hash(serialize(item.serverAccessInventory)) !== item.serverAccessSha256) throw fail('MAC_TRANSFER_INTENT_INVALID');
            }
            (isIntent ? intents : outcomes).set(identity, item);
        }
        for (const [identity, outcome] of outcomes) {
            if (!intents.has(identity) || intents.get(identity).journalSha256 !== outcome.journalSha256 || intents.get(identity).inventorySha256 !== outcome.inventorySha256 || intents.get(identity).serverAccessSha256 !== outcome.serverAccessSha256) throw fail('MAC_TRANSFER_INTENT_INVALID');
        }
        return {intents, outcomes};
    }

    function checkIntents(bundleSha256, journalSha256, inventorySha256, serverAccessSha256) {
        const {intents, outcomes} = inspectIntents();
        for (const [identity, intent] of intents) {
            if (identity === bundleSha256 && (intent.journalSha256 !== journalSha256 || intent.inventorySha256 !== inventorySha256 || intent.serverAccessSha256 !== serverAccessSha256)) throw fail('MAC_TRANSFER_INTENT_INVALID');
            if (identity !== bundleSha256 && !outcomes.has(identity)) throw fail('MAC_TRANSFER_OTHER_IMPORT_PENDING');
        }
    }

    function checkPriorInventories(incomingJournal, currentJournal, incomingServerInventory) {
        const {intents, outcomes} = inspectIntents();
        const planned = new Map(currentJournal.entries.map(entry => [entry.path, entry]));
        for (const entry of incomingJournal.entries) planned.set(entry.path, entry);
        for (const identity of outcomes.keys()) {
            const intent = intents.get(identity);
            for (const expected of intent.inventory) {
                const actual = planned.get(expected.path);
                if (!actual || actual.type !== expected.type || expected.type === 'file' && (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256)) throw fail('MAC_TRANSFER_PRIOR_HISTORY_MISSING');
            }
            if (intent.serverAccessInventory === null) continue;
            const unchanged = {schemaVersion: 1, sshKey: null, envFile: null};
            for (const kind of ['sshKey', 'envFile']) {
                const expected = intent.serverAccessInventory[kind];
                if (expected === null) continue;
                const incoming = incomingServerInventory?.[kind];
                if (incoming) {
                    if (incoming.bytes !== expected.bytes || incoming.sha256 !== expected.sha256) throw fail('MAC_TRANSFER_PRIOR_SERVER_CONFLICT');
                } else unchanged[kind] = expected;
            }
            if (unchanged.sshKey || unchanged.envFile) {
                if (getServerAccess().verifyInventory(unchanged) === false) throw fail('MAC_TRANSFER_PRIOR_SERVER_MISSING');
            }
        }
    }

    function checkMigrationStatus({includeServerAccess = true} = {}) {
        try {
            if (platform !== 'darwin' || !Number.isInteger(uid) || uid === 0) throw fail('MAC_TRANSFER_MACOS_USER_REQUIRED');
            legacyCheck();
            const current = snapshot().journal;
            const {intents, outcomes} = inspectIntents();
            const reasons = [];
            if (!current.exists) reasons.push('PUBLICATION_JOURNAL_MISSING');
            else if (!current.entries.some(entry => entry.type === 'file' && entry.bytes > 0)) reasons.push('PUBLICATION_JOURNAL_EMPTY');
            if (intents.size !== outcomes.size) reasons.push('IMPORT_INCOMPLETE');
            const present = new Map(current.entries.map(entry => [entry.path, entry]));
            for (const intent of intents.values()) {
                if (intent.inventory.some(entry => {
                    const actual = present.get(entry.path);
                    return !actual || actual.type !== entry.type || entry.type === 'file' && (actual.bytes !== entry.bytes || actual.sha256 !== entry.sha256);
                })) {
                    reasons.push('IMPORTED_HISTORY_CHANGED');
                    break;
                }
            }
            if (includeServerAccess) for (const intent of intents.values()) {
                try {
                    if (getServerAccess().verifyInventory(intent.serverAccessInventory) === false) reasons.push('IMPORTED_SERVER_ACCESS_CHANGED');
                } catch { reasons.push('IMPORTED_SERVER_ACCESS_CHANGED'); }
            }
            if (statMaybe(lockPath)) {
                const lock = readMetadata(lockPath);
                if (!keys(lock, ['schemaVersion', 'bundleSha256', 'pid', 'nonce', 'createdAt']) || lock.schemaVersion !== 1 || !sha(lock.bundleSha256) || !Number.isSafeInteger(lock.pid) || lock.pid < 1 || !/^[a-f0-9]{32}$/.test(lock.nonce) || !validTime(lock.createdAt)) throw fail('MAC_TRANSFER_INTENT_INVALID');
                reasons.push('IMPORT_LOCK_PRESENT');
            }
            return {status: reasons.length ? 'pending' : 'ready', reasons, journalEntries: current.entries.length, importIntents: intents.size, completedImports: outcomes.size};
        } catch (error) { throw sanitize(error, 'MAC_TRANSFER_STATUS_FAILED'); }
    }

    async function password(confirm) {
        let first;
        let second;
        try {
            first = await promptPassphrase({confirm: false});
            passphraseValid(first);
            if (confirm) {
                second = await promptPassphrase({confirm: true});
                passphraseValid(second);
                if (first.length !== second.length || !crypto.timingSafeEqual(first, second)) throw fail('MAC_TRANSFER_PASSPHRASE_MISMATCH');
            }
            return Buffer.from(first);
        } finally { if (Buffer.isBuffer(first)) first.fill(0); if (Buffer.isBuffer(second)) second.fill(0); }
    }

    async function encrypt(payload, passphrase) {
        const header = {schemaVersion: 1, format: FORMAT, cipher: 'aes-256-gcm', kdf: 'scrypt', kdfParams: {...SCRYPT}, salt: crypto.randomBytes(16).toString('base64'), iv: crypto.randomBytes(12).toString('base64')};
        const plain = serialize(payload);
        let key;
        try {
            if (plain.length > MAX_PAYLOAD) throw fail('MAC_TRANSFER_JOURNAL_TOO_LARGE');
            key = await scrypt(passphrase, Buffer.from(header.salt, 'base64'), 32, {N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 256 * 1024 * 1024});
            const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.from(header.iv, 'base64'));
            cipher.setAAD(serialize(header));
            const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
            try { return Buffer.from(JSON.stringify({...header, ciphertext: encrypted.toString('base64'), tag: cipher.getAuthTag().toString('base64')}) + '\n'); }
            finally { encrypted.fill(0); }
        } finally { plain.fill(0); key?.fill(0); }
    }

    async function decrypt(encrypted, passphrase) {
        let envelope;
        try { envelope = JSON.parse(text(encrypted)); }
        catch { throw fail('MAC_TRANSFER_BUNDLE_INVALID'); }
        if (!keys(envelope, ['schemaVersion', 'format', 'cipher', 'kdf', 'kdfParams', 'salt', 'iv', 'ciphertext', 'tag']) || envelope.schemaVersion !== 1 || envelope.format !== FORMAT || envelope.cipher !== 'aes-256-gcm' || envelope.kdf !== 'scrypt' || !keys(envelope.kdfParams, Object.keys(SCRYPT)) || Object.keys(SCRYPT).some(name => envelope.kdfParams[name] !== SCRYPT[name]) || JSON.stringify(envelope) + '\n' !== text(encrypted)) throw fail('MAC_TRANSFER_BUNDLE_INVALID');
        const salt = base64(envelope.salt, 16, 16);
        const iv = base64(envelope.iv, 12, 12);
        const tag = base64(envelope.tag, 16, 16);
        const ciphertext = base64(envelope.ciphertext, MAX_PAYLOAD);
        const header = {schemaVersion: 1, format: FORMAT, cipher: 'aes-256-gcm', kdf: 'scrypt', kdfParams: {...SCRYPT}, salt: envelope.salt, iv: envelope.iv};
        let key;
        let plain;
        let partial;
        try {
            key = await scrypt(passphrase, salt, 32, {N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 256 * 1024 * 1024});
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAAD(serialize(header));
            decipher.setAuthTag(tag);
            try { partial = decipher.update(ciphertext); plain = Buffer.concat([partial, decipher.final()]); }
            catch { throw fail('MAC_TRANSFER_AUTHENTICATION_FAILED'); }
            let payload;
            try { payload = JSON.parse(text(plain)); }
            catch { throw fail('MAC_TRANSFER_BUNDLE_INVALID'); }
            if (!keys(payload, ['schemaVersion', 'createdAt', 'records', 'journal', 'serverAccess']) || payload.schemaVersion !== 1 || !validTime(payload.createdAt) || !keys(payload.records, ['admin', 'aws']) || Buffer.byteLength(JSON.stringify(payload.records)) > 64 * 1024 || JSON.stringify(payload) !== text(plain)) throw fail('MAC_TRANSFER_BUNDLE_INVALID');
            return payload;
        } finally { key?.fill(0); plain?.fill(0); partial?.fill(0); ciphertext.fill(0); salt.fill(0); iv.fill(0); tag.fill(0); }
    }

    function acquireLock(bundleSha256, journalSha256, resume) {
        if (statMaybe(lockPath)) {
            if (!resume) throw fail('MAC_TRANSFER_IMPORT_LOCKED');
            const previous = readMetadata(lockPath);
            if (!keys(previous, ['schemaVersion', 'bundleSha256', 'pid', 'nonce', 'createdAt']) || previous.schemaVersion !== 1 || previous.bundleSha256 !== bundleSha256 || !Number.isSafeInteger(previous.pid) || previous.pid < 1 || !/^[a-f0-9]{32}$/.test(previous.nonce) || !validTime(previous.createdAt)) throw fail('MAC_TRANSFER_LOCK_RECONCILIATION_REQUIRED');
            const intentPath = path.join(importsRoot, `${bundleSha256}.intent.json`);
            if (!statMaybe(intentPath)) throw fail('MAC_TRANSFER_LOCK_RECONCILIATION_REQUIRED');
            const intent = readMetadata(intentPath, 8 * 1024 * 1024);
            if (intent.bundleSha256 !== bundleSha256 || intent.journalSha256 !== journalSha256 || intent.phase !== 'intent') throw fail('MAC_TRANSFER_LOCK_RECONCILIATION_REQUIRED');
            try { process.kill(previous.pid, 0); throw fail('MAC_TRANSFER_IMPORT_LOCKED'); }
            catch (error) { if (error.code !== 'ESRCH') throw fail('MAC_TRANSFER_IMPORT_LOCKED'); }
            // Explicit recovery only: the exact authenticated bundle has a
            // durable intent, and the former PID definitely no longer exists.
            // A live or reused PID and EPERM always block recovery.
            const again = readMetadata(lockPath);
            if (JSON.stringify(again) !== JSON.stringify(previous)) throw fail('MAC_TRANSFER_IMPORT_LOCKED');
            fs.unlinkSync(lockPath);
            syncDirectory(setupRoot);
        }
        const marker = {schemaVersion: 1, bundleSha256, pid: process.pid, nonce: crypto.randomBytes(16).toString('hex'), createdAt: new Date().toISOString()};
        try { createOnly(lockPath, serialize(marker)); }
        catch (error) { if (error.code === 'MAC_TRANSFER_DESTINATION_EXISTS') throw fail('MAC_TRANSFER_IMPORT_LOCKED'); throw error; }
        return () => {
            // Never steal a stale lock or another process's lock. A crash leaves
            // a private marker for explicit operator reconciliation before retry.
            const current = readMetadata(lockPath);
            if (JSON.stringify(current) !== JSON.stringify(marker)) throw fail('MAC_TRANSFER_IMPORT_LOCKED');
            fs.unlinkSync(lockPath);
            syncDirectory(setupRoot);
        };
    }

    function verifyImported(journal) {
        const current = snapshot().journal;
        journalConflicts(journal, current);
        const present = new Set(current.entries.map(entry => entry.path));
        if (journal.exists && !current.exists || journal.entries.some(entry => !present.has(entry.path))) throw fail('MAC_TRANSFER_IMPORT_VERIFY_FAILED');
    }

    async function exportBundle(file, options = {}) {
        let passphrase;
        let encrypted;
        try {
            platformCheck(options);
            bundlePath(file, true);
            legacyCheck();
            passphrase = await password(true);
            const before = snapshot();
            if (!before.journal.exists || !before.journal.entries.some(entry => entry.type === 'file' && entry.bytes > 0)) throw fail('MAC_TRANSFER_JOURNAL_HISTORY_REQUIRED');
            if (checkMigrationStatus().status !== 'ready') throw fail('MAC_TRANSFER_SOURCE_MIGRATION_PENDING');
            const records = await getAccess().readRecords();
            await getAccess().preflightRecords(records);
            const selected = {sshKeyFile: options.sshKeyFile, envFile: options.envFile};
            const serverPayload = await getServerAccess().readSelected(selected);
            getServerAccess().validate(serverPayload);
            encrypted = await encrypt({schemaVersion: 1, createdAt: new Date().toISOString(), records, journal: before.journal, serverAccess: serverPayload}, passphrase);
            const serverAfter = await getServerAccess().readSelected(selected);
            if (hash(serialize(serverAfter)) !== hash(serialize(serverPayload))) throw fail('MAC_TRANSFER_SERVER_SOURCE_CHANGED');
            await getAccess().preflightRecords(records);
            const after = snapshot();
            if (before.token !== after.token || JSON.stringify(before.journal) !== JSON.stringify(after.journal)) throw fail('MAC_TRANSFER_JOURNAL_CHANGED');
            legacyCheck();
            bundlePath(file, true);
            createOnly(file, encrypted);
            const readback = checkedRead(file, MAX_ENVELOPE);
            try { if (!crypto.timingSafeEqual(encrypted, readback.bytes)) throw fail('MAC_TRANSFER_EXPORT_VERIFY_FAILED'); }
            finally { readback.bytes.fill(0); }
            return {status: 'EXPORTED', bundleSha256: hash(encrypted), journalEntries: before.journal.entries.length, encrypted: true};
        } catch (error) { throw sanitize(error, 'MAC_TRANSFER_EXPORT_FAILED'); }
        finally { passphrase?.fill(0); encrypted?.fill(0); }
    }

    async function importBundle(file, options = {}) {
        let passphrase;
        let encrypted;
        let decoded;
        let unlock;
        try {
            platformCheck(options);
            bundlePath(file, false);
            legacyCheck();
            encrypted = checkedRead(file, MAX_ENVELOPE).bytes;
            const bundleSha256 = hash(encrypted);
            passphrase = await password(false);
            const payload = await decrypt(encrypted, passphrase);
            getServerAccess().validate(payload.serverAccess);
            const serverAccessInventory = getServerAccess().inventory(payload.serverAccess);
            validateServerInventory(serverAccessInventory);
            const serverAccessSha256 = hash(serialize(serverAccessInventory));
            decoded = validateJournal(payload.journal);
            const journalSha256 = hash(serialize(payload.journal));
            const inventory = journalInventory(payload.journal);
            const inventorySha256 = hash(serialize(inventory));
            // All path, history, credential, and profile conflicts are checked
            // before the first intent, journal, or Keychain write.
            const currentJournal = snapshot().journal;
            journalConflicts(payload.journal, currentJournal);
            checkPriorInventories(payload.journal, currentJournal, serverAccessInventory);
            await getAccess().preflightRecords(payload.records);
            await getAccess().configureAwsProfile({write: false});
            await getServerAccess().preflightImport(payload.serverAccess);
            checkIntents(bundleSha256, journalSha256, inventorySha256, serverAccessSha256);
            checkDirectory(importsRoot, {create: true});
            unlock = acquireLock(bundleSha256, journalSha256, options.resume === true);
            checkIntents(bundleSha256, journalSha256, inventorySha256, serverAccessSha256);
            const lockedJournal = snapshot().journal;
            journalConflicts(payload.journal, lockedJournal);
            checkPriorInventories(payload.journal, lockedJournal, serverAccessInventory);
            await getAccess().preflightRecords(payload.records);
            await getAccess().configureAwsProfile({write: false});
            await getServerAccess().preflightImport(payload.serverAccess);
            const intentPath = path.join(importsRoot, `${bundleSha256}.intent.json`);
            const outcomePath = path.join(importsRoot, `${bundleSha256}.outcome.json`);
            const receipt = phase => ({schemaVersion: 1, bundleSha256, journalSha256, inventorySha256, serverAccessSha256, createdAt: new Date().toISOString(), phase, ...(phase === 'intent' ? {inventory, serverAccessInventory} : {})});
            const resumed = Boolean(statMaybe(intentPath));
            if (!resumed) createOnly(intentPath, serialize(receipt('intent')));
            if (payload.journal.exists) checkDirectory(journalRoot, {create: true});
            for (const entry of [...payload.journal.entries].sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path))) {
                const destination = path.join(journalRoot, ...entry.path.split('/'));
                if (entry.type === 'directory') checkDirectory(destination, {create: true});
                else if (statMaybe(destination)) {
                    const read = checkedRead(destination, MAX_FILE);
                    try { if (read.bytes.length !== entry.bytes || hash(read.bytes) !== entry.sha256) throw fail('MAC_TRANSFER_JOURNAL_CONFLICT'); }
                    finally { read.bytes.fill(0); }
                } else createOnly(destination, decoded.get(entry.path));
            }
            verifyImported(payload.journal);
            await getServerAccess().importSelected(payload.serverAccess);
            if (getServerAccess().verifyInventory(serverAccessInventory) === false) throw fail('MAC_TRANSFER_SERVER_VERIFY_FAILED');
            // The access module re-reads each destination record before create;
            // a retry can only skip an identical record or create a missing one.
            await getAccess().importRecords(payload.records);
            await getAccess().preflightRecords(payload.records);
            await getAccess().configureAwsProfile({write: true});
            verifyImported(payload.journal);
            if (getServerAccess().verifyInventory(serverAccessInventory) === false) throw fail('MAC_TRANSFER_SERVER_VERIFY_FAILED');
            if (!statMaybe(outcomePath)) createOnly(outcomePath, serialize(receipt('complete')));
            return {status: 'IMPORTED', bundleSha256, journalEntries: payload.journal.entries.length, resumed};
        } catch (error) { throw sanitize(error, 'MAC_TRANSFER_IMPORT_FAILED'); }
        finally {
            passphrase?.fill(0);
            encrypted?.fill(0);
            if (decoded) for (const bytes of decoded.values()) bytes.fill(0);
            if (unlock) {
                try { unlock(); }
                catch { throw fail('MAC_TRANSFER_IMPORT_LOCK_RECONCILIATION_REQUIRED'); }
            }
        }
    }

    return {exportBundle, importBundle, checkMigrationStatus};
}

module.exports = {
    exportBundle: (file, options) => createTransfer().exportBundle(file, options),
    importBundle: (file, options) => createTransfer().importBundle(file, options),
    checkMigrationStatus: options => createTransfer().checkMigrationStatus(options),
    createTransfer,
};
