'use strict';

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { setTimeout: pause } = require('node:timers/promises');

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
async function deadline(promise, label, ms = 10000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: timeout`)), ms); }),
    ]);
  } finally { clearTimeout(timer); }
}
const settle = promise => Promise.resolve(promise).then(
  value => ({ status: 'fulfilled', value }),
  reason => ({ status: 'rejected', reason }),
);
const sqlCode = error => error?.driverError?.code ?? error?.code;
function httpFailure(outcome, status) {
  assert.equal(outcome.status, 'rejected');
  assert.equal(outcome.reason?.getStatus?.(), status);
}

async function runIdentity({ ds, entities: E, services, signal }) {
  const results = [];
  let assertionCount = 0;
  const ok = (condition, message = 'boolean assertion') => {
    assertionCount++;
    try { assert.ok(condition, message); }
    catch (error) { error.verificationLabel = message; throw error; }
  };
  const equal = (actual, expected, message = 'equality assertion') => {
    assertionCount++;
    try { assert.deepEqual(actual, expected, message); }
    catch (error) { error.verificationLabel = message; throw error; }
  };
  const repo = entity => ds.getRepository(entity);
  const users = services.UsersService;
  const weights = services.WeightHistoryService;

  // No fixture rows, credentials, or error query parameters are emitted.
  async function test(name, fn) {
    const before = assertionCount;
    const start = Date.now();
    try {
      signal?.throwIfAborted();
      const evidence = await deadline(fn(), name, 25000);
      signal?.throwIfAborted();
      results.push({ id: name.split(' ')[0], name, status: 'PASS', assertions: assertionCount - before, durationMs: Date.now() - start, evidence });
    } catch (error) {
      results.push({ id: name.split(' ')[0], name, status: 'FAIL', assertions: assertionCount - before, durationMs: Date.now() - start,
        failure: { kind: error.name, code: sqlCode(error) ?? null, assertion: error.code === 'ERR_ASSERTION' ? (error.verificationLabel ?? 'assertion failed') : null } });
      throw Object.assign(new Error(`Identity scenario failed: ${name}`), { results });
    }
  }
  async function newUser() {
    return repo(E.UsersEntity).save({ email: `identity-${randomUUID()}@fixture.invalid` });
  }
  const profileDto = extra => ({ name: 'Synthetic integration profile', height: 175, experience: 'beginner', weight: 80, ...extra });
  async function withProfile(extra) {
    const user = await newUser();
    const response = await users.createProfile(user.id, profileDto(extra));
    return { user, profile: await repo(E.UserProfilesEntity).findOneByOrFail({ id: response.profile.id }) };
  }
  async function scalarCount(sql, params = []) { return Number((await ds.query(sql, params))[0].count); }
  async function expectSqlCode(fn, code) {
    const result = await settle(fn());
    equal(result.status, 'rejected');
    equal(sqlCode(result.reason), code);
  }

  // Only real transaction managers and real SQL are used. The first transaction
  // is paused immediately AFTER PostgreSQL grants its row lock. The second is
  // observed waiting on the exact first backend before either is released.
  async function serialRace(table, firstAction, secondAction) {
    const firstLocked = deferred();
    const releaseFirst = deferred();
    const secondEntered = deferred();
    const originalTransaction = ds.manager.transaction;
    let calls = 0;
    let firstPid;
    let secondPid;
    let first;
    let second;
    const lockRegex = new RegExp(`FROM "${table}"[\\s\\S]*FOR UPDATE`);
    ds.manager.transaction = function (...args) {
      const cbIndex = args.length - 1;
      const callback = args[cbIndex];
      const call = ++calls;
      args[cbIndex] = async manager => {
        const runner = manager.queryRunner;
        const rawQuery = runner.query.bind(runner);
        const pid = Number((await rawQuery('SELECT pg_backend_pid() AS pid'))[0].pid);
        if (call === 1) firstPid = pid;
        if (call === 2) { secondPid = pid; secondEntered.resolve(); }
        let held = false;
        runner.query = async (...queryArgs) => {
          const result = await rawQuery(...queryArgs);
          if (call === 1 && !held && lockRegex.test(queryArgs[0])) {
            held = true;
            firstLocked.resolve();
            await deadline(releaseFirst.promise, 'release row-lock holder', 10000);
          }
          return result;
        };
        try { return await callback(manager); }
        finally { runner.query = rawQuery; }
      };
      return originalTransaction.apply(this, args);
    };
    try {
      first = settle(firstAction());
      await deadline(firstLocked.promise, `first ${table} lock`);
      second = settle(secondAction());
      await deadline(secondEntered.promise, 'second transaction entered');
      const until = Date.now() + 7000;
      let observed = false;
      while (Date.now() < until) {
        signal?.throwIfAborted();
        const rows = await ds.query(
          `SELECT wait_event_type, $2::integer = ANY(pg_blocking_pids(pid)) AS blocked_by_first
             FROM pg_stat_activity WHERE pid = $1::integer AND datname = current_database()`,
          [secondPid, firstPid],
        );
        if (rows[0]?.wait_event_type === 'Lock' && rows[0]?.blocked_by_first === true) { observed = true; break; }
        await pause(15);
      }
      ok(observed, 'PostgreSQL must report second backend blocked by first row-lock holder');
      releaseFirst.resolve();
      const outcomes = await deadline(Promise.all([first, second]), 'concurrent outcomes');
      equal(calls, 2, 'Both service operations must use real transactions');
      return { outcomes, proof: 'pg_stat_activity wait_event_type=Lock; pg_blocking_pids(waiter) contains holder' };
    } finally {
      releaseFirst.resolve();
      ds.manager.transaction = originalTransaction;
      await deadline(Promise.all([first, second].filter(Boolean)), 'transaction cleanup');
    }
  }

  // Trigger raises a real SQL exception after prior statements in the service
  // transaction have executed. The trigger/function exist only in this DB.
  async function withFailureTrigger(table, operation, action) {
    assert.match(table, /^[a-z_]+$/);
    assert.ok(['INSERT', 'UPDATE'].includes(operation));
    const functionName = `grippo_fixture_fail_${table}`;
    await ds.query(`CREATE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'synthetic late write failure'; END; $$`);
    try {
      await ds.query(`CREATE TRIGGER grippo_fixture_fail BEFORE ${operation} ON "${table}" FOR EACH ROW EXECUTE FUNCTION ${functionName}()`);
      return await action();
    } finally {
      await ds.query(`DROP TRIGGER IF EXISTS grippo_fixture_fail ON "${table}"`);
      await ds.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
    }
  }

  const muscles = [];
  const equipments = [];
  for (let i = 0; i < 4; i++) {
    muscles.push(await repo(E.MusclesEntity).save({ name: `Synthetic muscle ${i}` }));
    equipments.push(await repo(E.EquipmentsEntity).save({ name: `Synthetic equipment ${i}` }));
  }

  await test('I00 real goal enum-array SQL default is valid and produces empty array', async () => {
    const { profile } = await withProfile();
    const defaults = await ds.query(`SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'personalizations'`);
    equal(defaults.length, 1);
    ok(typeof defaults[0].column_default === 'string');
    ok(!/=>|function|return/i.test(defaults[0].column_default), 'SQL column default must not contain JavaScript function text');
    const inserted = await ds.query('INSERT INTO goals (profile_id, primary_goal) VALUES ($1, $2) RETURNING cardinality(personalizations) AS array_length, personalizations IS NOT NULL AS array_present', [profile.id, 'maintain']);
    equal(inserted.length, 1);
    equal(inserted[0].array_length, 0);
    equal(inserted[0].array_present, true);
    equal((await repo(E.GoalsEntity).findOneByOrFail({ profileId: profile.id })).personalizations, []);
    return { freshSchemaAcceptedDefault: true, javascriptFunctionAbsentFromSqlDefault: true, omittedArrayMaterializedEmpty: true };
  });

  await test('I01 concurrent createProfile: one success, one 400, one profile/weight', async () => {
    const user = await newUser();
    const { outcomes, proof } = await serialRace('users',
      () => users.createProfile(user.id, profileDto()), () => users.createProfile(user.id, profileDto()));
    equal(outcomes[0].status, 'fulfilled');
    httpFailure(outcomes[1], 400); assertionCount += 2;
    equal(await scalarCount('SELECT count(*) FROM user_profiles WHERE user_id = $1', [user.id]), 1);
    equal(await scalarCount('SELECT count(*) FROM weight_history w JOIN user_profiles p ON w.profile_id = p.id WHERE p.user_id = $1', [user.id]), 1);
    return { lock: proof, fulfilled: 1, rejected400: 1, profiles: 1, initialWeights: 1 };
  });

  await test('I02 concurrent first goals: serialized full replacement and preserved creation time', async () => {
    const { user, profile } = await withProfile();
    const { outcomes, proof } = await serialRace('user_profiles',
      () => users.setGoal(user.id, { primaryGoal: 'build_muscle', secondaryGoal: 'consistency', target: '2030-01-01', personalizations: ['low_frequency'] }),
      () => users.setGoal(user.id, { primaryGoal: 'maintain' }));
    equal(outcomes.map(o => o.status), ['fulfilled', 'fulfilled']);
    const goal = await repo(E.GoalsEntity).findOneByOrFail({ profileId: profile.id });
    equal(await repo(E.GoalsEntity).countBy({ profileId: profile.id }), 1);
    equal(goal.primaryGoal, 'maintain');
    equal([goal.secondaryGoal, goal.target, goal.personalizations, goal.confidence, goal.lastConfirmedAt], [null, null, [], 1, null]);
    equal(outcomes[0].value.createdAt, outcomes[1].value.createdAt);
    equal(goal.createdAt, outcomes[0].value.createdAt);
    return { lock: proof, fulfilled: 2, goalRows: 1, replacementDefaults: true, creationTimePreserved: true };
  });

  await test('I03 concurrent deletion of final two weights leaves one', async () => {
    const { user, profile } = await withProfile();
    await weights.setWeightHistory(user, 81);
    const entries = await repo(E.WeightHistoryEntity).findBy({ profile: { id: profile.id } });
    equal(entries.length, 2);
    const { outcomes, proof } = await serialRace('user_profiles',
      () => weights.removeWeight(user, entries[0].id), () => weights.removeWeight(user, entries[1].id));
    equal(outcomes[0].status, 'fulfilled');
    equal(outcomes[0].value.affected, 1);
    httpFailure(outcomes[1], 400); assertionCount += 2;
    equal(await repo(E.WeightHistoryEntity).countBy({ profile: { id: profile.id } }), 1);
    ok(await repo(E.WeightHistoryEntity).existsBy({ id: entries[1].id }));
    return { lock: proof, deleted: 1, rejected400: 1, remainingWeights: 1 };
  });

  for (const kind of ['muscles', 'equipments']) {
    const muscle = kind === 'muscles';
    const refs = muscle ? muscles : equipments;
    const Entity = muscle ? E.ExcludedMusclesEntity : E.ExcludedEquipmentsEntity;
    const refKey = muscle ? 'muscleId' : 'equipmentId';
    const method = muscle ? 'updateExcludedMuscles' : 'updateExcludedEquipments';
    const table = muscle ? 'excluded_muscles' : 'excluded_equipments';
    await test(`I04-${kind} concurrent replacements produce only complete second list`, async () => {
      const { user, profile } = await withProfile();
      await users[method](user, [refs[3].id]);
      const { outcomes, proof } = await serialRace('user_profiles',
        () => users[method](user, [refs[0].id, refs[1].id]), () => users[method](user, [refs[2].id]));
      equal(outcomes.map(o => o.status), ['fulfilled', 'fulfilled']);
      const rows = await repo(Entity).findBy({ profileId: profile.id });
      equal(rows.map(row => row[refKey]).sort(), [refs[2].id]);
      return { lock: proof, fulfilled: 2, finalListRows: 1, mixedList: false };
    });
    await test(`I05-${kind} late child INSERT failure rolls back deletion and preserves rows exactly`, async () => {
      const { user, profile } = await withProfile();
      await users[method](user, [refs[0].id, refs[1].id]);
      const snapshot = () => ds.query(`SELECT * FROM "${table}" WHERE profile_id = $1 ORDER BY id`, [profile.id]);
      const before = await snapshot();
      await withFailureTrigger(table, 'INSERT', () => expectSqlCode(() => users[method](user, [refs[2].id]), 'P0001'));
      equal(await snapshot(), before);
      equal(before.length, 2);
      return { injectedSqlState: 'P0001', originalRows: 2, idsAndTimestampsPreserved: true };
    });
  }

  await test('I06 late equipment failure restores profile, weight and muscle exclusions together', async () => {
    const user = await newUser();
    const tables = ['user_profiles', 'weight_history', 'excluded_muscles', 'excluded_equipments'];
    const counts = async () => Promise.all(tables.map(table => scalarCount(`SELECT count(*) FROM "${table}"`)));
    const before = await counts();
    await withFailureTrigger('excluded_equipments', 'INSERT', () => expectSqlCode(() => users.createProfile(user.id,
      profileDto({ excludeMuscleIds: [muscles[0].id], excludeEquipmentIds: [equipments[0].id] })), 'P0001'));
    equal(await counts(), before);
    equal(await scalarCount('SELECT count(*) FROM user_profiles WHERE user_id = $1', [user.id]), 0);
    ok(await repo(E.UsersEntity).existsBy({ id: user.id }));
    return { injectedSqlState: 'P0001', profileAndChildrenFullyRolledBack: true, identityPreserved: true };
  });

  await test('I07 failed existing goal update preserves complete previous goal', async () => {
    const { user, profile } = await withProfile();
    await users.setGoal(user.id, { primaryGoal: 'lose_fat', secondaryGoal: 'consistency', target: '2030-02-01', personalizations: ['low_frequency'] });
    await repo(E.GoalsEntity).update({ profileId: profile.id }, { confidence: 0.7, lastConfirmedAt: new Date('2025-01-02T12:00:00Z') });
    const snapshot = () => ds.query('SELECT * FROM goals WHERE profile_id = $1', [profile.id]);
    const before = await snapshot();
    await withFailureTrigger('goals', 'UPDATE', () => expectSqlCode(() => users.setGoal(user.id, { primaryGoal: 'maintain' }), 'P0001'));
    equal(await snapshot(), before);
    const success = await users.setGoal(user.id, { primaryGoal: 'maintain' });
    equal(success.lastConfirmedAt, before[0].last_confirmed_at);
    equal(success.createdAt, before[0].created_at);
    equal([success.confidence, success.secondaryGoal, success.target, success.personalizations], [1, null, null, []]);
    return { injectedSqlState: 'P0001', priorGoalRestoredExactly: true, successfulReplacementPreservesCreationAndConfirmation: true };
  });

  await test('I08 orphan non-null references rejected by real foreign keys', async () => {
    const { user, profile } = await withProfile();
    const missing = randomUUID();
    const cases = [
      () => repo(E.UserProfilesEntity).insert({ user: { id: missing }, name: 'Synthetic orphan', height: 175, experience: 'beginner' }),
      () => repo(E.WeightHistoryEntity).insert({ profile: { id: missing }, weight: 80 }),
      () => repo(E.GoalsEntity).insert({ profileId: missing, primaryGoal: 'maintain' }),
      () => repo(E.ExcludedMusclesEntity).insert({ profileId: profile.id, muscleId: missing }),
      () => repo(E.ExcludedMusclesEntity).insert({ profileId: missing, muscleId: muscles[0].id }),
      () => repo(E.ExcludedEquipmentsEntity).insert({ profileId: profile.id, equipmentId: missing }),
      () => repo(E.ExcludedEquipmentsEntity).insert({ profileId: missing, equipmentId: equipments[0].id }),
      () => repo(E.TrainingsEntity).insert({ profileId: missing }),
    ];
    for (const operation of cases) await expectSqlCode(operation, '23503');
    ok(await repo(E.UsersEntity).existsBy({ id: user.id }));
    return { sqlState: '23503', rejectedOrphanRelations: cases.length, nullableRelationsRemainOutsideClaim: true };
  });

  await test('I09 real weight CHECK and one-to-one/email uniqueness enforced', async () => {
    const { user, profile } = await withProfile();
    await expectSqlCode(() => repo(E.WeightHistoryEntity).insert({ profile: { id: profile.id }, weight: 29 }), '23514');
    await expectSqlCode(() => repo(E.WeightHistoryEntity).insert({ profile: { id: profile.id }, weight: 301 }), '23514');
    await expectSqlCode(() => repo(E.UsersEntity).insert({ email: user.email }), '23505');
    await expectSqlCode(() => repo(E.UserProfilesEntity).insert({ user: { id: user.id }, name: 'Synthetic duplicate', height: 175, experience: 'beginner' }), '23505');
    await repo(E.GoalsEntity).insert({ profileId: profile.id, primaryGoal: 'maintain' });
    await expectSqlCode(() => repo(E.GoalsEntity).insert({ profileId: profile.id, primaryGoal: 'build_muscle' }), '23505');
    equal(await repo(E.WeightHistoryEntity).countBy({ profile: { id: profile.id } }), 1);
    equal(await repo(E.GoalsEntity).countBy({ profileId: profile.id }), 1);
    return { rejectedCheckViolations: 2, rejectedUniqueViolations: 3, sqlStates: ['23514', '23505'] };
  });

  await test('I10 profile delete cascades children and preserves identity/dictionaries', async () => {
    const { user, profile } = await withProfile({ excludeMuscleIds: [muscles[0].id], excludeEquipmentIds: [equipments[0].id] });
    await users.setGoal(user.id, { primaryGoal: 'maintain' });
    await repo(E.TrainingsEntity).save({ profileId: profile.id });
    const children = ['weight_history', 'goals', 'excluded_muscles', 'excluded_equipments', 'trainings'];
    for (const table of children) equal(await scalarCount(`SELECT count(*) FROM "${table}" WHERE profile_id = $1`, [profile.id]), 1);
    await repo(E.UserProfilesEntity).delete({ id: profile.id });
    for (const table of children) equal(await scalarCount(`SELECT count(*) FROM "${table}" WHERE profile_id = $1`, [profile.id]), 0);
    ok(await repo(E.UsersEntity).existsBy({ id: user.id }));
    ok(await repo(E.MusclesEntity).existsBy({ id: muscles[0].id }));
    ok(await repo(E.EquipmentsEntity).existsBy({ id: equipments[0].id }));
    return { cascadedChildTables: children.length, identityPreserved: true, dictionariesPreserved: true };
  });

  await test('I11 actual UsersService.deleteUser cascades profile and children', async () => {
    const { user, profile } = await withProfile({ excludeMuscleIds: [muscles[0].id], excludeEquipmentIds: [equipments[0].id] });
    await users.setGoal(user.id, { primaryGoal: 'maintain' });
    await repo(E.TrainingsEntity).save({ profileId: profile.id });
    const children = ['weight_history', 'goals', 'excluded_muscles', 'excluded_equipments', 'trainings'];
    for (const table of children) equal(await scalarCount(`SELECT count(*) FROM "${table}" WHERE profile_id = $1`, [profile.id]), 1);
    await users.deleteUser(user.id);
    equal(await repo(E.UsersEntity).countBy({ id: user.id }), 0);
    equal(await repo(E.UserProfilesEntity).countBy({ id: profile.id }), 0);
    for (const table of children) equal(await scalarCount(`SELECT count(*) FROM "${table}" WHERE profile_id = $1`, [profile.id]), 0);
    return { deletedUserAndProfile: true, cascadedChildTables: children.length };
  });

  for (const kind of ['muscles', 'equipments']) {
    const muscle = kind === 'muscles';
    const refs = muscle ? muscles : equipments;
    const Entity = muscle ? E.ExcludedMusclesEntity : E.ExcludedEquipmentsEntity;
    const refKey = muscle ? 'muscleId' : 'equipmentId';
    const dtoKey = muscle ? 'excludeMuscleIds' : 'excludeEquipmentIds';
    const method = muscle ? 'updateExcludedMuscles' : 'updateExcludedEquipments';
    await test(`I12-${kind} create and replace exclusions normalize case and collapse duplicates`, async () => {
      const { user, profile } = await withProfile({
        [dtoKey]: [refs[1].id.toUpperCase(), refs[0].id, refs[1].id, refs[0].id.toUpperCase()],
      });
      const other = await withProfile({ [dtoKey]: [refs[3].id] });
      const storedIds = async profileId => (await repo(Entity).findBy({ profileId }))
        .map(row => row[refKey]).sort();
      equal(await storedIds(profile.id), [refs[0].id, refs[1].id].sort());
      equal(await users[method](user, [refs[2].id.toUpperCase(), refs[2].id, refs[1].id, refs[1].id.toUpperCase()]),
        { ids: [refs[2].id, refs[1].id] });
      equal(await storedIds(profile.id), [refs[1].id, refs[2].id].sort());
      equal(await storedIds(other.profile.id), [refs[3].id]);

      const before = await repo(Entity).find({ where: { profileId: profile.id }, order: { id: 'ASC' } });
      const invalid = await settle(users[method](user, [refs[0].id, randomUUID()]));
      httpFailure(invalid, 404); assertionCount += 2;
      equal(await repo(Entity).find({ where: { profileId: profile.id }, order: { id: 'ASC' } }), before);
      equal(await users[method](user, [refs[0].id, refs[0].id.toUpperCase()]), { ids: [refs[0].id] });
      equal(await storedIds(profile.id), [refs[0].id]);
      equal(await users[method](user, []), { ids: [] });
      equal(await storedIds(profile.id), []);
      equal(await storedIds(other.profile.id), [refs[3].id]);
      return { createAndReplaceUseSetSemantics: true, lowerCaseResponseIds: true, invalidReferencesPreserveRows: true,
        emptyListClears: true, otherProfilePreserved: true };
    });
  }

  await test('I13 profile height DTOs enforce the same positive PostgreSQL integer bounds', async () => {
    const { ValidationPipe } = require('@nestjs/common');
    const { CreateUserProfileRequest } = require('../../src/modules/users/dto/create-user-profile.request.ts');
    const { UpdateHeightRequest } = require('../../src/modules/users/dto/update-height.request.ts');
    const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
    const valid = [1, 175, 2147483647];
    const invalid = [undefined, null, '175', 175.5, -1, 0, 2147483648, NaN, Infinity];
    for (const Dto of [CreateUserProfileRequest, UpdateHeightRequest]) {
      const body = height => Dto === CreateUserProfileRequest ? profileDto({ height }) : { height };
      for (const height of valid) {
        const transformed = await pipe.transform(body(height), { type: 'body', metatype: Dto });
        equal(transformed.height, height);
      }
      for (const height of invalid) {
        const outcome = await settle(pipe.transform(body(height), { type: 'body', metatype: Dto }));
        httpFailure(outcome, 400); assertionCount += 2;
      }
    }
    const user = await newUser();
    const created = await users.createProfile(user.id, profileDto({ height: valid[2] }));
    equal(created.profile.height, valid[2]);
    const updated = await users.updateHeight(user.id, valid[0]);
    equal(updated.profile.height, valid[0]);
    return { acceptedBoundaryBodies: valid.length * 2, rejectedBodies: invalid.length * 2,
      createAndUpdatePostgresBoundaries: true };
  });
  assert.equal(results.length, 17, 'Identity scenario inventory changed; review the documented coverage');
  return results;
}

module.exports = { runIdentity, expectedCases: 17 };
