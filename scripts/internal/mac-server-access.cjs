'use strict';

// Only explicitly selected source files enter the encrypted transfer. Imported
// server files stay outside Git; they do not establish SSH trust or run dotenv.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {TextDecoder} = require('node:util');
const fail = code => { throw Object.assign(new Error(code), {code, safeCode: code}); };
const LIMITS = {sshKey: 256 * 1024, envFile: 1024 * 1024};
const FILES = {sshKey: 'grippo-deploy.pem', envFile: 'runtime.env'};
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === [...expected].sort().join(',');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function createServerAccess({home = os.userInfo().homedir} = {}) {
    const privateRoot = path.join(home, '.grippo-private');
    const directory = path.join(privateRoot, 'mac-setup/server-access');

    function parents(folder, create = false) {
        let current = path.parse(folder).root;
        for (const part of folder.slice(current.length).split(path.sep).filter(Boolean)) {
            current = path.join(current, part);
            let stat;
            try { stat = fs.lstatSync(current); }
            catch (error) {
                if (error.code !== 'ENOENT') fail('MAC_SERVER_PATH_UNSAFE');
                if (!create) return false;
                if (current !== privateRoot && !current.startsWith(`${privateRoot}${path.sep}`)) fail('MAC_SERVER_PATH_UNSAFE');
                fs.mkdirSync(current, {mode: 0o700});
                syncDirectory(path.dirname(current));
                stat = fs.lstatSync(current);
            }
            const managed = current === privateRoot || current.startsWith(`${privateRoot}${path.sep}`);
            const safeAncestor = [0, process.getuid()].includes(stat.uid)
                && (!(stat.mode & 0o022) || stat.uid === 0 && Boolean(stat.mode & 0o1000));
            if (!stat.isDirectory() || stat.isSymbolicLink() || (managed
                ? stat.uid !== process.getuid() || (stat.mode & 0o7777) !== 0o700 : !safeAncestor)) fail('MAC_SERVER_PATH_UNSAFE');
        }
        return true;
    }

    function stat(file, optional = false) {
        if (!parents(path.dirname(file))) {
            if (optional) return null;
            fail('MAC_SERVER_SOURCE_MISSING');
        }
        let result;
        try { result = fs.lstatSync(file); }
        catch (error) {
            if (optional && error.code === 'ENOENT') return null;
            fail('MAC_SERVER_SOURCE_MISSING');
        }
        if (!result.isFile() || result.isSymbolicLink() || result.nlink !== 1 || result.uid !== process.getuid()
            || ![0o400, 0o600].includes(result.mode & 0o7777)) fail('MAC_SERVER_FILE_UNSAFE');
        return result;
    }

    function read(file, kind, optional = false) {
        const before = stat(file, optional);
        if (!before) return null;
        if (before.size < 1 || before.size > LIMITS[kind]) fail('MAC_SERVER_FILE_SIZE_INVALID');
        let fd;
        let bytes;
        try {
            fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
            const opened = fs.fstatSync(fd);
            if (opened.ino !== before.ino || opened.dev !== before.dev || opened.size !== before.size
                || opened.mtimeMs !== before.mtimeMs || opened.ctimeMs !== before.ctimeMs) fail('MAC_SERVER_FILE_CHANGED');
            bytes = Buffer.alloc(opened.size + 1);
            let count = 0;
            while (count < bytes.length) {
                const n = fs.readSync(fd, bytes, count, bytes.length - count, null);
                if (!n) break;
                count += n;
            }
            const after = fs.fstatSync(fd);
            const named = fs.lstatSync(file);
            if (count !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs
                || after.ctimeMs !== before.ctimeMs || named.ino !== before.ino || named.dev !== before.dev) fail('MAC_SERVER_FILE_CHANGED');
            return bytes.subarray(0, count);
        } catch (error) {
            bytes?.fill(0);
            if (error.safeCode) throw error;
            fail('MAC_SERVER_READ_FAILED');
        } finally { if (fd !== undefined) fs.closeSync(fd); }
    }

    function validateBytes(bytes, kind) {
        let value;
        try { value = new TextDecoder('utf-8', {fatal: true}).decode(bytes); }
        catch { fail('MAC_SERVER_FILE_FORMAT_INVALID'); }
        if (!bytes.length || bytes.length > LIMITS[kind] || value.includes('\0')) fail('MAC_SERVER_FILE_FORMAT_INVALID');
        if (kind === 'sshKey') {
            const match = /^-----BEGIN (OPENSSH PRIVATE KEY|RSA PRIVATE KEY|EC PRIVATE KEY|DSA PRIVATE KEY|PRIVATE KEY|ENCRYPTED PRIVATE KEY)-----\r?\n/.exec(value);
            if (!match || !value.trimEnd().endsWith(`-----END ${match[1]}-----`)) fail('MAC_SERVER_KEY_FORMAT_INVALID');
        } else if (!/^\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=/m.test(value)) fail('MAC_SERVER_ENV_FORMAT_INVALID');
    }

    function decode(entry, kind) {
        if (!keys(entry, ['bytes', 'sha256', 'data']) || !Number.isSafeInteger(entry.bytes)
            || entry.bytes < 1 || entry.bytes > LIMITS[kind] || !/^[a-f0-9]{64}$/.test(entry.sha256)
            || typeof entry.data !== 'string' || entry.data.length > Math.ceil(LIMITS[kind] / 3) * 4) fail('MAC_SERVER_PAYLOAD_INVALID');
        const bytes = Buffer.from(entry.data, 'base64');
        try {
            if (bytes.length !== entry.bytes || bytes.toString('base64') !== entry.data || hash(bytes) !== entry.sha256) fail('MAC_SERVER_PAYLOAD_INVALID');
            validateBytes(bytes, kind);
            return bytes;
        } catch (error) { bytes.fill(0); throw error; }
    }

    function validate(payload) {
        if (payload === null) return;
        if (!keys(payload, ['schemaVersion', 'sshKey', 'envFile']) || payload.schemaVersion !== 1
            || payload.sshKey === null && payload.envFile === null) fail('MAC_SERVER_PAYLOAD_INVALID');
        for (const kind of Object.keys(FILES)) {
            if (payload[kind] !== null) decode(payload[kind], kind).fill(0);
        }
    }

    function readSelected({sshKeyFile, envFile} = {}) {
        if (sshKeyFile === undefined && envFile === undefined) return null;
        const result = {schemaVersion: 1, sshKey: null, envFile: null};
        for (const [kind, file] of [['sshKey', sshKeyFile], ['envFile', envFile]]) {
            if (file === undefined) continue;
            if (typeof file !== 'string' || !path.isAbsolute(file) || path.resolve(file) !== file || /[\p{Cc}\p{Cf}]/u.test(file)) fail('MAC_SERVER_SOURCE_PATH_INVALID');
            const bytes = read(file, kind);
            try {
                validateBytes(bytes, kind);
                result[kind] = {bytes: bytes.length, sha256: hash(bytes), data: bytes.toString('base64')};
            } finally { bytes.fill(0); }
        }
        return result;
    }

    function inventory(payload) {
        validate(payload);
        if (payload === null) return null;
        const result = {schemaVersion: 1, sshKey: null, envFile: null};
        for (const kind of Object.keys(FILES)) {
            if (payload[kind]) result[kind] = {bytes: payload[kind].bytes, sha256: payload[kind].sha256};
        }
        return result;
    }

    function verifyInventory(expected) {
        if (expected === null) return true;
        if (!keys(expected, ['schemaVersion', 'sshKey', 'envFile']) || expected.schemaVersion !== 1
            || !expected.sshKey && !expected.envFile) fail('MAC_SERVER_INVENTORY_INVALID');
        for (const kind of Object.keys(FILES)) {
            const entry = expected[kind];
            if (entry === null) continue;
            if (!keys(entry, ['bytes', 'sha256']) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1
                || entry.bytes > LIMITS[kind] || !/^[a-f0-9]{64}$/.test(entry.sha256)) fail('MAC_SERVER_INVENTORY_INVALID');
            const bytes = read(path.join(directory, FILES[kind]), kind, true);
            if (!bytes) fail('MAC_SERVER_IMPORTED_FILE_MISSING');
            try { if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) fail('MAC_SERVER_IMPORTED_FILE_CHANGED'); }
            finally { bytes.fill(0); }
        }
        return true;
    }

    function preflightImport(payload) {
        validate(payload);
        if (payload === null) return;
        assertNoStaging();
        for (const kind of Object.keys(FILES)) {
            if (!payload[kind]) continue;
            const current = read(path.join(directory, FILES[kind]), kind, true);
            if (!current) continue;
            try {
                if (current.length !== payload[kind].bytes || hash(current) !== payload[kind].sha256) fail('MAC_SERVER_EXISTING_FILE_CONFLICT');
            } finally { current.fill(0); }
        }
    }

    function syncDirectory(folder) {
        const fd = fs.openSync(folder, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY | fs.constants.O_NOFOLLOW);
        try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    }

    function assertNoStaging() {
        if (parents(directory) && fs.readdirSync(directory).some(name => name.startsWith('.import-'))) {
            fail('MAC_SERVER_STAGING_RECONCILE_REQUIRED');
        }
    }

    function importSelected(payload) {
        preflightImport(payload);
        if (payload === null) return {imported: false};
        parents(directory, true);
        for (const kind of Object.keys(FILES)) {
            if (!payload[kind]) continue;
            const target = path.join(directory, FILES[kind]);
            const current = read(target, kind, true);
            if (current) {
                try { if (hash(current) !== payload[kind].sha256) fail('MAC_SERVER_EXISTING_FILE_CONFLICT'); }
                finally { current.fill(0); }
                continue;
            }
            const bytes = decode(payload[kind], kind);
            const staging = path.join(directory, `.import-${crypto.randomUUID()}`);
            let fd;
            try {
                fd = fs.openSync(staging, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
                fs.writeFileSync(fd, bytes);
                fs.fsyncSync(fd);
                fs.closeSync(fd);
                fd = undefined;
                fs.linkSync(staging, target);
                fs.unlinkSync(staging);
                syncDirectory(directory);
            } catch (error) {
                if (error.safeCode) throw error;
                fail('MAC_SERVER_WRITE_FAILED_RECONCILE');
            } finally {
                bytes.fill(0);
                if (fd !== undefined) fs.closeSync(fd);
                try { fs.unlinkSync(staging); } catch (error) { if (error.code !== 'ENOENT') fail('MAC_SERVER_STAGING_RECONCILE_REQUIRED'); }
            }
        }
        verifyInventory(inventory(payload));
        return {imported: true};
    }

    function checkStatus() {
        assertNoStaging();
        const sshKeyPresent = Boolean(stat(path.join(directory, FILES.sshKey), true));
        const envFilePresent = Boolean(stat(path.join(directory, FILES.envFile), true));
        return {status: sshKeyPresent && envFilePresent ? 'ready' : 'pending', sshKeyPresent, envFilePresent,
            trustChecked: false, applicationConfigChecked: false};
    }

    return {readSelected, validate, inventory, verifyInventory, preflightImport, importSelected, checkStatus};
}

module.exports = {...createServerAccess(), createServerAccess};
