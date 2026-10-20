#!/usr/bin/env node
'use strict';

// A plan performs reads only. Applying it needs a matching plan hash AND the
// human's approval of these exact IAM/local actions. Flags cannot grant consent.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {JOURNAL_ROOT, inspectDirectory, readPrivateFile} = require('./exercise-state.cjs');

const ACCOUNT = '915173132322';
const REGION = 'eu-north-1';
const USER = 'grippo-exercise-publisher';
const PROFILE = 'grippo-exercise-publisher-keychain';
const AUTHORITY_PROFILE = 'grippo-exercise-publisher';
const POLICY_NAME = 'GrippoExerciseImagesCreateOnly';
const BUCKET = 'grippo-bucket';
const SETUP_ROOT = path.join(JOURNAL_ROOT, 'aws-access');
const POLICY_FILE = path.resolve(__dirname, '../references/publisher-iam-policy.json');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = code => { throw Object.assign(new Error(code), {safeCode: code}); };

function awsEnvironment() {
    const env = {...process.env};
    for (const name of Object.keys(env)) {
        if (/^AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN|SECURITY_TOKEN|PROFILE|DEFAULT_PROFILE|CONFIG_FILE|SHARED_CREDENTIALS_FILE|CA_BUNDLE|ENDPOINT_URL.*|WEB_IDENTITY_TOKEN_FILE|ROLE_ARN|ROLE_SESSION_NAME|CONTAINER_.*|EC2_METADATA_SERVICE_ENDPOINT.*)$/.test(name)) delete env[name];
    }
    for (const name of Object.keys(env)) {
        if (/^(NODE_OPTIONS|NODE_PATH|PYTHONPATH|PYTHONHOME|DYLD_.*|LD_PRELOAD|LD_LIBRARY_PATH|SSL_CERT_FILE|SSL_CERT_DIR|REQUESTS_CA_BUNDLE|CURL_CA_BUNDLE)$/.test(name)) delete env[name];
    }
    const home = os.userInfo().homedir;
    return {...env, AWS_CONFIG_FILE: path.join(home, '.aws/config'),
        AWS_SHARED_CREDENTIALS_FILE: path.join(home, '.aws/credentials'),
        AWS_EC2_METADATA_DISABLED: 'true', AWS_MAX_ATTEMPTS: '1', AWS_RETRY_MODE: 'standard',
        AWS_PAGER: '', AWS_CLI_AUTO_PROMPT: 'off'};
}

function runAws(args, {profile = AUTHORITY_PROFILE, expectedMissing = false} = {}) {
    const service = args[0];
    const configuration = service === 'configure';
    if (service === 'iam' && ['create-user', 'put-user-policy', 'create-access-key'].includes(args[1])) assertCliHistoryDisabled(runAws, profile);
    const endpoint = service === 'iam' ? 'https://iam.amazonaws.com'
        : service === 'sts' ? `https://sts.${REGION}.amazonaws.com` : `https://s3.${REGION}.amazonaws.com`;
    const flags = ['--profile', profile];
    // IAM's global commercial endpoint signs in us-east-1. Regional STS and S3
    // keep the bucket's eu-north-1 region.
    if (!configuration) flags.push('--region', service === 'iam' ? 'us-east-1' : REGION, '--endpoint-url', endpoint,
        '--output', 'json', '--no-cli-pager', '--cli-connect-timeout', '10', '--cli-read-timeout', '20');
    const result = spawnSync('aws', [...args, ...flags], {
        shell: false, encoding: 'utf8', timeout: 35000, maxBuffer: 1024 * 1024, env: awsEnvironment(),
    });
    if (result.status !== 0 || result.error || result.signal) {
        // AWS CLI configure get returns 1 for an unset scalar. Accept this
        // narrowly for our two non-secret history metadata reads only.
        if (!result.error && !result.signal && result.status === 1 && configuration
            && args[1] === 'get' && ['cli_history', 'default.cli_history'].includes(args[2])
            && !result.stdout.trim() && !result.stderr.trim()) return '';
        if (!result.error && !result.signal && expectedMissing && /\(NoSuchEntity\)/.test(result.stderr || '')) return null;
        // CLI output may contain credentials or endpoint traces. Never echo it.
        fail(result.error?.code === 'ENOENT' ? 'AWS_CLI_NOT_FOUND' : 'AWS_REQUEST_FAILED_RECONCILE_BEFORE_RETRY');
    }
    if (configuration) return result.stdout.trim();
    try { return JSON.parse(result.stdout || '{}'); }
    catch { fail('AWS_RESPONSE_INVALID_RECONCILE_BEFORE_RETRY'); }
}

