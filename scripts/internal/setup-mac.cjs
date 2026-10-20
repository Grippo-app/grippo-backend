#!/usr/bin/env node
'use strict';

// Local workstation setup only. Neither import nor readiness runs application
// bootstrap, SSH, Docker daemon queries or any publication/deployment script.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPTS = path.join(ROOT, '.agents/skills/grippo-exercise-create/scripts');
const TOOL_PATH = [
    '/opt/homebrew/opt/node@22/bin', '/usr/local/opt/node@22/bin',
    '/opt/homebrew/opt/node@24/bin', '/usr/local/opt/node@24/bin',
    '/opt/homebrew/opt/python@3.13/libexec/bin', '/usr/local/opt/python@3.13/libexec/bin',
    '/opt/homebrew/opt/python@3.13/bin', '/usr/local/opt/python@3.13/bin',
    '/opt/homebrew/opt/postgresql@15/bin', '/usr/local/opt/postgresql@15/bin',
    '/opt/homebrew/bin', '/usr/local/bin', '/Applications/Docker.app/Contents/Resources/bin',
    '/usr/bin', '/bin', '/usr/sbin', '/sbin',
].join(':');
const FORMULAE = [
    {id: 'python', name: 'python@3.13'}, {id: 'postgresql', name: 'postgresql@15'},
    {id: 'awscli', name: 'awscli'}, {id: 'webp', name: 'webp'},
    {id: 'ripgrep', name: 'ripgrep'}, {id: 'github-cli', name: 'gh'},
];
const SAFE_CODE = /^[A-Z][A-Z0-9_]{2,100}$/;
const safeError = code => Object.assign(new Error(code), {safeCode: code});

function environment() {
    const user = os.userInfo();
    return {
        HOME: user.homedir, USER: user.username, LOGNAME: user.username,
        PATH: TOOL_PATH, LANG: 'en_US.UTF-8', TERM: 'dumb',
        HOMEBREW_NO_AUTO_UPDATE: '1', HOMEBREW_NO_ANALYTICS: '1',
        HOMEBREW_NO_INSTALL_CLEANUP: '1',
        PYTHONDONTWRITEBYTECODE: '1', PYTHONNOUSERSITE: '1',
        AWS_PAGER: '', AWS_CLI_AUTO_PROMPT: 'off', GH_PROMPT_DISABLED: '1',
        GIT_TERMINAL_PROMPT: '0', npm_config_audit: 'false', npm_config_fund: 'false',
        // No proxy, Docker context, AWS credentials/config override, Node preload
        // or alternative Homebrew registry/tap is inherited.
    };
}

function parseArguments(argv) {
    if (!argv.length) return {mode: 'plan'};
    if (argv.length === 1 && ['--help', '--plan', '--install', '--check', '--check-online', '--setup-admin'].includes(argv[0])) {
        return {mode: argv[0].slice(2)};
    }
    if (['--export', '--import'].includes(argv[0]) && typeof argv[1] === 'string'
        && path.isAbsolute(argv[1]) && !/[\p{Cc}\p{Cf}]/u.test(argv[1])) {
        const result = {mode: argv[0].slice(2), file: argv[1], writersStopped: false};
        const seen = new Set();
        for (let index = 2; index < argv.length; index++) {
            const flag = argv[index];
            if (seen.has(flag)) throw safeError('MAC_SETUP_ARGUMENTS_INVALID');
            seen.add(flag);
            if (flag === '--writers-stopped') result.writersStopped = true;
            else if (flag === '--resume' && result.mode === 'import') result.resume = true;
            else if (['--ssh-key', '--env-file'].includes(flag) && result.mode === 'export') {
                const value = argv[++index];
                if (typeof value !== 'string' || !path.isAbsolute(value) || /[\p{Cc}\p{Cf}]/u.test(value)) throw safeError('MAC_SETUP_ARGUMENTS_INVALID');
                result[flag === '--ssh-key' ? 'sshKeyFile' : 'envFile'] = value;
            } else throw safeError('MAC_SETUP_ARGUMENTS_INVALID');
        }
        if (result.writersStopped) return result;
    }
    throw safeError('MAC_SETUP_ARGUMENTS_INVALID');
}

