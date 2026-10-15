'use strict';

// This module can create a fresh local cluster. It intentionally cannot attach
// to a URL, an existing PGDATA, a Docker context, or the application's config.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');

const owned = new WeakMap();
const commands = ['postgres', 'initdb', 'pg_ctl'];

function sanitizeEnvironment(source = process.env) {
    const env = {...source};
    for (const key of Object.keys(env)) {
        if (/^(PG|POSTGRES|TYPEORM_|DOTENV_|GRIPPO_TEST_|DB_)/.test(key)
            || ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE',
                'NODE_OPTIONS', 'TS_NODE_PROJECT', 'TS_NODE_COMPILER_OPTIONS'].includes(key)) delete env[key];
    }
    return env;
}

function checkCommand(result, label) {
    if (result.code === 0 && !result.timedOut) return;
    const hint = /shmget|could not create shared memory/i.test(result.output)
        ? ' Local shared-memory access is unavailable in this execution environment.'
        : /address already in use/i.test(result.output)
            ? ' The chosen ephemeral port was taken; no existing instance was used.' : '';
    throw new Error(`${label} failed (exit ${result.code ?? result.signal ?? 'unknown'}${result.timedOut ? ', timeout' : ''}).${hint}`);
}

function command(file, args, env, timeout = 40000) {
    return new Promise((resolve, reject) => {
        const child = spawn(file, args, {env, stdio: ['ignore', 'pipe', 'pipe']});
        let output = '';
        let timedOut = false;
        let killTimer;
        const capture = chunk => { output = (output + chunk.toString()).slice(-16384); };
        child.stdout.on('data', capture);
        child.stderr.on('data', capture);
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
            killTimer = setTimeout(() => child.kill('SIGKILL'), 2000);
        }, timeout);
        child.once('error', error => {
            clearTimeout(timer);
            clearTimeout(killTimer);
            reject(new Error(`${path.basename(file)} could not start (${error.code || 'unknown'})`));
        });
        child.once('close', (code, signal) => {
            clearTimeout(timer);
            clearTimeout(killTimer);
            resolve({code, signal, output, timedOut});
        });
    });
}

async function locateBinaries(requested) {
    if (requested !== undefined) assert(path.isAbsolute(requested), '--pg-bin must be an absolute bin directory');
    const candidates = requested ? [requested] : [
        ...String(process.env.PATH || '').split(path.delimiter).filter(item => path.isAbsolute(item)),
        '/opt/homebrew/opt/postgresql@15/bin', '/usr/local/opt/postgresql@15/bin',
        '/usr/lib/postgresql/15/bin', '/usr/pgsql-15/bin',
    ];
    for (const candidate of [...new Set(candidates)]) {
        let bin;
        try {
            bin = fs.realpathSync(candidate);
            for (const name of commands) {
                const executable = path.join(bin, name);
                assert(fs.statSync(executable).isFile());
                fs.accessSync(executable, fs.constants.X_OK);
            }
        } catch {
            if (requested) throw new Error('The selected directory must contain executable postgres, initdb and pg_ctl');
            continue;
        }
        let version;
        for (const name of commands) {
            const result = await command(path.join(bin, name), ['--version'], {PATH: '/usr/bin:/bin', LC_ALL: 'C'}, 5000);
            const match = result.output.match(/\(PostgreSQL\) (15(?:\.\d+)?)(?:\s|$)/);
            if (result.code !== 0 || !match || (version && version !== match[1])) {
                version = undefined;
                break;
            }
            version = match[1];
        }
        if (version) return {bin, version};
        if (requested) throw new Error('All selected PostgreSQL executables must be the same version of PostgreSQL 15');
    }
    throw new Error('Local PostgreSQL 15 binaries are required. Set GRIPPO_TEST_PG_BIN or use --pg-bin /absolute/bin. Nothing was installed or connected.');
}

function privateDirectory(directory) {
    const stat = fs.lstatSync(directory);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), 'Expected an owned directory, without symlinks');
    assert.equal(stat.mode & 0o077, 0, 'Test directories must be private');
    if (process.getuid) assert.equal(stat.uid, process.getuid(), 'Directory owner mismatch');
    assert.equal(fs.realpathSync(directory), directory, 'Test directory path must be canonical');
}

function assertRoot(state) {
    privateDirectory(state.runRoot);
    assert.equal(path.dirname(state.runRoot), state.tmpRoot);
    assert(/^grippo-pg-[A-Za-z0-9]+$/.test(path.basename(state.runRoot)));
    const marker = path.join(state.runRoot, '.owner');
    const stat = fs.lstatSync(marker);
    assert(stat.isFile() && !stat.isSymbolicLink());
    assert.equal(stat.mode & 0o077, 0);
    if (process.getuid) assert.equal(stat.uid, process.getuid());
    assert.equal(fs.readFileSync(marker, 'utf8'), state.nonce, 'Runtime owner marker mismatch');
}

