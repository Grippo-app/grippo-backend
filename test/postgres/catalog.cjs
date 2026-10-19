'use strict';

// Disposable integration fixture. Never imports AppModule, ConfigModule or env files.
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {EntityManager} = require('typeorm');
const {ValidationPipe} = require('@nestjs/common');

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return {promise, resolve};
}

async function bounded(promise, label, milliseconds = 12000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), milliseconds); }),
    ]);
  } finally { clearTimeout(timer); }
}

function outcome(promise) {
  return promise.then(value => ({ok: true, value}), error => ({ok: false, error}));
}

function status(error) { return typeof error?.getStatus === 'function' ? error.getStatus() : undefined; }
function code(error) { return error?.driverError?.code || error?.code; }

async function runCatalog(ctx) {
  const {ds, E, signal} = ctx;
  const {ExerciseExampleService} = ctx.load('src/modules/exercise-examples/exercise-example.service.ts');
  const {TrainingsService} = ctx.load('src/modules/trainings/trainings.service.ts');
  const {TrainingsRequest} = ctx.load('src/modules/trainings/dto/trainings.request.ts');
  const results = [];

  function operation(kind, hooks = {}) {
    // Separate managers isolate fixture hooks. Every call still delegates to an
    // actual EntityManager and actual PostgreSQL transaction/commit/rollback.
    const manager = new EntityManager(ds);
    const started = deferred();
    const originalTransaction = manager.transaction.bind(manager);
    manager.transaction = (...args) => {
      const callback = args.pop();
      return originalTransaction(...args, async tm => {
        const [{pid}] = await tm.query('SELECT pg_backend_pid() AS pid');
        started.resolve(pid);
        for (const [method, hook] of Object.entries(hooks)) {
          const actual = tm[method].bind(tm);
          tm[method] = async (...methodArgs) => {
            const value = await actual(...methodArgs);
            await hook({args: methodArgs, value, tm, pid});
            return value;
          };
        }
        return callback(tm);
      });
    };
    // Resolve the current repository-token metadata rather than freezing the
    // constructor argument order in this fixture.
    const service = ctx.service(kind === 'catalog' ? ExerciseExampleService : TrainingsService, manager);
    return {service, started: started.promise};
  }

  function gate() {
    const reached = deferred();
    const released = deferred();
    let used = false;
    return {
      reached: reached.promise,
      release: released.resolve,
      async hold(context) {
        if (used) return;
        used = true;
        reached.resolve(context.pid);
        await bounded(released.promise, 'fixture barrier was not released', 10000);
      },
    };
  }

  async function blockedBy(waiterPid, blockerPid) {
    const deadline = Date.now() + 4500;
    while (Date.now() < deadline) {
      signal?.throwIfAborted();
      const [{blocked}] = await ds.query(
        'SELECT $1::integer = ANY(pg_blocking_pids($2::integer)) AS blocked',
        [blockerPid, waiterPid]);
      if (blocked) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error('PostgreSQL did not report the expected blocking PID');
  }

  async function runCase(name, callback) {
    const start = Date.now();
    const id = `C${String(results.length + 1).padStart(2, '0')}`;
    try {
      signal?.throwIfAborted();
      await bounded(callback(), 'catalog scenario exceeded its deadline', 25000);
      signal?.throwIfAborted();
      results.push({id, name, status: 'PASS', durationMs: Date.now() - start});
    } catch (error) {
      // Never emit QueryFailedError messages, SQL parameters, assertion diffs or rows.
      results.push({id, name, status: 'FAIL', durationMs: Date.now() - start,
        failure: {kind: error?.name || 'Error', code: code(error) || null,
          assertion: error instanceof assert.AssertionError ? 'assertion failed' : null}});
      throw Object.assign(new Error(`Catalog scenario failed: ${id}`), {results});
    }
  }

  async function seedDictionaries() {
    const muscle = await ds.manager.save(E.MusclesEntity, {id: randomUUID(), name: 'Synthetic muscle'});
    const equipment = await ds.manager.save(E.EquipmentsEntity, {id: randomUUID(), name: 'Synthetic equipment'});
    return {muscle, equipment};
  }

  async function seedUser() {
    const user = await ds.manager.save(E.UsersEntity, {id: randomUUID(), email: `${randomUUID()}@example.invalid`});
    const profile = await ds.manager.save(E.UserProfilesEntity, {
      id: randomUUID(), user, name: 'Synthetic profile', height: 175, experience: 'beginner',
    });
    assert(user.id !== profile.id, 'user/profile identities must remain distinct');
    return {user: {id: user.id}, profile};
  }

  function catalogBody(dictionary, overrides = {}) {
    return {
      name: [{language: 'en', value: 'Synthetic example'}, {language: 'ua', value: 'Synthetic UA'}],
      description: [{language: 'en', value: 'Synthetic description'}], imageUrl: 'synthetic://example',
      category: 'compound', weightType: 'body_weight', forceType: 'push', experience: 'beginner',
      exerciseExampleBundles: [{muscleId: dictionary.muscle.id, percentage: 100}],
      equipmentRefs: [{equipmentId: dictionary.equipment.id}],
      components: {externalWeight: null, bodyWeight: {required: true, multiplier: 0.75},
        extraWeight: {required: false}, assistWeight: null},
      ...overrides,
    };
  }

  function trainingBody(exampleId, overrides = {}) {
    const exercise = (suffix, weight, multiplier) => ({
      name: `Historical exercise ${suffix}`, volume: 123.4, repetitions: 17, intensity: 23.45,
      exerciseExampleId: exampleId, iterations: [
        {bodyWeight: weight, bodyMultiplier: multiplier, externalWeight: null, extraWeight: 0,
          assistWeight: null, repetitions: 8},
        {bodyWeight: weight + 1, bodyMultiplier: multiplier, externalWeight: null, extraWeight: null,
          assistWeight: null, repetitions: 9},
      ],
    });
    return {duration: 33, volume: 987.6, repetitions: 34, intensity: 65.43,
      exercises: [exercise('A', 80.5, 0.60), exercise('B', 81.5, 0.65)], ...overrides};
  }

  async function seedExample() {
    const dictionary = await seedDictionaries();
    const body = catalogBody(dictionary);
    const {id} = await operation('catalog').service.createExerciseExample(body);
    return {id, dictionary, body};
  }

  async function count(type, where) { return ds.getRepository(type).count({where}); }
  async function graphCounts() {
    return Promise.all([E.TrainingsEntity, E.ExercisesEntity, E.IterationsEntity]
      .map(type => ds.getRepository(type).count()));
  }
  async function catalogCounts() {
    return Promise.all([E.ExerciseExamplesEntity, E.ExerciseExampleBundlesEntity,
      E.ExerciseExamplesEquipmentsEntity, E.ExerciseExampleComponentsEntity, E.ExerciseExampleTranslationEntity]
      .map(type => ds.getRepository(type).count()));
  }
  function same(actual, expected, message) {
    assert(JSON.stringify(actual) === JSON.stringify(expected), message);
  }
  async function catalogSnapshot(id) {
    const snapshots = [];
    for (const [table, field] of [
      ['exercise_examples', 'id'], ['exercise_example_bundles', 'exercise_example_id'],
      ['exercise_examples_equipments', 'exercise_example_id'],
      ['exercise_example_components', 'exercise_example_id'], ['exercise_example_translations', 'exercise_example_id'],
    ]) {
      snapshots.push(await ds.query(`SELECT to_jsonb(t) AS row FROM "${table}" t WHERE "${field}" = $1 ORDER BY id`, [id]));
    }
    return snapshots;
  }
  async function trainingSnapshot(id) {
    return Promise.all([
      ds.query('SELECT to_jsonb(t) AS row FROM trainings t WHERE id = $1', [id]),
      ds.query('SELECT to_jsonb(e) AS row FROM exercises e WHERE training_id = $1 ORDER BY order_index, id', [id]),
      ds.query('SELECT to_jsonb(i) AS row FROM iterations i JOIN exercises e ON e.id=i.exercise_id WHERE e.training_id=$1 ORDER BY e.order_index, i.order_index, i.id', [id]),
    ]);
  }

  function validateTraining(body) {
    return new ValidationPipe({transform: true, whitelist: true, forbidNonWhitelisted: true})
      .transform(body, {type: 'body', metatype: TrainingsRequest});
  }

  for (const action of ['create', 'replace']) {
    await runCase(`training ${action} normalizes aggregate precision through ValidationPipe and persists supplied values`, async () => {
      const example = await seedExample();
      const identity = await seedUser();
      let trainingId;
      if (action === 'replace') {
        ({id: trainingId} = await operation('training').service.createTraining(trainingBody(example.id), identity.user));
      }
      const samples = [
        {input: [[987.654321, 108.888889], [-123.45678, -23.45678], [1e-7, -1e-7]],
          expected: [[987.7, 108.89], [-123.5, -23.46], [0, 0]]},
        // These ties have exact binary representations, including negative ties.
        {input: [[12.25, 1.125], [-12.25, -1.125], [12.24, 1.124]],
          expected: [[12.3, 1.13], [-12.3, -1.13], [12.2, 1.12]]},
        {input: [[999999999.9, 999.99], [-999999999.9, -999.99], [0, 0]],
          expected: [[999999999.9, 999.99], [-999999999.9, -999.99], [0, 0]]},
      ];
      for (const {input, expected} of samples) {
        const raw = trainingBody(example.id);
        [raw, ...raw.exercises].forEach((item, index) => {
          [item.volume, item.intensity] = input[index];
        });
        const body = await validateTraining(raw);
        [body, ...body.exercises].forEach((item, index) => {
          assert(item.volume === expected[index][0] && item.intensity === expected[index][1],
            'ValidationPipe must normalize the training and every exercise aggregate');
        });
        if (action === 'create') {
          ({id: trainingId} = await operation('training').service.createTraining(body, identity.user));
        } else {
          await operation('training').service.updateTraining(trainingId, body, identity.user);
        }
        const saved = await ds.getRepository(E.TrainingsEntity).findOneByOrFail({id: trainingId});
        const exercises = await ds.getRepository(E.ExercisesEntity).find({
          where: {trainingId}, order: {orderIndex: 'ASC'},
        });
        assert(saved.profileId === identity.profile.id && exercises.length === 2,
          'normalized training must retain its owner and complete exercise graph');
        [saved, ...exercises].forEach((item, index) => {
          assert(item.volume === expected[index][0] && item.intensity === expected[index][1],
            'PostgreSQL hydrated aggregates must equal supplied normalized values without recalculation');
        });
      }
    });
  }

  await runCase('training aggregate normalization preserves strict types, finite raw bounds and iteration precision', async () => {
    for (const nested of [false, true]) {
      for (const [field, maximum] of [['volume', 999999999.9], ['intensity', 999.99]]) {
        for (const invalid of [undefined, null, '12.345', true, [], {}, NaN, Infinity, -Infinity,
          maximum + 0.001, -maximum - 0.001]) {
          const body = trainingBody(undefined);
          (nested ? body.exercises[0] : body)[field] = invalid;
          const result = await outcome(validateTraining(body));
          assert(!result.ok && status(result.error) === 400,
            'invalid aggregate type, non-finite number or raw bound must be rejected before persistence');
          const errors = result.error.getResponse().message;
          assert(Array.isArray(errors) && errors.some(message => message.includes(field)),
            'aggregate rejection must identify the invalid field');
        }
      }
    }
    for (const [field, invalid] of [
      ['assistWeight', 1.125], ['externalWeight', 1.125], ['extraWeight', 1.125],
      ['bodyWeight', 1.125], ['bodyMultiplier', 1.125], ['repetitions', 1.125],
    ]) {
      const body = trainingBody(undefined);
      body.exercises[0].iterations[0][field] = invalid;
      const result = await outcome(validateTraining(body));
      assert(!result.ok && status(result.error) === 400,
        'aggregate normalization must not relax iteration numeric precision');
    }
  });

  await runCase('training create validation holds catalog key-share before exercise insert; delete waits then returns 409', async () => {
    const example = await seedExample();
    const identity = await seedUser();
    const hold = gate();
    let exerciseSaves = 0;
    const training = operation('training', {
      findOne: async context => {
        if (context.args[0] === E.ExerciseExamplesEntity && context.value) await hold.hold(context);
      },
      save: async context => { if (context.args[0] instanceof E.ExercisesEntity) exerciseSaves += 1; },
    });
    const deleting = operation('catalog');
    const promises = [];
    try {
      const created = outcome(training.service.createTraining(trainingBody(example.id), identity.user));
      promises.push(created);
      const trainingPid = await bounded(hold.reached, 'training insert barrier missing');
      assert(exerciseSaves === 0, 'training validation must lock example before any exercise FK write');
      const deleted = outcome(deleting.service.deleteExerciseExample(example.id));
      promises.push(deleted);
      const deletePid = await bounded(deleting.started, 'delete transaction did not start');
      await blockedBy(deletePid, trainingPid);
      hold.release();
      const [first, second] = await bounded(Promise.all([created, deleted]), 'training/delete did not finish');
      assert(first.ok, 'training must commit before delete usage check');
      assert(!second.ok && status(second.error) === 409, 'delete must see committed usage and return 409');
      assert(await count(E.ExerciseExamplesEntity, {id: example.id}) === 1, 'used example must survive');
      assert(await count(E.ExercisesEntity, {exerciseExampleId: example.id}) === 2, 'both committed exercises must retain references');
    } finally { hold.release(); await bounded(Promise.allSettled(promises), 'concurrency cleanup timed out'); }
  });

  await runCase('catalog delete holds update lock; training waits then returns 400 and rolls back', async () => {
    const example = await seedExample();
    const identity = await seedUser();
    const before = await graphCounts();
    const hold = gate();
    const deleting = operation('catalog', {findOne: async context => {
      if (context.args[0] === E.ExerciseExamplesEntity && context.value) await hold.hold(context);
    }});
    const training = operation('training');
    const promises = [];
    try {
      const deleted = outcome(deleting.service.deleteExerciseExample(example.id)); promises.push(deleted);
      const deletePid = await bounded(hold.reached, 'catalog delete lock barrier missing');
      const created = outcome(training.service.createTraining(trainingBody(example.id), identity.user)); promises.push(created);
      const trainingPid = await bounded(training.started, 'training transaction did not start');
      await blockedBy(trainingPid, deletePid);
      hold.release();
      const [first, second] = await bounded(Promise.all([deleted, created]), 'delete/training did not finish');
      assert(first.ok, 'unused catalog delete must commit');
      assert(!second.ok && status(second.error) === 400, 'waiting training must reject missing example with 400');
      same(await graphCounts(), before, 'failed training must leave no parent, exercise or iteration');
      assert(await count(E.ExerciseExamplesEntity, {id: example.id}) === 0, 'deleted catalog parent must be absent');
      assert(await count(E.ExerciseExampleComponentsEntity, {exerciseExampleId: example.id}) === 0, 'components must cascade');
    } finally { hold.release(); await bounded(Promise.allSettled(promises), 'concurrency cleanup timed out'); }
  });

  for (const firstAction of ['replace', 'delete']) {
    await runCase(`training replacement and catalog delete serialize ${firstAction}-first with correct commit or rollback`, async () => {
      const originalExample = await seedExample();
      const targetExample = await seedExample();
      const identity = await seedUser();
      const {id: trainingId} = await operation('training').service.createTraining(trainingBody(originalExample.id), identity.user);
      await ds.getRepository(E.TrainingsEntity).update({id: trainingId}, {createdAt: new Date('2002-03-04T05:06:07Z')});
      const before = await trainingSnapshot(trainingId);
      const countsBefore = await graphCounts();
      const replacement = trainingBody(targetExample.id, {duration: 66, volume: 321.0});
      const hold = gate();
      let exerciseSaves = 0;
      const replacing = operation('training', firstAction === 'replace' ? {
        findOne: async context => {
          if (context.args[0] === E.ExerciseExamplesEntity && context.value) await hold.hold(context);
        },
        save: async context => { if (context.args[0] instanceof E.ExercisesEntity) exerciseSaves += 1; },
      } : {});
      const deleting = operation('catalog', firstAction === 'delete' ? {findOne: async context => {
        if (context.args[0] === E.ExerciseExamplesEntity && context.value) await hold.hold(context);
      }} : {});
      const promises = [];
      try {
        let replaced;
        let deleted;
        if (firstAction === 'replace') {
          replaced = outcome(replacing.service.updateTraining(trainingId, replacement, identity.user)); promises.push(replaced);
          const replacementPid = await bounded(hold.reached, 'replacement catalog validation barrier missing');
          assert(exerciseSaves === 0, 'replacement validation must lock example before any new exercise FK write');
          deleted = outcome(deleting.service.deleteExerciseExample(targetExample.id)); promises.push(deleted);
          const deletionPid = await bounded(deleting.started, 'catalog deletion transaction did not start');
          await blockedBy(deletionPid, replacementPid);
        } else {
          deleted = outcome(deleting.service.deleteExerciseExample(targetExample.id)); promises.push(deleted);
          const deletionPid = await bounded(hold.reached, 'catalog deletion parent lock barrier missing');
          replaced = outcome(replacing.service.updateTraining(trainingId, replacement, identity.user)); promises.push(replaced);
          const replacementPid = await bounded(replacing.started, 'replacement transaction did not start');
          await blockedBy(replacementPid, deletionPid);
        }
        hold.release();
        const [a, b] = await bounded(Promise.all([replaced, deleted]), 'replacement/deletion did not finish');
        same(await graphCounts(), countsBefore, 'replacement race must leave no extra parent or child rows');
        if (firstAction === 'replace') {
          assert(a.ok && !b.ok && status(b.error) === 409, 'committed replacement must protect its referenced target with 409');
          const after = await trainingSnapshot(trainingId);
          assert(after[1].length === 2 && after[1].every(item => item.row.exercise_example_id === targetExample.id),
            'replacement must retain its newly committed example references');
          assert(after[1].every(item => before[1].every(old => old.row.id !== item.row.id)),
            'successful replacement must preserve existing fresh-child ID semantics');
          assert(await count(E.ExerciseExamplesEntity, {id: targetExample.id}) === 1, 'used replacement target must survive');
        } else {
          assert(!a.ok && status(a.error) === 400 && b.ok, 'deleted target must cause replacement 400');
          same(await trainingSnapshot(trainingId), before,
            'failed replacement must restore original graph IDs, order, timestamps and historical weights');
          assert(await count(E.ExerciseExamplesEntity, {id: targetExample.id}) === 0, 'unused target deletion must commit');
        }
      } finally { hold.release(); await bounded(Promise.allSettled(promises), 'replacement concurrency cleanup timed out'); }
    });
  }

  for (const firstAction of ['update', 'delete']) {
    await runCase(`catalog ${firstAction} serializes competing ${firstAction === 'update' ? 'delete' : 'update'} on parent`, async () => {
      const example = await seedExample();
      const hold = gate();
      const first = operation('catalog', {findOne: async context => {
        if (context.args[0] === E.ExerciseExamplesEntity && context.value) await hold.hold(context);
      }});
      const second = operation('catalog');
      const promises = [];
      try {
        const p1 = outcome(firstAction === 'update'
          ? first.service.updateExerciseExample(example.id, catalogBody(example.dictionary, {imageUrl: 'synthetic://updated'}))
          : first.service.deleteExerciseExample(example.id)); promises.push(p1);
        const firstPid = await bounded(hold.reached, 'first catalog operation barrier missing');
        const p2 = outcome(firstAction === 'update'
          ? second.service.deleteExerciseExample(example.id)
          : second.service.updateExerciseExample(example.id, example.body)); promises.push(p2);
        const secondPid = await bounded(second.started, 'second catalog operation did not start');
        await blockedBy(secondPid, firstPid);
        hold.release();
        const [a, b] = await bounded(Promise.all([p1, p2]), 'catalog writes did not finish');
        assert(a.ok, 'first catalog operation must commit');
        assert(firstAction === 'update' ? b.ok : !b.ok && status(b.error) === 404,
          'second operation must see the committed parent state');
        assert(await count(E.ExerciseExamplesEntity, {id: example.id}) === 0, 'deleted example must not be resurrected');
      } finally { hold.release(); await bounded(Promise.allSettled(promises), 'concurrency cleanup timed out'); }
    });
  }

  for (const target of ['muscle', 'equipment']) {
    await runCase(`catalog reference validation holds ${target} key-share until commit`, async () => {
      const dictionary = await seedDictionaries();
      const hold = gate();
      let catalogSaves = 0;
      const creation = operation('catalog', {
        find: async context => {
          if (context.args[0] === E.EquipmentsEntity) await hold.hold(context);
        },
        save: async () => { catalogSaves += 1; },
      });
      const runner = ds.createQueryRunner();
      const promises = [];
      try {
        const created = outcome(creation.service.createExerciseExample(catalogBody(dictionary))); promises.push(created);
        const creationPid = await bounded(hold.reached, 'catalog reference barrier missing');
        assert(catalogSaves === 0, 'dictionary lock must be acquired by validation before any FK child write');
        await runner.connect(); await runner.startTransaction();
        const [{pid: deletionPid}] = await runner.query('SELECT pg_backend_pid() AS pid');
        const deleted = outcome(runner.manager.delete(target === 'muscle' ? E.MusclesEntity : E.EquipmentsEntity,
          {id: dictionary[target].id})); promises.push(deleted);
        await blockedBy(deletionPid, creationPid);
        hold.release();
        const [a, b] = await bounded(Promise.all([created, deleted]), 'dictionary conflict did not finish');
        assert(a.ok && b.ok, 'catalog commit must precede successful dictionary deletion');
        await runner.commitTransaction();
        assert(await count(E.ExerciseExamplesEntity, {id: a.value.id}) === 1, 'dictionary delete must preserve catalog parent');
        assert(await count(target === 'muscle' ? E.ExerciseExampleBundlesEntity : E.ExerciseExamplesEquipmentsEntity,
          {exerciseExampleId: a.value.id}) === 0, 'dictionary delete must cascade only its references');
      } finally {
        hold.release(); await bounded(Promise.allSettled(promises), 'dictionary concurrency cleanup timed out');
        if (runner.isTransactionActive) await runner.rollbackTransaction();
        await runner.release();
      }
    });
  }

  await runCase('late catalog translation constraint failure restores complete previous graph', async () => {
    const example = await seedExample();
    const dictionary = await seedDictionaries();
    const before = await catalogSnapshot(example.id);
    const countsBefore = await catalogCounts();
    let reachedLateWrite = false;
    await ds.query("CREATE FUNCTION grippo_test_reject_translation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'isolated fixture rejection' USING ERRCODE = '23514'; END; $$");
    await ds.query("CREATE TRIGGER grippo_test_reject_translation BEFORE INSERT ON exercise_example_translations FOR EACH ROW WHEN (NEW.name = '__fixture_reject_catalog__') EXECUTE FUNCTION grippo_test_reject_translation()");
    try {
      const updating = operation('catalog', {save: async context => {
        if (context.args[0] === E.ExerciseExampleComponentsEntity) {
          reachedLateWrite = true;
          const current = await context.tm.findOne(E.ExerciseExamplesEntity, {where: {id: example.id}});
          assert(current.imageUrl === 'synthetic://replacement', 'parent change must precede late failure');
        }
      }});
      const result = await outcome(updating.service.updateExerciseExample(example.id, catalogBody(dictionary, {
        imageUrl: 'synthetic://replacement', name: [{language: 'en', value: '__fixture_reject_catalog__'}],
        components: {externalWeight: {required: true}, bodyWeight: null, extraWeight: null, assistWeight: null},
      })));
      assert(reachedLateWrite && !result.ok && code(result.error) === '23514', 'real late PostgreSQL constraint failure must occur');
      same(await catalogSnapshot(example.id), before, 'rollback must restore parent, old IDs, dictionary refs, components and translations');
      same(await catalogCounts(), countsBefore, 'rollback must leave no new catalog child rows');
    } finally {
      await ds.query('DROP TRIGGER IF EXISTS grippo_test_reject_translation ON exercise_example_translations');
      await ds.query('DROP FUNCTION IF EXISTS grippo_test_reject_translation()');
    }
  });

  await ds.query("CREATE FUNCTION grippo_test_reject_iteration() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'isolated fixture rejection' USING ERRCODE = '23514'; END; $$");
  await ds.query('CREATE TRIGGER grippo_test_reject_iteration BEFORE INSERT ON iterations FOR EACH ROW WHEN (NEW.repetitions = -777777) EXECUTE FUNCTION grippo_test_reject_iteration()');
  try {
    for (const mutation of ['create', 'replace']) {
      await runCase(`late training ${mutation} iteration failure rolls back parents and all children`, async () => {
        const example = await seedExample();
        const identity = await seedUser();
        let trainingId;
        let before;
        if (mutation === 'replace') {
          ({id: trainingId} = await operation('training').service.createTraining(trainingBody(example.id), identity.user));
          await ds.getRepository(E.TrainingsEntity).update({id: trainingId}, {createdAt: new Date('2001-02-03T04:05:06Z')});
          before = await trainingSnapshot(trainingId);
          assert(before[1].length === 2 && before[2].length === 4, 'rollback fixture must include ordered nested history');
        }
        const countsBefore = await graphCounts();
        const body = trainingBody(example.id, {duration: 99, volume: 432.1});
        body.exercises[1].iterations[1].repetitions = -777777;
        body.exercises[0].iterations[0].bodyMultiplier = 1.20;
        let insertedExercises = 0;
        let insertedIterations = 0;
        const writing = operation('training', {save: async context => {
          if (context.args[0] instanceof E.ExercisesEntity) insertedExercises += 1;
          if (context.args[0] instanceof E.IterationsEntity) insertedIterations += 1;
        }});
        const result = await outcome(mutation === 'create'
          ? writing.service.createTraining(body, identity.user)
          : writing.service.updateTraining(trainingId, body, identity.user));
        assert(!result.ok && code(result.error) === '23514', 'real iteration insert constraint must reject transaction');
        assert(insertedExercises === 2 && insertedIterations === 3, 'failure must follow actual writes of both exercises and three iterations');
        same(await graphCounts(), countsBefore, 'rollback must leave no parent/child orphans');
        if (mutation === 'replace') same(await trainingSnapshot(trainingId), before,
          'rollback must restore original IDs, timestamps, order, totals and historical weight snapshots');
      });
    }
  } finally {
    await ds.query('DROP TRIGGER IF EXISTS grippo_test_reject_iteration ON iterations');
    await ds.query('DROP FUNCTION IF EXISTS grippo_test_reject_iteration()');
  }

  for (const invalid of ['muscle', 'equipment']) {
    await runCase(`unknown catalog ${invalid} returns 400 before creating rows`, async () => {
      const dictionary = await seedDictionaries();
      const body = catalogBody(dictionary);
      if (invalid === 'muscle') body.exerciseExampleBundles[0].muscleId = randomUUID();
      else body.equipmentRefs[0].equipmentId = randomUUID();
      const before = await catalogCounts();
      const result = await outcome(operation('catalog').service.createExerciseExample(body));
      assert(!result.ok && status(result.error) === 400, 'unknown dictionary reference must produce 400');
      same(await catalogCounts(), before, 'invalid references must leave no catalog rows');
    });
  }

  await runCase('invalid catalog update preserves previous children and metadata', async () => {
    const example = await seedExample();
    const before = await catalogSnapshot(example.id);
    const body = catalogBody(example.dictionary, {imageUrl: 'synthetic://should-rollback'});
    body.equipmentRefs[0].equipmentId = randomUUID();
    const result = await outcome(operation('catalog').service.updateExerciseExample(example.id, body));
    assert(!result.ok && status(result.error) === 400, 'invalid replacement reference must produce 400');
    same(await catalogSnapshot(example.id), before, 'reference rejection must preserve old catalog graph');
  });

  await runCase('unknown later training example returns 400 and rolls back earlier valid children', async () => {
    const example = await seedExample();
    const identity = await seedUser();
    const before = await graphCounts();
    const body = trainingBody(example.id);
    body.exercises[1].exerciseExampleId = randomUUID();
    let earlierChildren = 0;
    const writing = operation('training', {save: async context => {
      if (context.args[0] instanceof E.IterationsEntity) earlierChildren += 1;
    }});
    const result = await outcome(writing.service.createTraining(body, identity.user));
    assert(earlierChildren === 2 && !result.ok && status(result.error) === 400,
      'unknown later example must fail after actual earlier child writes');
    same(await graphCounts(), before, 'invalid later example must leave no partial training');
  });

  await runCase('actual PostgreSQL FK metadata matches declared CASCADE and SET NULL', async () => {
    const rows = await ds.query(`
      SELECT c.conrelid::regclass::text AS child, a.attname AS column_name,
        c.confrelid::regclass::text AS parent, c.confdeltype AS action
      FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace`);
    const expected = [
      ['trainings', 'profile_id', 'user_profiles', 'c'],
      ['exercises', 'training_id', 'trainings', 'c'],
      ['exercises', 'exercise_example_id', 'exercise_examples', 'n'],
      ['iterations', 'exercise_id', 'exercises', 'c'],
      ['exercise_example_bundles', 'exercise_example_id', 'exercise_examples', 'c'],
      ['exercise_example_bundles', 'muscle_id', 'muscles', 'c'],
      ['exercise_examples_equipments', 'exercise_example_id', 'exercise_examples', 'c'],
      ['exercise_examples_equipments', 'equipment_id', 'equipments', 'c'],
      ['exercise_example_components', 'exercise_example_id', 'exercise_examples', 'c'],
      ['exercise_example_translations', 'exercise_example_id', 'exercise_examples', 'c'],
    ];
    for (const [child, column, parent, action] of expected) {
      assert(rows.some(row => row.child === child && row.column_name === column && row.parent === parent && row.action === action),
        `actual FK metadata mismatch for ${child}.${column}`);
    }
  });

  await runCase('direct catalog deletion cascades catalog children and sets history example FK to null', async () => {
    const example = await seedExample();
    const identity = await seedUser();
    const {id} = await operation('training').service.createTraining(trainingBody(example.id), identity.user);
    const before = await trainingSnapshot(id);
    const guard = await outcome(operation('catalog').service.deleteExerciseExample(example.id));
    assert(!guard.ok && status(guard.error) === 409, 'service must reject deletion of used example');
    // Deliberately bypass service only to verify metadata-defined DB action.
    await ds.query('DELETE FROM exercise_examples WHERE id = $1', [example.id]);
    const after = await trainingSnapshot(id);
    same(after[0], before[0], 'direct catalog deletion must preserve training');
    same(after[2], before[2], 'direct catalog deletion must preserve iteration snapshots');
    assert(after[1].length === before[1].length && after[1].every(item => item.row.exercise_example_id === null),
      'catalog FK deletion must nullify references without deleting exercises');
    const withoutExample = items => items.map(({row}) => {
      const {exercise_example_id, ...rest} = row;
      return rest;
    });
    same(withoutExample(after[1]), withoutExample(before[1]), 'history attributes and IDs must remain unchanged');
    const catalog = await catalogSnapshot(example.id);
    assert(catalog.every(rows => rows.length === 0), 'all catalog-owned child rows must cascade');
    assert(await count(E.MusclesEntity, {id: example.dictionary.muscle.id}) === 1, 'catalog delete must preserve muscle');
    assert(await count(E.EquipmentsEntity, {id: example.dictionary.equipment.id}) === 1, 'catalog delete must preserve equipment');
    await ds.query('DELETE FROM trainings WHERE id = $1', [id]);
    const final = await trainingSnapshot(id);
    assert(final.every(rows => rows.length === 0), 'training deletion must cascade exercises and iterations');
  });

  await runCase('unknown valid UUID direct inserts fail actual FK with SQLSTATE 23503', async () => {
    const example = await seedExample();
    for (const [type, body] of [
      [E.ExercisesEntity, {id: randomUUID(), trainingId: randomUUID()}],
      [E.ExercisesEntity, {id: randomUUID(), trainingId: null, exerciseExampleId: randomUUID()}],
      [E.IterationsEntity, {id: randomUUID(), exerciseId: randomUUID()}],
      [E.ExerciseExampleBundlesEntity, {id: randomUUID(), exerciseExampleId: example.id, muscleId: randomUUID(), percentage: 100}],
      [E.ExerciseExamplesEquipmentsEntity, {id: randomUUID(), exerciseExampleId: example.id, equipmentId: randomUUID()}],
      [E.ExerciseExampleTranslationEntity, {id: randomUUID(), exerciseExampleId: randomUUID(), language: 'en', name: 'Synthetic invalid reference', description: null}],
      [E.ExerciseExampleComponentsEntity, {id: randomUUID(), exerciseExampleId: randomUUID(),
        externalWeightRequired: null, bodyWeightMultiplier: null, extraWeightRequired: null, assistWeightRequired: null}],
    ]) {
      const before = await ds.getRepository(type).count();
      const result = await outcome(ds.getRepository(type).insert(body));
      assert(!result.ok && code(result.error) === '23503', 'unknown valid UUID must be rejected by actual PostgreSQL FK');
      assert(await ds.getRepository(type).count() === before, 'failed FK insert must not leave a row');
    }
  });

  assert.equal(results.length, 21, 'Catalog scenario inventory changed; review the documented coverage');
  return results;
}

module.exports = {runCatalog, expectedCases: 21};
