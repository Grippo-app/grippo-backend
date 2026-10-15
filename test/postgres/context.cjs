'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Module = require('node:module');
const assert = require('node:assert/strict');
const {assertOwnedRuntime} = require('./runtime.cjs');

const root = path.resolve(__dirname, '../..');
// Explicit connections below never use ambient PostgreSQL/TypeORM configuration.
// No application config, dotenv loader or application bootstrap is imported.
for (const key of Object.keys(process.env)) {
    if (key.startsWith('PG') || key.startsWith('POSTGRES_') || key.startsWith('TYPEORM_')
        || key === 'DATABASE_URL' || key.startsWith('DOTENV_') || key.startsWith('TS_NODE_')) {
        delete process.env[key];
    }
}
process.env.NODE_ENV = 'test';

function allowedSource(relative) {
    return /^src\/entities\/[^/]+\.entity\.ts$/.test(relative)
        || /^src\/lib\/[^/]+\.ts$/.test(relative)
        || relative === 'src/common/snake-naming.strategy.ts'
        || /^src\/i18n\/(exercise-example-i18n\.service|i18n\.types|locale\.helper)\.ts$/.test(relative)
        || /^src\/modules\/(users|weight-history|trainings|exercise-examples)\/[^/]+\.service\.ts$/.test(relative)
        || /^src\/modules\/(users|weight-history|trainings|exercise-examples|muscles|equipments)\/dto\/(?!.*\.spec\.ts$)[^/]+\.ts$/.test(relative);
}

function assertSafeImport(filename) {
    if (typeof filename !== 'string') return;
    const relative = path.relative(root, filename).split(path.sep).join('/');
    if (relative.startsWith('src/')) {
        assert(allowedSource(relative), 'Application/config/database bootstrap import is forbidden in PostgreSQL tests');
    }
    assert(!filename.includes(`${path.sep}node_modules${path.sep}dotenv${path.sep}config.`)
        && !filename.includes(`${path.sep}node_modules${path.sep}@nestjs${path.sep}config${path.sep}`),
    'Environment/config loaders are forbidden in PostgreSQL tests');
}

// Guard transitive imports BEFORE evaluation. Checking require.cache afterwards
// alone would be too late if a future service imported a database provider.
const actualLoad = Module._load;
Module._load = function (request, parent, isMain) {
    assertSafeImport(Module._resolveFilename(request, parent, isMain));
    return actualLoad.apply(this, arguments);
};
function assertSafeImports() {
    for (const filename of Object.keys(require.cache)) assertSafeImport(filename);
}
assertSafeImports();

const req = Module.createRequire(path.join(root, 'package.json'));
req('ts-node').register({project: path.join(root, 'tsconfig.json'), transpileOnly: true});
req('reflect-metadata');
// TypeORM imports dotenv as an inert utility. Disable its file-loading entry
// points before importing TypeORM; parsing a supplied string remains harmless.
const dotenv = req('dotenv');
const rejectEnvironmentLoad = () => { throw new Error('Loading environment files is forbidden in PostgreSQL tests'); };
dotenv.config = rejectEnvironmentLoad;
dotenv.configDotenv = rejectEnvironmentLoad;
Object.freeze(dotenv);
const {DataSource} = req('typeorm');
const {Client} = req('pg');
const {SnakeNamingStrategy} = require(path.join(root, 'src/common/snake-naming.strategy.ts'));
function load(relative) {
    assert(typeof relative === 'string' && relative.startsWith('src/') && !relative.includes('..'));
    assert(allowedSource(relative), 'Only reviewed entities/services/DTO imports are allowed');
    const exported = require(path.join(root, relative));
    assertSafeImports();
    return exported;
}
const E = {};
for (const file of fs.readdirSync(path.join(root, 'src/entities')).filter(file => file.endsWith('.entity.ts')).sort()) {
    for (const [name, value] of Object.entries(load(`src/entities/${file}`))) {
        if (name.endsWith('Entity') && typeof value === 'function') E[name] = value;
    }
}
assert.equal(Object.keys(E).length, 19, 'Entity inventory changed; review test schema and coverage before continuing');
const {ExerciseExampleI18nService} = load('src/i18n/exercise-example-i18n.service.ts');
const types = {
    UsersService: load('src/modules/users/users.service.ts').UsersService,
    WeightHistoryService: load('src/modules/weight-history/weight-history.service.ts').WeightHistoryService,
    TrainingsService: load('src/modules/trainings/trainings.service.ts').TrainingsService,
    ExerciseExampleService: load('src/modules/exercise-examples/exercise-example.service.ts').ExerciseExampleService,
};
const tokenEntities = {
    USERS_REPOSITORY: 'UsersEntity', USER_PROFILES_REPOSITORY: 'UserProfilesEntity',
    WEIGHT_HISTORY_REPOSITORY: 'WeightHistoryEntity', EXCLUDED_MUSCLES_REPOSITORY: 'ExcludedMusclesEntity',
    MUSCLES_REPOSITORY: 'MusclesEntity', EQUIPMENTS_REPOSITORY: 'EquipmentsEntity',
    EXCLUDED_EQUIPMENTS_REPOSITORY: 'ExcludedEquipmentsEntity', GOALS_REPOSITORY: 'GoalsEntity',
    TRAININGS_REPOSITORY: 'TrainingsEntity', EXERCISES_REPOSITORY: 'ExercisesEntity',
    ITERATIONS_REPOSITORY: 'IterationsEntity', EXERCISE_EXAMPLES_REPOSITORY: 'ExerciseExamplesEntity',
    EXERCISE_EXAMPLE_BUNDLES_REPOSITORY: 'ExerciseExampleBundlesEntity',
    EXERCISE_EXAMPLES_EQUIPMENTS_REPOSITORY: 'ExerciseExamplesEquipmentsEntity',
};