function pidMetadata(state, requireReady = true) {
    assertRoot(state);
    privateDirectory(state.dataDirectory);
    const file = path.join(state.dataDirectory, 'postmaster.pid');
    const stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink());
    if (process.getuid) assert.equal(stat.uid, process.getuid());
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const pid = Number(lines[0]);
    assert(Number.isInteger(pid) && pid > 1);
    if (state.pid) assert.equal(pid, state.pid, 'PostgreSQL PID changed');
    assert.equal(lines[1], state.dataDirectory, 'PostgreSQL data directory mismatch');
    assert(Number(lines[2]) >= Math.floor(state.createdAt / 1000) - 1, 'Cluster predates this run');
    assert.equal(Number(lines[3]), state.port, 'PostgreSQL port mismatch');
    assert.equal(lines[4], state.socketDirectory, 'Socket directory mismatch');
    assert.equal(lines[5], '127.0.0.1', 'PostgreSQL must listen only on loopback');
    if (requireReady) assert.equal(lines[7].trim(), 'ready');
    process.kill(pid, 0);
    return pid;
}

function assertOwnedRuntime(descriptor) {
    const state = owned.get(descriptor);
    assert(state && !state.stopped && !state.stopping, 'Only a live runtime created by this process is allowed');
    pidMetadata(state);
    return descriptor;
}

function pgConfig(config, database = 'postgres', applicationName = 'grippo_test_guard') {
    assertOwnedRuntime(config);
    assert(database === 'postgres' || /^grippo_test_[a-z]+_[a-f0-9]{12}$/.test(database));
    return {
        host: '127.0.0.1', port: config.port, user: config.username,
        password: config.password, database, ssl: false,
        connectionTimeoutMillis: 3000, application_name: applicationName,
        options: '-c lock_timeout=6000 -c statement_timeout=15000 -c idle_in_transaction_session_timeout=20000',
    };
}

async function verifyServer(client, config) {
    assertOwnedRuntime(config);
    const {rows: [actual]} = await client.query("SELECT current_setting('data_directory') AS data_directory, current_setting('server_version_num') AS version, current_setting('listen_addresses') AS listen, current_user AS role, current_database() AS database, host(inet_server_addr()) AS address, inet_server_port() AS port, pg_is_in_recovery() AS recovery");
    assert.equal(fs.realpathSync(actual.data_directory), config.dataDirectory);
    assert.equal(Number(actual.version), config.serverVersionNum);
    assert.equal(actual.listen, '127.0.0.1');
    assert.equal(actual.role, config.username);
    assert.equal(actual.database, config.database);
    assert.equal(actual.address, '127.0.0.1');
    assert.equal(actual.port, config.port);
    assert.equal(actual.recovery, false);
}

async function freshPort() {
    const server = net.createServer();
    try {
        await new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen({host: '127.0.0.1', port: 0, exclusive: true}, resolve);
        });
        const port = server.address().port;
        assert(Number.isInteger(port) && port > 1024 && port !== 5432 && port !== 5433);
        return port;
    } finally {
        if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
}

async function cleanupState(state) {
    if (state.stopped) return;
    assertRoot(state);
    const pidFile = path.join(state.dataDirectory, 'postmaster.pid');
    if (fs.existsSync(pidFile)) {
        state.pid = pidMetadata(state, false);
        const result = await command(state.pgCtl, ['-D', state.dataDirectory, '-m', 'fast', '-w', '-t', '30', 'stop'], state.env);
        assert.equal(result.code, 0, 'Test cluster stop failed; private directory retained for manual recovery');
    }
    if (fs.existsSync(state.dataDirectory)) {
        privateDirectory(state.dataDirectory);
        const status = await command(state.pgCtl, ['-D', state.dataDirectory, 'status'], state.env, 5000);
        // status=4 means initdb did not finish; this fresh directory never ran.
        assert(status.code === 3 || (!state.startAttempted && status.code === 4), 'Cannot prove the test cluster stopped; directory retained');
        assert(!fs.existsSync(pidFile), 'PostgreSQL PID file remains; directory retained');
    }
    assertRoot(state);
    fs.rmSync(state.runRoot, {recursive: true});
    assert(!fs.existsSync(state.runRoot), 'Test directory cleanup failed');
    state.stopped = true;
}

