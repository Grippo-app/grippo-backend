'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {createHash} = require('node:crypto');
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

test('translation tools are inert on import and reject unsafe CLI argument combinations', () => {
    const script = `
        const assert = require('node:assert/strict');
        const path = require('node:path');
        const before = process.env.PGHOST;
        const core = require('./scripts/internal/exercise-translations.cjs');
        const cli = require('./scripts/import-exercise-translations.cjs');
        assert.equal(process.env.PGHOST, before);
        const modules = Object.keys(require.cache).map(file => file.split(path.sep));
        assert(!modules.some(parts => parts.includes('pg') || parts.includes('dotenv')));
        assert.throws(() => core.validateDataset({version: 1, records: []}));
        const base = ['--connection','/private/connection.json','--dataset','/private/dataset.json',
            '--manifest','/private/manifest.json','--code-revision','a'.repeat(40)];
        assert.equal(cli.parseArgs(base)['--apply'], undefined);
        for (const args of [[], [...base,'--apply'], [...base,'--reconcile'],
            [...base,'--apply','--reconcile'], [...base,'--dataset','/private/other.json'],
            [...base,'--unknown'], [...base,'--replacements']]) assert.throws(() => cli.parseArgs(args));
        assert.throws(() => cli.parseArgs([...base.slice(0, -1), 'a'.repeat(40) + '\\n']));
        assert.throws(() => core.validateDataset({version: 1, records: ['pt-BR','pt-PT'].map(language => ({
            exerciseExampleId: '11111111-1111-4111-8111-111111111111' + '\\n',
            language, name: 'Synthetic', description: 'Synthetic',
        }))}), {code: 'INVALID_EXERCISE_ID'});
        assert.equal(cli.parseArgs([...base,'--apply','--approval','/private/approval.json',
            '--receipt','/private/new-attempt.jsonl'])['--apply'], true);
        process.stdout.write('Translation import guards passed');
    `;
    const result = spawnSync(process.execPath, ['-e', script], {
        cwd: path.resolve(__dirname, '../..'),
        env: {...sanitizeEnvironment(), PGHOST: 'synthetic-inert-import-sentinel'},
        encoding: 'utf8', timeout: 10000, maxBuffer: 32768,
    });
    assert.equal(result.status, 0, 'Translation import subprocess failed (output suppressed)');
    assert.equal(result.stdout, 'Translation import guards passed');
});

test('translation apply validates three independent private backup artifacts by bytes and checksum', () => {
    const {verifyBackupArtifacts} = require('../../scripts/import-exercise-translations.cjs');
    const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'grippo-backup-guard-'));
    fs.chmodSync(directory, 0o700);
    const bytes = Buffer.from('Synthetic integrity fixture; contains no database rows.\n');
    const artifact = name => path.join(directory, name);
    const backup = {
        snapshot: artifact('snapshot.fixture'), latest: artifact('latest.fixture'),
        recovery: artifact('recovery.fixture'), bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        source: {root: '/synthetic/project', db: {id: 'synthetic-database'}},
    };
    try {
        for (const file of [backup.snapshot, backup.latest, backup.recovery]) fs.writeFileSync(file, bytes, {mode: 0o600});
        assert.doesNotThrow(() => verifyBackupArtifacts(backup));
        assert.throws(() => verifyBackupArtifacts({...backup, recovery: backup.snapshot}), {code: 'BACKUP_PATHS_OVERLAP'});
        assert.throws(() => verifyBackupArtifacts({...backup, bytes: bytes.length + 1}), {code: 'BACKUP_FILE_MISMATCH'});
        fs.writeFileSync(backup.latest, Buffer.alloc(bytes.length, 65));
        assert.throws(() => verifyBackupArtifacts(backup), {code: 'BACKUP_CHECKSUM_MISMATCH'});
        fs.writeFileSync(backup.latest, bytes);
        fs.chmodSync(backup.recovery, 0o644);
        assert.throws(() => verifyBackupArtifacts(backup), {code: 'BACKUP_FILE_MISMATCH'});
        fs.chmodSync(backup.recovery, 0o600);
        fs.unlinkSync(backup.recovery);
        fs.linkSync(backup.snapshot, backup.recovery);
        assert.throws(() => verifyBackupArtifacts(backup), {code: 'BACKUP_FILE_MISMATCH'});
        fs.unlinkSync(backup.recovery);
        fs.symlinkSync(backup.snapshot, backup.recovery);
        assert.throws(() => verifyBackupArtifacts(backup), {code: 'BACKUP_SYMLINK_FORBIDDEN'});
    } finally {
        fs.rmSync(directory, {recursive: true, force: true});
    }
    assert(!fs.existsSync(directory), 'Synthetic backup artifacts must be removed');
});