function pgConfig(config, database, applicationName) {
    return {
        host: config.host, port: config.port, user: config.username,
        password: config.password, database, ssl: false,
        connectionTimeoutMillis: 3000, application_name: applicationName,
        options: '-c lock_timeout=6000 -c statement_timeout=15000 -c idle_in_transaction_session_timeout=20000',
    };
}

async function verifyServer(client, config, database) {
    const result = await client.query("SELECT current_setting('data_directory') AS data_directory, current_setting('server_version_num') AS version, current_user AS role, host(inet_server_addr()) AS address, current_database() AS database");
    const metadata = result.rows[0];
    assert.equal(fs.realpathSync(metadata.data_directory), config.dataDirectory, 'Connected server must own the generated data directory');
    assert.equal(Number(metadata.version), config.serverVersionNum, 'Connected server version must match the new test instance');
    assert.equal(metadata.role, config.username, 'Connected role must belong to this test run');
    assert.equal(metadata.address, '127.0.0.1', 'Only the generated loopback instance is allowed');
    assert.equal(metadata.database, database, 'Unexpected database connection');
}

async function openSuite(label, runtimeDescriptor) {
    assert(['identity', 'catalog'].includes(label), 'Unknown PostgreSQL suite');
    assertSafeImports();
    const config = await assertOwnedRuntime(runtimeDescriptor);
    const database = `grippo_test_${label}_${crypto.randomBytes(6).toString('hex')}`;
    assert(/^grippo_test_(identity|catalog)_[a-f0-9]{12}$/.test(database));
    const admin = new Client(pgConfig(config, 'postgres', 'grippo_test_admin'));
    // Connection errors must be handled without printing libpq config or queries.
    admin.on('error', () => {});
    let created = false;
    let ds;
    let disposed = false;
    async function dispose() {
        if (disposed) return;
        disposed = true;
        const failures = [];
        try {
            if (ds?.isInitialized) await ds.destroy();
        } catch (error) { failures.push(error); }
        try {
            if (created) {
                await assertOwnedRuntime(runtimeDescriptor);
                await verifyServer(admin, config, 'postgres');
                await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
                created = false;
            }
        } catch (error) { failures.push(error); }
        try { await admin.end(); }
        catch (error) { failures.push(error); }
        if (failures.length) throw new AggregateError(failures, 'PostgreSQL suite cleanup failed');
    }
    try {
        await admin.connect();
        await verifyServer(admin, config, 'postgres');
        await assertOwnedRuntime(runtimeDescriptor);
        await admin.query(`CREATE DATABASE "${database}" WITH TEMPLATE template0 ENCODING 'UTF8'`);
        created = true;
        ds = new DataSource({
            type: 'postgres', host: config.host, port: config.port,
            username: config.username, password: config.password, database,
            ssl: false, entities: Object.values(E), namingStrategy: new SnakeNamingStrategy(),
            synchronize: false, migrationsRun: false, logging: false,
            installExtensions: false, uuidExtension: 'pgcrypto',
            connectTimeoutMS: 3000,
            extra: {
                max: 20, application_name: `grippo_suite_${label}`,
                options: '-c lock_timeout=6000 -c statement_timeout=15000 -c idle_in_transaction_session_timeout=20000',
            },
        });
        await ds.initialize();
        await verifyServer({query: async sql => ({rows: await ds.query(sql)})}, config, database);
        await assertOwnedRuntime(runtimeDescriptor);
        await ds.synchronize();
        const [{count}] = await ds.query("SELECT count(*)::integer AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
        assert.equal(count, 19, 'Fresh database must contain all 19 current entity tables');
        const schema = await ds.driver.createSchemaBuilder().log();
        assert.equal(schema.upQueries.length, 0, 'Synchronized schema must match current entity metadata');
        assertSafeImports();
        const i18n = new ExerciseExampleI18nService();
        function service(type, manager = ds.manager) {
            const Type = typeof type === 'string' ? types[type] : type;
            assert(Object.values(types).includes(Type), 'Unknown service dependency');
            const parameters = Reflect.getMetadata('design:paramtypes', Type) ?? [];
            const injections = new Map((Reflect.getMetadata('self:paramtypes', Type) ?? []).map(item => [item.index, item.param]));
            const args = parameters.map((Parameter, index) => {
                const token = injections.get(index);
                if (token) {
                    assert(tokenEntities[token], 'Repository DI changed; update the integration fixture deliberately');
                    return manager.getRepository(E[tokenEntities[token]]);
                }
                assert.equal(Parameter, ExerciseExampleI18nService, 'External integration dependencies are forbidden');
                return i18n;
            });
            return new Type(...args);
        }
        const services = Object.fromEntries(Object.keys(types).map(name => [name, service(name)]));
        services.i18n = i18n;
        return {ds, E, entities: E, services, service, load, dispose};
    } catch (error) {
        try { await dispose(); }
        catch (cleanupError) { throw new AggregateError([error, cleanupError], 'PostgreSQL initialization and cleanup failed'); }
        throw error;
    }
}

module.exports = {openSuite, assertSafeImports};