async function cleanupRuntime(descriptor) {
    const state = owned.get(descriptor);
    assert(state, 'Cannot stop a runtime not created by this process');
    if (state.cleanupPromise) return state.cleanupPromise;
    state.stopping = true;
    state.cleanupPromise = cleanupState(state);
    return state.cleanupPromise;
}

async function createRuntime({pgBin, signal} = {}) {
    assert(process.platform !== 'win32', 'Native PostgreSQL test runner requires Unix');
    assert(!process.getuid || process.getuid() !== 0, 'initdb must run as an unprivileged user');
    const {bin, version} = await locateBinaries(pgBin);
    signal?.throwIfAborted();
    const tmpRoot = fs.realpathSync(os.tmpdir());
    const runRoot = fs.mkdtempSync(path.join(tmpRoot, 'grippo-pg-'));
    fs.chmodSync(runRoot, 0o700);
    const state = {
        runRoot, tmpRoot, createdAt: Date.now(), nonce: crypto.randomBytes(24).toString('hex'),
        dataDirectory: path.join(runRoot, 'data'), socketDirectory: path.join(runRoot, 's'),
        pgCtl: path.join(bin, 'pg_ctl'), stopped: false, startAttempted: false,
        env: {PATH: '/usr/bin:/bin', LC_ALL: 'C', TMPDIR: runRoot},
    };
    fs.writeFileSync(path.join(runRoot, '.owner'), state.nonce, {mode: 0o600, flag: 'wx'});
    try {
        fs.mkdirSync(state.socketDirectory, {mode: 0o700});
        assert(Buffer.byteLength(path.join(state.socketDirectory, '.s.PGSQL.65535')) < 104, 'OS temporary path is too long for PostgreSQL sockets');
        const username = `grippo_test_${crypto.randomBytes(6).toString('hex')}`;
        const password = crypto.randomBytes(36).toString('base64url');
        const passwordFile = path.join(runRoot, 'initdb-password');
        fs.writeFileSync(passwordFile, `${password}\n`, {mode: 0o600, flag: 'wx'});
        let initialized;
        try {
            initialized = await command(path.join(bin, 'initdb'), ['-D', state.dataDirectory,
                `--username=${username}`, `--pwfile=${passwordFile}`, '--auth-local=scram-sha-256',
                '--auth-host=scram-sha-256', '--encoding=UTF8', '--no-locale'], state.env);
        } finally { fs.rmSync(passwordFile, {force: true}); }
        checkCommand(initialized, 'initdb');
        signal?.throwIfAborted();
        state.port = await freshPort();
        // Quote PostgreSQL string literals; filesystem paths never enter a shell.
        const socketLiteral = state.socketDirectory.replace(/'/g, "''");
        fs.appendFileSync(path.join(state.dataDirectory, 'postgresql.conf'), `\nlisten_addresses = '127.0.0.1'\nport = ${state.port}\nunix_socket_directories = '${socketLiteral}'\nunix_socket_permissions = 0700\npassword_encryption = 'scram-sha-256'\ntimezone = 'UTC'\nlog_timezone = 'UTC'\nmax_connections = 40\nshared_buffers = '32MB'\nfsync = on\nsynchronous_commit = on\nlog_min_error_statement = 'panic'\nlog_error_verbosity = 'terse'\n`);
        state.startAttempted = true;
        const started = await command(state.pgCtl, ['-D', state.dataDirectory, '-l', path.join(runRoot, 'server.log'), '-w', '-t', '30', 'start'], state.env);
        checkCommand(started, 'Fresh PostgreSQL startup');
        state.pid = pidMetadata(state);
        signal?.throwIfAborted();
        const descriptor = Object.freeze({
            kind: 'native-postgres', runRoot, dataDirectory: state.dataDirectory,
            socketDirectory: state.socketDirectory, host: '127.0.0.1', port: state.port,
            username, password, database: 'postgres', ssl: false, pid: state.pid,
            serverVersion: version, serverVersionNum: 150000 + Number(version.split('.')[1] || 0),
        });
        owned.set(descriptor, state);
        const {Client} = require('pg');
        const client = new Client(pgConfig(descriptor));
        client.on('error', () => {});
        try { await client.connect(); await verifyServer(client, descriptor); }
        finally { await client.end(); }
        return descriptor;
    } catch (error) {
        try { await cleanupState(state); }
        catch { throw new Error(`Startup failed and cleanup could not be verified. Private runtime retained: ${runRoot}`); }
        throw error;
    }
}

module.exports = {createRuntime, assertOwnedRuntime, cleanupRuntime, pgConfig, verifyServer, sanitizeEnvironment};
