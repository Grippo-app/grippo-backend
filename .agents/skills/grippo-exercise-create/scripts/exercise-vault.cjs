#!/usr/bin/env node
'use strict';

// Only our two fixed Keychain records are accessible. Secrets travel in private
// child pipes and process memory, never command arguments, environment or files.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {spawn, execFile} = require('node:child_process');
const {promisify, TextDecoder} = require('node:util');

const execute = promisify(execFile);
const LIMIT = 64 * 1024;
const USER_HOME = os.userInfo().homedir;
const BASE = path.join(USER_HOME, '.grippo-private', 'exercise-create');
const BIN_DIR = path.join(BASE, 'bin');
const BINARY = path.join(BIN_DIR, 'grippo-credential-store');
const MANIFEST = path.join(BIN_DIR, 'credential-store.json');
const SOURCE = path.join(__dirname, 'exercise-vault.swift');
const ERROR_CODE = /^VAULT_[A-Z_]+$/;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const ownKeys = (value, keys) => object(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const safeError = code => Object.assign(new Error(code), {code, safeCode: code});
const safeText = value => typeof value === 'string' && !/[\p{Cc}\p{Cf}]/u.test(value);

function childEnvironment() {
    const environment = {...process.env};
    // Keep the user's macOS session, but do not let inherited preload hooks or
    // custom CA configuration change a compiler, Keychain helper or ps child.
    for (const name of Object.keys(environment)) {
        if (name.startsWith('DYLD_') || [
            'NODE_OPTIONS', 'NODE_PATH', 'PYTHONPATH', 'PYTHONHOME',
            'LD_PRELOAD', 'LD_LIBRARY_PATH', 'SSL_CERT_FILE', 'SSL_CERT_DIR',
            'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE',
        ].includes(name)) delete environment[name];
    }
    return environment;
}

function validKind(kind) {
    if (!['admin', 'aws'].includes(kind)) throw safeError('VAULT_KIND_INVALID');
}

function validateRecord(kind, value) {
    validKind(kind);
    if (kind === 'admin') {
        if (!ownKeys(value, ['schemaVersion', 'apiBase', 'userId', 'email', 'password'])
            || value.schemaVersion !== 1 || value.apiBase !== 'https://grippo-app.com'
            || typeof value.userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.userId)
            || !safeText(value.email) || value.email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)
            || !safeText(value.password) || !value.password.length || Buffer.byteLength(value.password) > 16384) {
            throw safeError('VAULT_RECORD_INVALID');
        }
    } else if (!ownKeys(value, ['schemaVersion', 'awsAccount', 'region', 'userName', 'AccessKeyId', 'SecretAccessKey'])
        || value.schemaVersion !== 1 || value.awsAccount !== '915173132322'
        || value.region !== 'eu-north-1' || value.userName !== 'grippo-exercise-publisher'
        || typeof value.AccessKeyId !== 'string' || !/^AKIA[A-Z0-9]{16}$/.test(value.AccessKeyId)
        || typeof value.SecretAccessKey !== 'string' || !/^[A-Za-z0-9/+=]{40}$/.test(value.SecretAccessKey)) {
        throw safeError('VAULT_RECORD_INVALID');
    }
    return value;
}

function platformCheck() {
    if (process.platform !== 'darwin' || typeof process.getuid !== 'function' || process.getuid() === 0) {
        throw safeError('VAULT_MACOS_USER_REQUIRED');
    }
}

function checkedStat(file, type, mode) {
    let stat;
    try { stat = fs.lstatSync(file); }
    catch (error) { if (error.code === 'ENOENT') return null; throw safeError('VAULT_PATH_UNSAFE'); }
    if (stat.isSymbolicLink() || !(type === 'directory' ? stat.isDirectory() : stat.isFile())
        || stat.uid !== process.getuid() || (stat.mode & 0o777) !== mode || stat.nlink !== 1 && type !== 'directory') {
        throw safeError('VAULT_PATH_UNSAFE');
    }
    return stat;
}

function checkAncestors(directory) {
    let cursor = path.resolve(directory);
    while (true) {
        let stat;
        try { stat = fs.lstatSync(cursor); } catch { throw safeError('VAULT_PATH_UNSAFE'); }
        if (stat.isSymbolicLink() || !stat.isDirectory() || ![0, process.getuid()].includes(stat.uid)
            || (stat.mode & 0o022) !== 0) throw safeError('VAULT_PATH_UNSAFE');
        const parent = path.dirname(cursor);
        if (parent === cursor) break;
        cursor = parent;
    }
}

