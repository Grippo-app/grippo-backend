'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {createRuntime, cleanupRuntime, sanitizeEnvironment} = require('./runtime.cjs');

function parseArgs(args, env = process.env) {
    let pgBin = env.GRIPPO_TEST_PG_BIN;
    if (args.length) {
        assert(args.length === 2 && args[0] === '--pg-bin', 'Usage: npm run test:postgres -- [--pg-bin /absolute/bin]');
        pgBin = args[1];
    }
    if (pgBin !== undefined) assert(pgBin.length > 0 && path.isAbsolute(pgBin), '--pg-bin / GRIPPO_TEST_PG_BIN must be an absolute bin directory');
    return {pgBin};
}

async function main(args = process.argv.slice(2)) {
    const options = parseArgs(args);
    const cleanEnv = sanitizeEnvironment();
    for (const key of Object.keys(process.env)) if (!(key in cleanEnv)) delete process.env[key];
    process.env.NODE_ENV = 'test';
    const controller = new AbortController();
    let signal;
    let runtime;
    let activeContext;
    let interruptWatchdog;
    let fatalTimeout;
    let cleanupComplete = false;
    function interrupt(received) {
        if (signal) return;
        signal = received;
        controller.abort(new Error(`Interrupted by ${received}`));
        console.error(`PostgreSQL tests interrupted by ${received}; draining the active case and stopping the owned cluster.`);
        // Normally case finally/dispose drains first. This fallback is bounded and
        // uses the same branded runtime if a test accidentally stops responding.
        if (runtime) interruptWatchdog = setTimeout(() => {
            cleanupRuntime(runtime).then(() => {
                cleanupComplete = true;
                console.error('Owned test cluster stopped and removed after interrupt timeout.');
                process.exit(received === 'SIGINT' ? 130 : 143);
            }, () => {
                console.error(`Cleanup could not be verified; private runtime retained: ${runtime.runRoot}`);
                process.exit(1);
            });
        }, 30000);
    }
    const onInt = () => interrupt('SIGINT');
    const onTerm = () => interrupt('SIGTERM');
    process.on('SIGINT', onInt);
    process.on('SIGTERM', onTerm);
    const allResults = [];
    let expectedTotal;
    let failure;
    try {
        runtime = await createRuntime({...options, signal: controller.signal});
        console.log(`Isolated PostgreSQL ${runtime.serverVersion}: fresh loopback cluster ready.`);
        controller.signal.throwIfAborted();
        const {openSuite, assertSafeImports} = require('./context.cjs');
        const {runIdentity, expectedCases: identityCases} = require('./identity.cjs');
        const {runCatalog, expectedCases: catalogCases} = require('./catalog.cjs');
        assert([identityCases, catalogCases].every(count => Number.isInteger(count) && count > 0), 'Every PostgreSQL suite needs a positive scenario inventory');
        expectedTotal = identityCases + catalogCases;
        assertSafeImports();
        // A runaway test still cannot strand the server: the watchdog goes
        // through the owned-cluster shutdown guard before exiting.
        fatalTimeout = setTimeout(() => interrupt('SIGTERM'), 300000);
        for (const [label, run, expected] of [
            ['identity', runIdentity, identityCases], ['catalog', runCatalog, catalogCases],
        ]) {
            controller.signal.throwIfAborted();
            activeContext = await openSuite(label, runtime);
            activeContext.signal = controller.signal;
            try {
                const results = await run(activeContext);
                assert.equal(results.length, expected, `${label}: scenario inventory changed without updating the runner`);
                assert(results.every(result => result.status === 'PASS'), `${label}: all scenarios must pass`);
                allResults.push(...results);
                for (const result of results) {
                    const assertions = Number.isInteger(result.assertions) ? ` (${result.assertions} assertions)` : '';
                    console.log(`PASS ${result.name}${assertions}`);
                }
            } catch (error) {
                for (const result of error.results || []) {
                    if (result.status === 'PASS') allResults.push(result);
                    console.error(`${result.status} ${result.name}`);
                    if (result.failure) console.error(`Failure kind: ${result.failure.kind}; code: ${result.failure.code || 'none'}; assertion: ${result.failure.assertion || 'none'}`);
                }
                throw error;
            } finally {
                await activeContext.dispose();
                activeContext = undefined;
            }
            assertSafeImports();
        }
        assert.equal(allResults.length, expectedTotal, 'Every declared PostgreSQL scenario must run');
    } catch (error) {
        failure = error;
        // Never print driver errors/SQL parameters, credentials or fixture rows.
        console.error(signal ? `FAIL interrupted (${signal})` : `FAIL PostgreSQL verification (${error.code || error.name || 'error'})`);
        if (!runtime) console.error(error.message);
    } finally {
        clearTimeout(fatalTimeout);
        try {
            if (activeContext) await activeContext.dispose();
        } catch {
            failure = failure || new Error('Suite cleanup failed');
            console.error('Suite disposal failed; stopping the owned test cluster.');
        }
        try {
            if (runtime) {
                await cleanupRuntime(runtime);
                cleanupComplete = true;
                console.log('Owned PostgreSQL stopped; test data and credentials removed.');
            }
        } catch {
            failure = failure || new Error('Cluster cleanup failed');
            console.error(`Cleanup could not be verified; private runtime retained: ${runtime.runRoot}`);
        } finally {
            clearTimeout(interruptWatchdog);
            process.off('SIGINT', onInt);
            process.off('SIGTERM', onTerm);
        }
    }
    if (failure || signal || !cleanupComplete) return signal ? (signal === 'SIGINT' ? 130 : 143) : 1;
    console.log(`PASS ${allResults.length}/${expectedTotal} PostgreSQL scenarios; cleanup verified.`);
    return 0;
}

if (require.main === module) main().then(code => process.exit(code), error => {
    console.error(error.message);
    process.exit(1);
});

module.exports = {main, parseArgs};