function command(executable, args, options = {}) {
    const result = spawnSync(executable, args, {
        cwd: ROOT, env: environment(), encoding: 'utf8', shell: false,
        stdio: options.interactive ? ['inherit', 'pipe', 'inherit'] : ['ignore', 'pipe', 'pipe'],
        timeout: options.timeout || 30000, maxBuffer: 4 * 1024 * 1024,
    });
    return {ok: !result.error && result.status === 0, output: result.stdout || ''};
}

function executable(name) {
    for (const directory of TOOL_PATH.split(':')) {
        const file = path.join(directory, name);
        try { fs.accessSync(file, fs.constants.X_OK); if (fs.statSync(file).isFile()) return file; } catch {}
    }
    return null;
}

function installedApp(name) {
    return ['/Applications', path.join(os.userInfo().homedir, 'Applications')]
        .some(directory => fs.existsSync(path.join(directory, `${name}.app/Contents/Info.plist`)));
}

function version(name, args, expression, run = command) {
    const bin = executable(name);
    if (!bin) return null;
    const result = run(bin, args);
    return result.ok ? expression.exec(result.output)?.[1] || null : null;
}

function capability(id, status, next, details = {}) {
    return {id, status, required: true, ...(next ? {next} : {}), ...details};
}

function inventory(run = command) {
    const results = [];
    const clt = run('/usr/bin/xcode-select', ['-p']).ok;
    results.push(capability('xcode-clt', clt ? 'READY' : 'PENDING', clt ? null : 'Run xcode-select --install, finish Apple installer, then rerun.'));
    const brew = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew'].find(file => fs.existsSync(file));
    results.push(capability('homebrew', brew ? 'READY' : 'PENDING', brew ? null : 'Run --install in a local Terminal for the pinned verified official installer; complete system prompts.'));
    const major = Number(process.versions.node.split('.')[0]);
    results.push(capability('node', [22, 24].includes(major) ? 'READY' : 'PENDING', [22, 24].includes(major) ? null : 'Install supported Node.js 22 or 24.', {version: process.versions.node, dockerRuntimeMajor: 20}));
    // Apple's python3 shim may offer the CLT installer when tools are absent.
    const pythonBin = executable('python3');
    const python = !clt && pythonBin === '/usr/bin/python3' ? null : version('python3', ['--version'], /^Python (\d+\.\d+\.\d+)/, run);
    const pythonReady = Boolean(python && Number(python.split('.')[0]) === 3 && Number(python.split('.')[1]) >= 11);
    results.push(capability('python', pythonReady ? 'READY' : 'PENDING', pythonReady ? null : 'Install python@3.13 (Python 3.11+ is sufficient).', {version: python}));
    const pgNames = ['postgres', 'initdb', 'pg_ctl', 'psql', 'createdb', 'dropdb', 'pg_dump'];
    const pgReady = pgNames.every(name => /^15\./.test(version(name, ['--version'], /(?:PostgreSQL\)?\s+)(\d+\.\d+)/, run) || ''));
    results.push(capability('postgresql', pgReady ? 'READY' : 'PENDING', pgReady ? null : 'Install postgresql@15 binaries. No service is started.', {serverStarted: false}));
    const aws = version('aws', ['--version'], /^aws-cli\/(\d+\.\d+\.\d+)/, run);
    results.push(capability('awscli', /^2\./.test(aws || '') ? 'READY' : 'PENDING', /^2\./.test(aws || '') ? null : 'Install awscli version 2.', {version: aws}));
    const webp = ['cwebp', 'dwebp', 'webpinfo'].every(name => version(name, ['-version'], /(\d+\.\d+\.\d+)/, run));
    results.push(capability('webp', webp ? 'READY' : 'PENDING', webp ? null : 'Install webp with cwebp, dwebp and webpinfo.'));
    for (const [id, name, expression] of [
        ['ripgrep', 'rg', /^ripgrep (\d+\.\d+\.\d+)/],
        ['github-cli', 'gh', /^gh version (\d+\.\d+\.\d+)/],
        ['git', 'git', /^git version (\d+\.\d+\.\d+)/],
    ]) {
        const found = clt || name !== 'git' ? version(name, ['--version'], expression, run) : null;
        results.push(capability(id, found ? 'READY' : 'PENDING', found ? null : `Install ${name === 'git' ? 'Apple Command Line Tools' : name}.`, {version: found}));
    }
    const docker = installedApp('Docker') && version('docker', ['--version'], /^Docker version (\d+\.\d+\.\d+)/, run);
    results.push(capability('docker-desktop', docker ? 'READY' : 'PENDING', docker ? null : 'Run --install in a local Terminal, or brew install --cask homebrew/cask/docker-desktop; finish local first-run setup manually.', {version: docker || null, daemonChecked: false}));
    const compose = executable('docker') && run(executable('docker'), ['compose', 'version', '--short']);
    const composeReady = Boolean(compose?.ok && /^v?(?:2|5)\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(compose.output.trim()));
    results.push(capability('docker-compose', composeReady ? 'READY' : 'PENDING', composeReady ? null : 'Finish Docker Desktop CLI/Compose installation. No daemon or context is queried.'));
    const codex = installedApp('Codex') || executable('codex');
    results.push(capability('codex-installation', codex ? 'READY' : 'PENDING', codex ? null : 'Run --install in a local Terminal, or brew install --cask homebrew/cask/codex. Sign-in remains manual.', {authenticationChecked: false}));
    return results;
}