function privateDirectories(create) {
    platformCheck();
    checkAncestors(USER_HOME);
    let parent = USER_HOME;
    for (const name of ['.grippo-private', 'exercise-create', 'bin']) {
        parent = path.join(parent, name);
        if (!checkedStat(parent, 'directory', 0o700)) {
            if (!create) return false;
            try { fs.mkdirSync(parent, {mode: 0o700}); } catch { throw safeError('VAULT_DIRECTORY_CREATE_FAILED'); }
            if (!checkedStat(parent, 'directory', 0o700)) throw safeError('VAULT_PATH_UNSAFE');
        }
    }
    return true;
}

function checkedRead(file, mode, limit) {
    const stat = checkedStat(file, 'file', mode);
    if (!stat || stat.size < 1 || stat.size > limit) throw safeError('VAULT_INSTALL_INVALID');
    let descriptor;
    try {
        descriptor = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
        const actual = fs.fstatSync(descriptor);
        if (actual.dev !== stat.dev || actual.ino !== stat.ino || actual.size !== stat.size) throw safeError('VAULT_PATH_UNSAFE');
        return fs.readFileSync(descriptor);
    } catch (error) {
        if (ERROR_CODE.test(error.code || '')) throw error;
        throw safeError('VAULT_INSTALL_INVALID');
    } finally { if (descriptor !== undefined) fs.closeSync(descriptor); }
}

function sourceHash() {
    let data;
    try {
        const stat = fs.lstatSync(SOURCE);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 256 * 1024) throw new Error();
        data = fs.readFileSync(SOURCE);
    } catch { throw safeError('VAULT_SOURCE_INVALID'); }
    return hash(data);
}

function installed() {
    if (!privateDirectories(false)) return false;
    const binary = checkedStat(BINARY, 'file', 0o700);
    const manifest = checkedStat(MANIFEST, 'file', 0o600);
    if (!binary && !manifest) return false;
    if (!binary || !manifest) throw safeError('VAULT_INSTALL_INVALID');
    let metadata;
    try { metadata = JSON.parse(checkedRead(MANIFEST, 0o600, 4096).toString('utf8')); }
    catch (error) { if (ERROR_CODE.test(error.code || '')) throw error; throw safeError('VAULT_INSTALL_INVALID'); }
    if (!ownKeys(metadata, ['schemaVersion', 'sourceSha256', 'binarySha256']) || metadata.schemaVersion !== 1
        || !/^[0-9a-f]{64}$/.test(metadata.sourceSha256) || !/^[0-9a-f]{64}$/.test(metadata.binarySha256)
        || hash(checkedRead(BINARY, 0o700, 16 * 1024 * 1024)) !== metadata.binarySha256) {
        throw safeError('VAULT_INSTALL_INVALID');
    }
    if (metadata.sourceSha256 !== sourceHash()) throw safeError('VAULT_INSTALL_OUTDATED');
    return true;
}

function runChild(executable, args, input, timeout = 120000, limit = LIMIT) {
    return new Promise((resolve, reject) => {
        const output = [];
        const errors = [];
        let child;
        let count = 0;
        let errorCount = 0;
        let settled = false;
        let timer;
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (input) input.fill(0);
            for (const chunk of output) chunk.fill(0);
            for (const chunk of errors) chunk.fill(0);
            if (error) reject(error); else resolve(result);
        };
        try { child = spawn(executable, args, {stdio: ['pipe', 'pipe', 'pipe'], shell: false, env: childEnvironment()}); }
        catch { finish(safeError('VAULT_PROCESS_FAILED')); return; }
        child.on('error', () => finish(safeError('VAULT_PROCESS_FAILED')));
        child.stdin.on('error', () => {});
        child.stdout.on('data', chunk => {
            if (settled) { chunk.fill(0); return; }
            count += chunk.length;
            if (count > limit) { chunk.fill(0); child.kill(); finish(safeError('VAULT_RESPONSE_TOO_LARGE')); }
            else output.push(chunk);
        });
        child.stderr.on('data', chunk => {
            if (settled) { chunk.fill(0); return; }
            errorCount += chunk.length;
            if (errorCount > limit) { chunk.fill(0); child.kill(); finish(safeError('VAULT_PROCESS_FAILED')); }
            else errors.push(chunk);
        });
        child.on('close', code => {
            if (settled) return;
            if (code !== 0) {
                const errorCode = Buffer.concat(errors).toString('utf8').trim();
                finish(safeError(ERROR_CODE.test(errorCode) ? errorCode : 'VAULT_PROCESS_FAILED'));
            } else finish(null, Buffer.concat(output));
        });
        timer = setTimeout(() => { child.kill(); finish(safeError('VAULT_PROCESS_TIMEOUT')); }, timeout);
        child.stdin.end(input);
    });
}

