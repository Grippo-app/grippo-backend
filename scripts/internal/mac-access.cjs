'use strict';

// Migration uses only our two records. No credentials are written to AWS files.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {TextDecoder} = require('node:util');
const vault = require('../../.agents/skills/grippo-exercise-create/scripts/exercise-vault.cjs');

const PROFILE = 'grippo-exercise-publisher-keychain';
const REGION = 'eu-north-1';
const MAX_CONFIG = 1024 * 1024;
const fail = code => { throw Object.assign(new Error(code), {safeCode: code}); };
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

function createAccess({home = os.userInfo().homedir, store = vault, node = process.execPath} = {}) {
    const awsDirectory = path.join(home, '.aws');
    const configFile = path.join(awsDirectory, 'config');
    const credentialFile = path.join(awsDirectory, 'credentials');
    const script = path.resolve(__dirname, '../../.agents/skills/grippo-exercise-create/scripts/exercise-vault.cjs');

    function checkAwsDirectory(create = false) {
        let current = path.parse(awsDirectory).root;
        for (const part of awsDirectory.slice(current.length).split(path.sep).filter(Boolean)) {
            current = path.join(current, part);
            let stat;
            try { stat = fs.lstatSync(current); }
            catch (error) {
                if (error.code !== 'ENOENT') fail('MAC_AWS_DIRECTORY_UNSAFE');
                if (!create) return false;
                if (current !== awsDirectory) fail('MAC_AWS_DIRECTORY_UNSAFE');
                fs.mkdirSync(current, {mode: 0o700});
                const parent = fs.openSync(path.dirname(current), fs.constants.O_RDONLY | fs.constants.O_DIRECTORY);
                try { fs.fsyncSync(parent); } finally { fs.closeSync(parent); }
                stat = fs.lstatSync(current);
            }
            const safeOwner = [0, process.getuid()].includes(stat.uid);
            const safeMode = !(stat.mode & 0o022) || stat.uid === 0 && Boolean(stat.mode & 0o1000);
            if (!stat.isDirectory() || stat.isSymbolicLink() || !safeOwner || !safeMode
                || current === awsDirectory && stat.uid !== process.getuid()) fail('MAC_AWS_DIRECTORY_UNSAFE');
        }
        return true;
    }

    function validateRecords(records) {
        if (!records || Array.isArray(records) || Object.keys(records).sort().join(',') !== 'admin,aws') fail('MAC_ACCESS_RECORDS_INVALID');
        for (const kind of ['admin', 'aws']) {
            if (!records[kind]) fail('MAC_ACCESS_RECORD_MISSING');
            vault.validateRecord(kind, records[kind]);
        }
    }

    async function readRecords() {
        const records = {admin: await store.readRecord('admin'), aws: await store.readRecord('aws')};
        validateRecords(records);
        return records;
    }

    async function preflightRecords(records) {
        validateRecords(records);
        for (const kind of ['admin', 'aws']) {
            const current = await store.readRecord(kind);
            if (current && !same(current, records[kind])) fail('MAC_ACCESS_EXISTING_RECORD_CONFLICT');
        }
        return {compatible: true};
    }

    async function importRecords(records) {
        await preflightRecords(records);
        // Never erase a record after a partial failure. An identical retry reads
        // the stored value first and skips it; a differing value stops the import.
        for (const kind of ['admin', 'aws']) {
            const current = await store.readRecord(kind);
            if (current) {
                if (!same(current, records[kind])) fail('MAC_ACCESS_EXISTING_RECORD_CONFLICT');
                continue;
            }
            await store.writeRecord(kind, records[kind]);
            const saved = await store.readRecord(kind);
            if (!saved || !same(saved, records[kind])) fail('MAC_ACCESS_RECORD_READBACK_MISMATCH');
        }
        return {imported: true};
    }

    function readAwsFile(file) {
        if (!checkAwsDirectory()) return null;
        let fd;
        try {
            const stat = fs.lstatSync(file);
            if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid()
                || stat.mode & 0o022 || stat.size > MAX_CONFIG) fail('MAC_AWS_FILE_UNSAFE');
            fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
            const opened = fs.fstatSync(fd);
            if (stat.dev !== opened.dev || stat.ino !== opened.ino || stat.size !== opened.size) fail('MAC_AWS_FILE_CHANGED');
            const bytes = Buffer.alloc(opened.size + 1);
            let count = 0;
            while (count < bytes.length) {
                const read = fs.readSync(fd, bytes, count, bytes.length - count, null);
                if (!read) break;
                count += read;
            }
            const after = fs.fstatSync(fd);
            if (count !== opened.size || opened.size !== after.size || opened.mtimeMs !== after.mtimeMs || opened.ctimeMs !== after.ctimeMs) fail('MAC_AWS_FILE_CHANGED');
            return {text: new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes.subarray(0, count)), stat};
        } catch (error) {
            if (error.code === 'ENOENT') return null;
            if (error.safeCode) throw error;
            fail('MAC_AWS_FILE_READ_FAILED');
        } finally { if (fd !== undefined) fs.closeSync(fd); }
    }

    function sections(text) {
        const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
        const found = [];
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index].replace(/\r?\n$/, '');
            if (/^\s*\[/.test(line)) {
                const match = /^\s*\[([^\]\r\n]+)\]\s*(?:[#;].*)?$/.exec(line);
                if (!match) fail('MAC_AWS_CONFIG_INVALID');
                if (found.length) found[found.length - 1].end = index;
                found.push({name: match[1].trim(), start: index, end: lines.length});
            }
        }
        return {lines, found};
    }

    function profilePlan() {
        const executable = fs.realpathSync(node);
        if (![executable, script].every(value => path.isAbsolute(value) && /^[a-zA-Z0-9 /._@-]+$/.test(value))) fail('MAC_AWS_PROCESS_PATH_UNSAFE');
        const credentialProcess = `"${executable}" "${script}" --aws-credential-process`;
        const config = readAwsFile(configFile);
        const credentials = readAwsFile(credentialFile);
        if (credentials && sections(credentials.text).found.some(section => section.name === PROFILE)) fail('MAC_AWS_STATIC_PROFILE_CONFLICT');
        const parsed = sections(config?.text || '');
        const own = parsed.found.filter(section => section.name === `profile ${PROFILE}`);
        if (own.length > 1) fail('MAC_AWS_DUPLICATE_PROFILE');
        // An enabled CLI history can persist a credential-process response. Do
        // not change the user's global history policy behind their back.
        for (const section of parsed.found.filter(value => ['default', `profile ${PROFILE}`].includes(value.name))) {
            const body = parsed.lines.slice(section.start + 1, section.end).join('');
            if (/^\s*cli_history\s*=\s*(?!disabled\s*(?:[#;].*)?$)\S+/im.test(body)) fail('MAC_AWS_HISTORY_MUST_BE_DISABLED');
        }
        if (own.length) {
            const values = {};
            for (const line of parsed.lines.slice(own[0].start + 1, own[0].end)) {
                if (!line.trim() || /^\s*[#;]/.test(line)) continue;
                const match = /^\s*([a-z_]+)\s*=\s*(.*?)\s*$/.exec(line);
                if (!match || Object.hasOwn(values, match[1])) fail('MAC_AWS_PROFILE_CONFLICT');
                values[match[1]] = match[2];
            }
            if (Object.keys(values).sort().join(',') !== 'credential_process,output,region'
                || values.region !== REGION || values.output !== 'json'
                || !/^"\/[a-zA-Z0-9 /._@-]+" "\/[a-zA-Z0-9 /._@-]+\/exercise-vault\.cjs" --aws-credential-process$/.test(values.credential_process)) {
                fail('MAC_AWS_PROFILE_CONFLICT');
            }
            if (values.credential_process === credentialProcess) return {status: 'matches', config, credentials, text: config.text};
        }
        const section = `[profile ${PROFILE}]\nregion = ${REGION}\noutput = json\ncredential_process = ${credentialProcess}\n`;
        let text;
        if (own.length) {
            // Change exactly this profile's process line; retain all other bytes,
            // including comments and unrelated profiles.
            const lines = [...parsed.lines];
            for (let i = own[0].start + 1; i < own[0].end; i++) {
                if (/^\s*credential_process\s*=/.test(lines[i])) lines[i] = `credential_process = ${credentialProcess}\n`;
            }
            text = lines.join('');
        } else {
            const original = config?.text || '';
            text = original + (original && !original.endsWith('\n') ? '\n' : '') + section;
        }
        return {status: own.length ? 'rebind_ready' : 'absent', config, credentials, text};
    }

    function assertUnchanged(file, prior) {
        const current = readAwsFile(file);
        if (Boolean(current) !== Boolean(prior) || current && (current.text !== prior.text || current.stat.ino !== prior.stat.ino)) fail('MAC_AWS_CONFIG_CHANGED');
    }

    function configureAwsProfile({write = false} = {}) {
        const plan = profilePlan();
        if (!write || plan.status === 'matches') return {status: plan.status, profile: PROFILE};
        checkAwsDirectory(true);
        assertUnchanged(configFile, plan.config);
        assertUnchanged(credentialFile, plan.credentials);
        let fd;
        let staging;
        try {
            // Replace atomically; a killed process cannot truncate AWS config.
            // Only our import is serialized. Stop other AWS configuration tools
            // during migration, and recheck all observed bytes before commit.
            staging = path.join(awsDirectory, `.grippo-profile-${crypto.randomUUID()}`);
            fd = fs.openSync(staging, fs.constants.O_WRONLY | fs.constants.O_NOFOLLOW | fs.constants.O_CREAT | fs.constants.O_EXCL, 0o600);
            fs.writeFileSync(fd, plan.text);
            if (plan.config) fs.fchmodSync(fd, plan.config.stat.mode & 0o777);
            fs.fsyncSync(fd);
            fs.closeSync(fd);
            fd = undefined;
            assertUnchanged(configFile, plan.config);
            assertUnchanged(credentialFile, plan.credentials);
            if (plan.config) fs.renameSync(staging, configFile);
            else {
                fs.linkSync(staging, configFile);
                fs.unlinkSync(staging);
            }
            staging = undefined;
            const directory = fs.openSync(awsDirectory, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY);
            try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
        } catch (error) {
            if (error.safeCode) throw error;
            fail('MAC_AWS_CONFIG_WRITE_FAILED_RECONCILE');
        } finally {
            if (fd !== undefined) fs.closeSync(fd);
            if (staging) { try { fs.unlinkSync(staging); } catch { /* Preserve an unexpected failure for inspection. */ } }
        }
        const confirmed = profilePlan();
        if (confirmed.status !== 'matches') fail('MAC_AWS_PROFILE_READBACK_MISMATCH');
        return {status: 'matches', profile: PROFILE};
    }

    async function checkStatus() {
        const installed = await store.status();
        const profile = configureAwsProfile();
        return {vault: installed, awsProfile: profile};
    }

    return {readRecords, preflightRecords, importRecords, configureAwsProfile, checkStatus};
}

module.exports = {...createAccess(), createAccess};