function assertCliHistoryDisabled(run = runAws, profile = AUTHORITY_PROFILE) {
    // Official AWS CLI history records API responses. Never let CreateAccessKey
    // persist its secret response there. Do not change existing configuration.
    for (const name of ['cli_history', 'default.cli_history']) {
        const value = run(['configure', 'get', name], {profile});
        if (value === 'enabled') fail('AWS_CLI_HISTORY_ENABLED_REQUIRES_EXPLICIT_CONFIGURATION_CHANGE');
        if (!['', 'disabled'].includes(value)) fail('AWS_CLI_HISTORY_CONFIGURATION_UNRECOGNIZED');
    }
}

function expectedPolicy() {
    return {Version: '2012-10-17', Statement: [
        {Sid: 'CreateOnlyExerciseWebP', Effect: 'Allow', Action: 's3:PutObject',
            Resource: 'arn:aws:s3:::grippo-bucket/example-images/*.webp',
            Condition: {Bool: {'aws:SecureTransport': 'true'}, StringEquals: {
                's3:ResourceAccount': ACCOUNT, 's3:if-none-match': '*',
            }}},
        {Sid: 'DenyNestedKeys', Effect: 'Deny', Action: 's3:PutObject',
            Resource: 'arn:aws:s3:::grippo-bucket/example-images/*/*'},
    ]};
}

function readPolicy() {
    let policy;
    try {
        const stat = fs.lstatSync(POLICY_FILE);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16384) fail('POLICY_FILE_UNSAFE');
        policy = JSON.parse(fs.readFileSync(POLICY_FILE, 'utf8'));
    } catch (error) { if (error.safeCode) throw error; fail('POLICY_READ_FAILED'); }
    if (JSON.stringify(policy) !== JSON.stringify(expectedPolicy())) fail('POLICY_DIFF_REQUIRES_CODE_REVIEW');
    return policy;
}

function credentialProcess() {
    const node = fs.realpathSync(process.execPath);
    const script = path.join(__dirname, 'exercise-vault.cjs');
    // AWS splits this command into arguments. Do not accept shell substitutions,
    // relative paths, HOME expansion, or command fragments from configuration.
    if (![node, script].every(value => path.isAbsolute(value) && /^[a-zA-Z0-9 /._-]+$/.test(value))) fail('CREDENTIAL_PROCESS_PATH_UNSAFE');
    return `"${node}" "${script}" --aws-credential-process`;
}