async function installVault() {
    platformCheck();
    if (installed()) return {installed: true};
    privateDirectories(true);
    const staging = path.join(BIN_DIR, `.credential-store-${crypto.randomUUID()}`);
    const manifestStaging = `${staging}.json`;
    let cache;
    try {
        cache = fs.mkdtempSync(path.join(os.tmpdir(), 'grippo-vault-build-'));
        fs.chmodSync(cache, 0o700);
        await runChild('/usr/bin/xcrun', ['swiftc', '-O', '-framework', 'Security', '-framework', 'AppKit', '-module-cache-path', cache, SOURCE, '-o', staging], undefined, 120000, 1024 * 1024);
        fs.chmodSync(staging, 0o700);
        const binarySha256 = hash(checkedRead(staging, 0o700, 16 * 1024 * 1024));
        const metadata = {schemaVersion: 1, sourceSha256: sourceHash(), binarySha256};
        fs.writeFileSync(manifestStaging, JSON.stringify(metadata) + '\n', {mode: 0o600, flag: 'wx'});
        // No existing install is overwritten. A source change requires deliberate migration.
        fs.linkSync(staging, BINARY);
        fs.unlinkSync(staging);
        fs.linkSync(manifestStaging, MANIFEST);
        fs.unlinkSync(manifestStaging);
        if (!installed()) throw safeError('VAULT_INSTALL_INVALID');
        return {installed: true};
    } catch (error) {
        if (ERROR_CODE.test(error.code || '')) throw error;
        throw safeError('VAULT_INSTALL_FAILED');
    } finally {
        for (const file of [staging, manifestStaging]) { try { fs.unlinkSync(file); } catch {} }
        if (cache) fs.rmSync(cache, {recursive: true, force: true});
    }
}

async function operation(name, kind, value) {
    validKind(kind);
    if (!installed()) throw safeError('VAULT_NOT_INSTALLED');
    let input;
    if (name === 'write') input = Buffer.from(JSON.stringify(validateRecord(kind, value)), 'utf8');
    let data;
    try {
        data = await runChild(BINARY, [name, kind], input);
        let result;
        try { result = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(data)); }
        catch { throw safeError('VAULT_RESPONSE_INVALID'); }
        if (name === 'read') {
            if (ownKeys(result, ['found']) && result.found === false) return null;
            if (!ownKeys(result, ['found', 'record']) || result.found !== true) throw safeError('VAULT_RESPONSE_INVALID');
            return validateRecord(kind, result.record);
        }
        const field = {write: 'stored', delete: 'deleted', probe: 'found'}[name];
        if (!ownKeys(result, [field]) || typeof result[field] !== 'boolean' || name === 'write' && !result[field]) {
            throw safeError('VAULT_RESPONSE_INVALID');
        }
        return result;
    } finally { if (input) input.fill(0); if (data) data.fill(0); }
}

async function readRecord(kind) { return operation('read', kind); }
async function writeRecord(kind, value) { return operation('write', kind, value); }
async function deleteRecord(kind) { return operation('delete', kind); }

async function promptAdminCredentials() {
    if (!installed()) throw safeError('VAULT_NOT_INSTALLED');
    let data;
    try {
        data = await runChild(BINARY, ['prompt-admin'], undefined, 5 * 60 * 1000);
        let result;
        try { result = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(data)); }
        catch { throw safeError('VAULT_RESPONSE_INVALID'); }
        if (!ownKeys(result, ['email', 'password'])) throw safeError('VAULT_RESPONSE_INVALID');
        validateRecord('admin', {...result, schemaVersion: 1, apiBase: 'https://grippo-app.com', userId: '00000000-0000-4000-8000-000000000000'});
        return result;
    } finally { if (data) data.fill(0); }
}

async function status() {
    if (!installed()) return {installed: false, adminConfigured: false, awsConfigured: false};
    const admin = await operation('probe', 'admin');
    const aws = await operation('probe', 'aws');
    return {installed: true, adminConfigured: admin.found, awsConfigured: aws.found};
}