function dependenciesReady() {
    try {
        const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
        const installed = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/.package-lock.json'), 'utf8'));
        const expected = Object.entries(lock.packages || {}).filter(([name, value]) => name && !value.optional);
        return expected.length > 0 && expected.every(([name, value]) => installed.packages?.[name]?.version === value.version
            && installed.packages[name].integrity === value.integrity
            && installed.packages[name].resolved === value.resolved
            && fs.existsSync(path.join(ROOT, name, 'package.json')));
    } catch { return false; }
}

function localProjectChecks(mode, run = command) {
    const deps = dependenciesReady();
    const result = [capability('project-dependencies', deps ? 'READY' : 'PENDING', deps ? null : 'Run --install to restore the exact package-lock dependency tree.')];
    if (mode === 'plan' || !deps) {
        result.push(capability('agent-kit', 'NOT_CHECKED', 'Run --check after dependencies are installed.'));
        result.push(capability('typescript', 'NOT_CHECKED', 'Run --check after dependencies are installed.'));
        return result;
    }
    const python = executable('python3');
    const kit = python && run(python, ['-B', path.join(ROOT, 'scripts/validate-agent-kit.py')]);
    result.push(capability('agent-kit', kit?.ok ? 'READY' : 'FAIL', kit?.ok ? null : 'Inspect scripts/validate-agent-kit.py locally. Output is suppressed to avoid exposing arbitrary local configuration.'));
    const typecheck = run(process.execPath, [path.join(ROOT, 'node_modules/typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', path.join(ROOT, 'tsconfig.build.json')], {timeout: 120000});
    result.push(capability('typescript', typecheck.ok ? 'READY' : 'FAIL', typecheck.ok ? null : 'Run the documented noEmit type check locally and resolve errors.'));
    return result;
}

async function accessChecks(mode, run = command) {
    const result = [];
    const status = run(process.execPath, [path.join(SCRIPTS, 'exercise-vault.cjs'), '--status']);
    let metadata;
    try { metadata = status.ok ? JSON.parse(status.output) : null; } catch {}
    result.push(capability('keychain-helper', metadata?.installed ? 'READY' : 'PENDING', metadata?.installed ? null : 'Run --install. An existing mismatched helper requires explicit reconciliation; it is never overwritten.'));
    for (const [id, field] of [['admin-record', 'adminConfigured'], ['aws-record', 'awsConfigured']]) {
        result.push(capability(id, metadata?.[field] === true ? 'READY' : 'PENDING', metadata?.[field] === true ? null : id === 'admin-record' ? 'Import an encrypted transfer bundle or run --setup-admin.' : 'Import the existing publisher access. Do not rerun IAM --apply.'));
    }
    try {
        const profile = await require('./mac-access.cjs').configureAwsProfile({write: false});
        const matched = profile.status === 'matches';
        result.push(capability('aws-profile', matched ? 'READY' : 'PENDING', matched ? null : 'Import the transfer bundle or run --install to bind the own named profile to this Mac.'));
    } catch { result.push(capability('aws-profile', 'PENDING', 'Resolve the own named AWS profile conflict locally; other profiles are preserved.')); }
    if (mode !== 'check-online') {
        for (const id of ['admin-online', 'aws-online', 'github-auth']) result.push(capability(id, 'NOT_CHECKED', 'Run --check-online for explicit network checks.', {required: false}));
        return result;
    }
    for (const [id, script, expected] of [
        ['admin-online', 'exercise-admin-access.cjs', 'admin_access_verified'],
        ['aws-online', 'exercise-aws-access.cjs', 'AWS_ACCESS_READY'],
    ]) {
        const checked = run(process.execPath, [path.join(SCRIPTS, script), '--check'], {timeout: 120000});
        let body;
        try { body = JSON.parse(checked.output); } catch {}
        const verified = checked.ok && body?.status === expected;
        result.push(capability(id, verified ? 'READY' : 'PENDING', verified ? null : 'Existing access verification failed. Resolve credentials/network locally; no automatic reset or retry is performed.'));
    }
    const gh = executable('gh');
    const github = gh && run(gh, ['auth', 'status', '--hostname', 'github.com']);
    result.push(capability('github-auth', github?.ok ? 'READY' : 'PENDING', github?.ok ? null : 'Run gh auth login --hostname github.com locally, then rerun --check-online.'));
    return result;
}

function manualChecks() {
    return ['codex-sign-in', 'image-generation', 'web-research', 'subagents', 'notion-connection', 'server-host-fingerprint', 'environment-runtime-validity']
        .map(id => capability(id, 'NOT_CHECKED', 'Verify in the actual Codex session when this capability is needed. Server trust and runtime binding are not inferred from imported files.', {required: false}));
}

async function readiness(mode, deps = {}) {
    const run = deps.command || command;
    const capabilities = [...inventory(run), ...localProjectChecks(mode, run), ...await accessChecks(mode, run), ...manualChecks()];
    try {
        const migration = await require('./mac-transfer.cjs').checkMigrationStatus();
        const complete = migration.status === 'ready';
        capabilities.push(capability('publication-journal', complete ? 'READY' : 'PENDING', complete ? null : 'Resolve the authenticated transfer journal or interrupted migration before publication.'));
    } catch {
        capabilities.push(capability('publication-journal', 'PENDING', 'Verify the publication journal and migration receipts. No files were changed.'));
    }
    let server;
    try { server = await require('./mac-server-access.cjs').checkStatus(); } catch {}
    capabilities.push(capability('server-key-file', server?.sshKeyPresent === true ? 'READY' : 'PENDING', server?.sshKeyPresent === true ? null : 'Import a bundle that explicitly includes the existing server SSH key. No server connection is performed.'));
    capabilities.push(capability('environment-file', server?.envFilePresent === true ? 'READY' : 'PENDING', server?.envFilePresent === true ? null : 'Import a bundle that explicitly includes the existing environment file. Runtime binding remains unchecked.'));
    const gaps = capabilities.filter(item => item.required && item.status !== 'READY');
    return {
        schemaVersion: 1, mode, status: gaps.length ? 'PENDING' : 'LOCAL_READY',
        allSkillsReady: false, localReady: gaps.length === 0,
        toolchain: {nodeExecutable: fs.realpathSync(process.execPath), binPath: TOOL_PATH}, capabilities,
        boundary: 'No server connection, deployment, dump, image upload or exercise publication.',
    };
}

async function install(deps = {}) {
    const run = deps.command || command;
    let items = inventory(run);
    const find = id => items.find(item => item.id === id)?.status === 'READY';
    if (!find('homebrew') || !find('xcode-clt')) return readiness('install', deps);
    const brew = executable('brew');
    for (const formula of FORMULAE) {
        if (find(formula.id)) continue;
        process.stderr.write(`Installing missing local dependency: ${formula.name}\n`);
        if (!run(brew, ['install', '--formula', `homebrew/core/${formula.name}`], {timeout: 30 * 60 * 1000}).ok) throw safeError('MAC_SETUP_DEPENDENCY_INSTALL_FAILED');
    }
    for (const [id, cask] of [['docker-desktop', 'docker-desktop'], ['codex-installation', 'codex']]) {
        if (find(id)) continue;
        if (!process.stdin.isTTY) {
            process.stderr.write(`Local Terminal needed for ${cask} installation; rerun --install there to see OS/admin prompts.\n`);
            continue;
        }
        process.stderr.write(`Installing missing local application: ${cask}\n`);
        if (!run(brew, ['install', '--cask', `homebrew/cask/${cask}`], {interactive: true, timeout: 30 * 60 * 1000}).ok) throw safeError('MAC_SETUP_APPLICATION_INSTALL_FAILED');
    }
    items = inventory(run);
    if (items.some(item => ['node', 'python', 'git'].includes(item.id) && item.status !== 'READY')) return readiness('install', deps);
    if (!dependenciesReady()) {
        const lockfile = path.join(ROOT, 'package-lock.json');
        const before = crypto.createHash('sha256').update(fs.readFileSync(lockfile)).digest('hex');
        const npm = path.join(path.dirname(process.execPath), 'npm');
        process.stderr.write('Installing project dependencies from package-lock.json (lifecycle hooks disabled)…\n');
        const installed = run(npm, ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], {timeout: 15 * 60 * 1000});
        const after = crypto.createHash('sha256').update(fs.readFileSync(lockfile)).digest('hex');
        if (!installed.ok || before !== after) throw safeError('MAC_SETUP_NPM_INSTALL_FAILED');
    }
    if (!run(process.execPath, [path.join(SCRIPTS, 'exercise-vault.cjs'), '--install'], {timeout: 180000}).ok) throw safeError('MAC_SETUP_VAULT_INSTALL_FAILED');
    await require('./mac-access.cjs').configureAwsProfile({write: true});
    return readiness('install', deps);
}