function assertAwsConfigSafe() {
    const directory = path.join(os.userInfo().homedir, '.aws');
    let stat;
    try { stat = fs.lstatSync(directory); } catch { fail('EXISTING_AWS_DIRECTORY_REQUIRED'); }
    if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid() || stat.mode & 0o022) fail('AWS_DIRECTORY_UNSAFE');
    for (const name of ['config', 'credentials']) {
        try {
            stat = fs.lstatSync(path.join(directory, name));
            if (!stat.isFile() || stat.isSymbolicLink() || stat.uid !== process.getuid() || stat.mode & 0o022) fail('AWS_FILE_UNSAFE');
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
}

function assertIdentity(identity, restricted = false) {
    if (identity?.Account !== ACCOUNT || typeof identity.Arn !== 'string') fail('AWS_ACCOUNT_MISMATCH');
    const expected = `arn:aws:iam::${ACCOUNT}:user/${USER}`;
    if (restricted ? identity.Arn !== expected
        : !new RegExp(`^arn:aws:iam::${ACCOUNT}:(root|user/[a-zA-Z0-9+=,.@_/-]+)$`).test(identity.Arn)) fail('AWS_IDENTITY_MISMATCH');
}

function buildPlan(run = runAws) {
    assertAwsConfigSafe();
    assertCliHistoryDisabled(run);
    const policy = readPolicy();
    const identity = run(['sts', 'get-caller-identity']);
    assertIdentity(identity);
    if (run(['iam', 'get-user', '--user-name', USER], {expectedMissing: true}) !== null) fail('IAM_USER_EXISTS_RECONCILIATION_REQUIRED');
    const profiles = run(['configure', 'list-profiles']);
    if (profiles.split(/\r?\n/).includes(PROFILE)) fail('AWS_PROFILE_EXISTS_RECONCILIATION_REQUIRED');
    const encryption = run(['s3api', 'get-bucket-encryption', '--bucket', BUCKET, '--expected-bucket-owner', ACCOUNT]);
    const rules = encryption.ServerSideEncryptionConfiguration?.Rules;
    if (!Array.isArray(rules) || rules.length !== 1 || rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm !== 'AES256') fail('BUCKET_ENCRYPTION_REQUIRES_SEPARATE_PLAN');
    const plan = {schemaVersion: 1, awsAccount: ACCOUNT, authorityArn: identity.Arn,
        authorityProfile: AUTHORITY_PROFILE, userName: USER, region: REGION,
        bucket: BUCKET, objectPrefix: 'example-images/', profile: PROFILE,
        policyName: POLICY_NAME, policy, policySha256: sha256(JSON.stringify(policy)),
        credentialProcess: credentialProcess(), operations: [
            'iam:CreateUser (new user only)', 'iam:PutUserPolicy (fixed create-only S3 policy)',
            'iam:CreateAccessKey (one key; secret stored only in encrypted local vault)',
            'Local AWS profile region/output/credential_process (new named profile only)',
            'Read-only STS identity verification; no S3 upload',
        ], automaticRetry: false, automaticRollback: false};
    return {...plan, planSha256: sha256(JSON.stringify(plan))};
}

function syncDirectory(directory) {
    const fd = fs.openSync(directory, fs.constants.O_RDONLY | (fs.constants.O_DIRECTORY ?? 0));
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

function writeState(file, value) {
    inspectDirectory(SETUP_ROOT, {root: JOURNAL_ROOT, create: true});
    let fd;
    try {
        fd = fs.openSync(path.join(SETUP_ROOT, file), 'wx', 0o600);
        fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`);
        fs.fsyncSync(fd);
        syncDirectory(SETUP_ROOT);
    } catch { fail('AWS_SETUP_STATE_WRITE_FAILED_RECONCILIATION_REQUIRED'); }
    finally { if (fd !== undefined) fs.closeSync(fd); }
}

function assertNewUserStillRestricted(run = runAws) {
    const user = run(['iam', 'get-user', '--user-name', USER]).User;
    if (user?.Arn !== `arn:aws:iam::${ACCOUNT}:user/${USER}` || user.PermissionsBoundary) fail('IAM_USER_CONFIGURATION_CHANGED');
    const checks = [
        [['iam', 'list-attached-user-policies', '--user-name', USER], 'AttachedPolicies', []],
        [['iam', 'list-groups-for-user', '--user-name', USER], 'Groups', []],
        [['iam', 'list-access-keys', '--user-name', USER], 'AccessKeyMetadata', []],
        [['iam', 'list-user-policies', '--user-name', USER], 'PolicyNames', [POLICY_NAME]],
    ];
    for (const [args, field, expected] of checks) {
        if (JSON.stringify(run(args)[field]) !== JSON.stringify(expected)) fail('IAM_USER_CONFIGURATION_CHANGED');
    }
    if (run(['iam', 'get-login-profile', '--user-name', USER], {expectedMissing: true}) !== null) fail('IAM_CONSOLE_LOGIN_UNEXPECTED');
    const actual = run(['iam', 'get-user-policy', '--user-name', USER, '--policy-name', POLICY_NAME]);
    let policy = actual.PolicyDocument;
    if (typeof policy === 'string') {
        try { policy = JSON.parse(decodeURIComponent(policy)); } catch { fail('IAM_POLICY_READBACK_INVALID'); }
    }
    // AWS may reorder JSON keys, so compare semantics rather than serialization.
    if (canonical(policy) !== canonical(expectedPolicy())) fail('IAM_POLICY_READBACK_MISMATCH');
}

function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
}

async function apply(expectedHash) {
    if (!/^[a-f0-9]{64}$/.test(expectedHash || '')) fail('EXPECTED_PLAN_SHA256_REQUIRED');
    if (readPrivateFile(path.join(SETUP_ROOT, 'setup-started.json'), JOURNAL_ROOT)) fail('PREVIOUS_AWS_SETUP_REQUIRES_RECONCILIATION');
    const plan = buildPlan();
    if (plan.planSha256 !== expectedHash) fail('AWS_PLAN_CHANGED');
    const vault = require('./exercise-vault.cjs');
    await vault.installVault();
    const existingRecord = await vault.readRecord('aws');
    if (existingRecord) {
        existingRecord.AccessKeyId = '';
        existingRecord.SecretAccessKey = '';
        fail('AWS_VAULT_RECORD_EXISTS_RECONCILIATION_REQUIRED');
    }
    writeState('setup-started.json', {plan, startedAt: new Date().toISOString()});
    writeState('01-create-user-started.json', {operation: 'CreateUser', planSha256: expectedHash});
    const created = runAws(['iam', 'create-user', '--user-name', USER]);
    if (created.User?.Arn !== `arn:aws:iam::${ACCOUNT}:user/${USER}`) fail('CREATE_USER_RESPONSE_UNCONFIRMED');
    writeState('01-create-user-result.json', {created: true, userName: USER, userId: created.User.UserId});
    writeState('02-put-policy-started.json', {operation: 'PutUserPolicy', policySha256: plan.policySha256});
    runAws(['iam', 'put-user-policy', '--user-name', USER, '--policy-name', POLICY_NAME,
        '--policy-document', JSON.stringify(plan.policy)]);
    writeState('02-put-policy-result.json', {policyAttached: true, policySha256: plan.policySha256});
    assertNewUserStillRestricted();
    writeState('03-create-key-started.json', {operation: 'CreateAccessKey', userName: USER});
    const response = runAws(['iam', 'create-access-key', '--user-name', USER]);
    const key = response.AccessKey;
    if (key?.UserName !== USER || key.Status !== 'Active' || !/^AKIA[A-Z0-9]{16}$/.test(key.AccessKeyId || '')
        || !/^[A-Za-z0-9/+=]{40}$/.test(key.SecretAccessKey || '')) fail('CREATE_KEY_RESPONSE_UNCONFIRMED_RECONCILE');
    try {
        await vault.writeRecord('aws', {schemaVersion: 1, awsAccount: ACCOUNT, region: REGION,
            userName: USER, AccessKeyId: key.AccessKeyId, SecretAccessKey: key.SecretAccessKey});
    } catch { fail('KEY_CREATED_VAULT_WRITE_FAILED_RECONCILIATION_REQUIRED'); }
    finally { if (key) key.SecretAccessKey = undefined; response.AccessKey = undefined; }
    writeState('03-create-key-result.json', {keyCreated: true, vaultStored: true});
    // All credentials stay out of AWS config/credentials. Existing profiles and
    // the default profile are preserved by named-profile configure operations.
    assertAwsConfigSafe();
    if (runAws(['configure', 'list-profiles']).split(/\r?\n/).includes(PROFILE)) fail('AWS_PROFILE_CREATED_CONCURRENTLY_RECONCILE');
    writeState('04-configure-profile-started.json', {profile: PROFILE, credentialProcess: plan.credentialProcess});
    for (const [name, value] of [['region', REGION], ['output', 'json'], ['credential_process', plan.credentialProcess]]) {
        runAws(['configure', 'set', name, value], {profile: PROFILE});
    }
    const result = await check();
    writeState('setup-result.json', {...result, planSha256: expectedHash, completedAt: new Date().toISOString()});
    return result;
}

function verifyPublisherProfile() {
    assertAwsConfigSafe();
    assertCliHistoryDisabled(runAws, PROFILE);
    const configured = runAws(['configure', 'get', 'credential_process'], {profile: PROFILE});
    if (configured !== credentialProcess()) fail('AWS_PROFILE_CREDENTIAL_PROCESS_MISMATCH');
    const region = runAws(['configure', 'get', 'region'], {profile: PROFILE});
    if (region !== REGION) fail('AWS_PROFILE_REGION_MISMATCH');
    const identity = runAws(['sts', 'get-caller-identity'], {profile: PROFILE});
    assertIdentity(identity, true);
}

async function check() {
    const record = await require('./exercise-vault.cjs').readRecord('aws');
    try {
        if (!record || record.schemaVersion !== 1 || record.awsAccount !== ACCOUNT || record.region !== REGION || record.userName !== USER) fail('AWS_VAULT_RECORD_MISSING_OR_MISMATCH');
    } finally {
        if (record) { record.AccessKeyId = ''; record.SecretAccessKey = ''; }
    }
    verifyPublisherProfile();
    return {status: 'AWS_ACCESS_READY', awsAccount: ACCOUNT, userName: USER, profile: PROFILE,
        region: REGION, vaultRecordPresent: true, credentialsPrinted: false, uploadPerformed: false};
}

function parseArguments(args) {
    if (args.length === 1 && ['--plan', '--check'].includes(args[0])) return {mode: args[0].slice(2)};
    if (args.length === 3 && args[0] === '--apply' && args[1] === '--expected-plan-sha256'
        && /^[a-f0-9]{64}$/.test(args[2])) return {mode: 'apply', expectedHash: args[2]};
    fail('USE_PLAN_OR_CHECK_OR_APPLY_WITH_EXACT_PLAN_HASH');
}

async function main() {
    const args = parseArguments(process.argv.slice(2));
    const result = args.mode === 'plan' ? {status: 'AWS_SETUP_PLAN', ...buildPlan()}
        : args.mode === 'check' ? await check() : await apply(args.expectedHash);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) main().catch(error => {
    process.stderr.write(`${JSON.stringify({status: 'FAIL', code: error.safeCode || 'AWS_ACCESS_OPERATION_FAILED'})}\n`);
    process.exitCode = 1;
});

module.exports = {awsEnvironment, parseArguments, buildPlan, expectedPolicy, readPolicy, canonical, assertIdentity, credentialProcess, verifyPublisherProfile, assertCliHistoryDisabled};