function awsLaunchers() {
    const launchers = [];
    for (const launcher of ['/opt/homebrew/bin/aws', '/usr/local/bin/aws']) {
        let descriptor;
        try {
            const executable = fs.realpathSync(launcher);
            const stat = fs.statSync(executable);
            if (!stat.isFile() || ![0, process.getuid()].includes(stat.uid) || stat.mode & 0o022) continue;
            descriptor = fs.openSync(executable, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
            const head = Buffer.alloc(2048);
            const count = fs.readSync(descriptor, head, 0, head.length, 0);
            const firstLine = head.subarray(0, count).toString('utf8').split(/\r?\n/, 1)[0];
            const shebang = /^#!(\/[^\s\0]+)$/.exec(firstLine);
            let interpreter;
            const interpreters = [];
            if (shebang) {
                interpreter = fs.realpathSync(shebang[1]);
                interpreters.push(interpreter);
                // Homebrew framework Python's bin launcher execs the bundle's
                // Python binary. Bind that one exact binary in the same version.
                const framework = /^(.*\/Python\.framework\/Versions\/[0-9]+(?:\.[0-9]+)*)\/bin\/python[0-9.]+$/.exec(interpreter);
                if (framework) {
                    const bundle = path.join(framework[1], 'Resources/Python.app/Contents/MacOS/Python');
                    try {
                        const canonicalBundle = fs.realpathSync(bundle);
                        const bundleStat = fs.statSync(canonicalBundle);
                        if (canonicalBundle === bundle && bundleStat.isFile()
                            && [0, process.getuid()].includes(bundleStat.uid) && !(bundleStat.mode & 0o022)) {
                            interpreters.push(canonicalBundle);
                        }
                    } catch { /* An absent framework bundle grants no access. */ }
                }
            }
            launchers.push({launcher, executable, interpreter, interpreters});
        } catch { /* An absent or unsupported launcher cannot authorize output. */ }
        finally { if (descriptor !== undefined) fs.closeSync(descriptor); }
    }
    return launchers;
}

async function awsParentVerified() {
    const ps = async field => (await execute('/bin/ps', ['-ww', '-p', String(process.ppid), '-o', `${field}=`], {
        timeout: 5000, maxBuffer: field === 'comm' ? 4096 : 16384, env: childEnvironment(),
    })).stdout.trim();
    try {
        const parent = await ps('comm');
        if (!path.isAbsolute(parent)) return false;
        const executable = fs.realpathSync(parent);
        const launchers = awsLaunchers();
        if (launchers.some(launcher => launcher.executable === executable)) return true;
        const scripts = launchers.filter(launcher => launcher.interpreters.includes(executable));
        if (!scripts.length) return false;
        // ps exposes a flattened argv. Require unambiguous, exact first tokens;
        // this deliberately fails closed for script/interpreter paths with spaces.
        const argumentsText = await ps('args');
        const [interpreter, script] = argumentsText.split(/[\t ]+/, 3);
        if (!interpreter || !script || !path.isAbsolute(interpreter) || !path.isAbsolute(script)) return false;
        return scripts.some(launcher => ![launcher.launcher, launcher.executable, ...launcher.interpreters].some(value => /\s/.test(value))
            && launcher.interpreters.includes(fs.realpathSync(interpreter))
            && [launcher.launcher, launcher.executable].includes(script));
    } catch { return false; }
}

async function awsCredentialProcess() {
    // Prevent accidental secret output when a person or an AI directly runs this
    // mode. AWS CLI invokes credential_process directly with captured stdout.
    if (process.stdout.isTTY) throw safeError('VAULT_AWS_PARENT_REQUIRED');
    if (!await awsParentVerified()) throw safeError('VAULT_AWS_PARENT_REQUIRED');
    const record = await readRecord('aws');
    if (!record) throw safeError('VAULT_AWS_SETUP_REQUIRED');
    const encoded = Buffer.from(JSON.stringify({Version: 1, AccessKeyId: record.AccessKeyId, SecretAccessKey: record.SecretAccessKey}) + '\n');
    record.AccessKeyId = '';
    record.SecretAccessKey = '';
    try { await new Promise((resolve, reject) => process.stdout.write(encoded, error => error ? reject(safeError('VAULT_OUTPUT_FAILED')) : resolve())); }
    finally { encoded.fill(0); }
}

async function main(argv) {
    if (argv.length !== 1 || !['--install', '--status', '--aws-credential-process'].includes(argv[0])) {
        throw safeError('VAULT_ARGUMENTS_INVALID');
    }
    if (argv[0] === '--aws-credential-process') { await awsCredentialProcess(); return; }
    const result = argv[0] === '--install' ? await installVault() : await status();
    process.stdout.write(JSON.stringify(result) + '\n');
}

module.exports = {installVault, readRecord, writeRecord, deleteRecord, promptAdminCredentials};
if (require.main === module) main(process.argv.slice(2)).catch(error => {
    process.stderr.write((ERROR_CODE.test(error.code || '') ? error.code : 'VAULT_FAILED') + '\n');
    process.exitCode = 1;
});
