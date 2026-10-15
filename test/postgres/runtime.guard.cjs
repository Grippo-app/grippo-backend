'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const {assertOwnedRuntime, cleanupRuntime, pgConfig, verifyServer, sanitizeEnvironment, createRuntime} = require('./runtime.cjs');
const {parseArgs} = require('./run.cjs');

test('inherited database and Node preload configuration is removed without mutating the input', () => {
    const input = {PATH: '/usr/bin', PGHOST: 'ignore', PGPORT: '5432', PGSERVICEFILE: 'ignore',
        DATABASE_URL: 'ignore', TYPEORM_HOST: 'ignore', DB_HOST: 'ignore',
        DOTENV_CONFIG_PATH: 'ignore', POSTGRES_USER: 'ignore', NODE_OPTIONS: 'ignore',
        TS_NODE_PROJECT: 'ignore', GRIPPO_TEST_PG_BIN: 'ignore'};
    assert.deepEqual(sanitizeEnvironment(input), {PATH: '/usr/bin'});
    assert.equal(input.PGPORT, '5432');
});

test('there is no connection URL, existing database or PGDATA CLI option', () => {
    for (const args of [['--url', 'ignore'], ['--host', '127.0.0.1'], ['--pgdata', '/tmp'],
        ['--pg-bin'], ['--pg-bin', 'relative'], ['--pg-bin', '/tmp', '--url', 'ignore']]) {
        assert.throws(() => parseArgs(args, {}));
    }
    assert.deepEqual(parseArgs(['--pg-bin', '/local/pg/bin'], {}), {pgBin: '/local/pg/bin'});
    assert.deepEqual(parseArgs([], {GRIPPO_TEST_PG_BIN: '/local/pg/bin'}), {pgBin: '/local/pg/bin'});
});

test('forged connection descriptors cannot connect, verify, or stop any database', async () => {
    const forged = Object.freeze({host: '127.0.0.1', port: 5432, dataDirectory: '/tmp', pid: 1});
    assert.throws(() => assertOwnedRuntime(forged), /created by this process/);
    assert.throws(() => pgConfig(forged), /created by this process/);
    let queried = false;
    await assert.rejects(verifyServer({query() { queried = true; }}, forged), /created by this process/);
    assert.equal(queried, false);
    await assert.rejects(cleanupRuntime(forged), /not created by this process/);
});

test('relative or missing executable directories fail before cluster creation', async () => {
    await assert.rejects(createRuntime({pgBin: 'relative'}), /absolute bin directory/);
    await assert.rejects(createRuntime({pgBin: '/__grippo_missing_pg15_bin__'}), /executable postgres/);
});

test('service fixture blocks application bootstrap, env loaders and forged runtimes before connection', () => {
    const script = `
        const assert = require('node:assert/strict');
        const context = require('./test/postgres/context.cjs');
        context.assertSafeImports();
        for (const source of ['./src/app.module.ts', './src/database/database.service.ts',
            '@nestjs/config', 'dotenv/config']) {
            assert.throws(() => require(source), /forbidden/);
        }
        assert.throws(() => require('dotenv').config(), /forbidden/);
        assert.throws(() => require('dotenv').configDotenv(), /forbidden/);
        context.openSuite('identity', {host: '127.0.0.1', port: 5432})
            .then(() => process.exit(1), error => {
                assert.match(error.message, /created by this process/);
                process.stdout.write('Fixture isolation guards passed');
            });
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
        cwd: path.resolve(__dirname, '../..'), env: sanitizeEnvironment(),
        encoding: 'utf8', timeout: 15000, maxBuffer: 32768,
    });
    assert.equal(result.status, 0, 'Context isolation subprocess failed (output suppressed)');
    assert.equal(result.stdout, 'Fixture isolation guards passed');
});