async function run(args, deps = {}) {
    if (process.platform !== 'darwin' || typeof process.getuid !== 'function' || process.getuid() === 0) throw safeError('MAC_SETUP_MACOS_USER_REQUIRED');
    if (['export', 'import'].includes(args.mode)) {
        const transfer = require('./mac-transfer.cjs');
        return args.mode === 'export' ? transfer.exportBundle(args.file, {writersStopped: args.writersStopped, sshKeyFile: args.sshKeyFile, envFile: args.envFile})
            : transfer.importBundle(args.file, {writersStopped: args.writersStopped, resume: args.resume === true});
    }
    if (args.mode === 'setup-admin') {
        const checked = (deps.command || command)(process.execPath, [path.join(SCRIPTS, 'exercise-admin-access.cjs'), '--setup'], {interactive: true, timeout: 10 * 60 * 1000});
        if (!checked.ok) throw safeError('MAC_SETUP_ADMIN_SETUP_FAILED');
        return {schemaVersion: 1, status: 'ADMIN_SETUP_COMPLETE', allSkillsReady: false, next: 'Run --check-online to verify the complete local access setup.'};
    }
    if (args.mode === 'install') return install(deps);
    if (['plan', 'check', 'check-online'].includes(args.mode)) return readiness(args.mode, deps);
    throw safeError('MAC_SETUP_ARGUMENTS_INVALID');
}

module.exports = {ROOT, TOOL_PATH, FORMULAE, parseArguments, environment, command, executable, version, inventory, dependenciesReady, localProjectChecks, accessChecks, readiness, install, run};
if (require.main === module) Promise.resolve().then(() => run(parseArguments(process.argv.slice(2)))).then(result => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status === 'PENDING') process.exitCode = 2;
}).catch(error => {
    const code = SAFE_CODE.test(error?.safeCode || '') ? error.safeCode : 'MAC_SETUP_OPERATION_FAILED';
    process.stdout.write(`${JSON.stringify({schemaVersion: 1, status: 'FAIL', code, allSkillsReady: false})}\n`);
    process.exitCode = 1;
});
