'use strict';

// Equipment publication rehearsals run only inside the catalog suite's owned DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');

async function runBeltSquatCases(ctx, helpers) {
  const {ds, E} = ctx;
  const {runCase, same, outcome, code, bounded, blockedBy, seedExample, seedUser} = helpers;
  const readSql = name => fs.readFileSync(path.resolve(__dirname, `../../scripts/sql/${name}.sql`), 'utf8');
  const preflightSql = readSql('preflight-belt-squat');
  const enumSql = readSql('add-belt-squat-enum');
  const dataSql = readSql('add-belt-squat-equipment');
  const fixtureSchema = 'grippo belt_squat rehearsal';
  const schema = '"grippo belt_squat rehearsal"';
  const sqlTable = `${schema}.equipments`;
  const groupTable = `${schema}.equipment_groups`;
  const enumType = `${schema}."actual Belt Squat Kind"`;
  // Deliberately synthetic; this is not a proposed stored production name.
  const equipmentName = "Synthetic belt squat 'test'; --";
  let machines;
  const oldIds = [];

  async function connection(catalogSchema = fixtureSchema, name = equipmentName) {
    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.query("SELECT set_config('grippo.catalog_schema', $1, false)", [catalogSchema]);
    await runner.query("SELECT set_config('grippo.belt_squat_name', $1, false)", [name]);
    return runner;
  }

  async function reset(runner) {
    await runner.query('ROLLBACK');
    await runner.query('RESET default_transaction_isolation');
    await runner.query('RESET grippo.catalog_schema');
    await runner.query('RESET grippo.belt_squat_name');
    await runner.release();
  }

  async function execute(sql, catalogSchema = fixtureSchema, name = equipmentName) {
    const runner = await connection(catalogSchema, name);
    try { return await runner.query(sql); }
    finally { await reset(runner); }
  }

  async function preflightNoticesWithoutName() {
    const runner = await connection(fixtureSchema, '');
    const notices = [];
    const capture = notice => notices.push(notice.message);
    runner.databaseConnection.on('notice', capture);
    try {
      await runner.query(preflightSql);
      return notices;
    } finally {
      runner.databaseConnection.removeListener('notice', capture);
      await reset(runner);
    }
  }

  async function rows(table = sqlTable) {
    return ds.query(`SELECT to_jsonb(t) AS row FROM ${table} t ORDER BY id`);
  }

  async function snapshot() { return Promise.all([rows(), rows(groupTable)]); }

  async function rejectUnchanged(sql, message, catalogSchema = fixtureSchema, name = equipmentName) {
    const before = await snapshot();
    const result = await outcome(execute(sql, catalogSchema, name));
    assert(!result.ok && code(result.error) === 'P0001', message);
    same(await snapshot(), before, 'rejected equipment operation must not change catalog rows');
  }

  async function labels() {
    return (await ds.query('SELECT enumlabel FROM pg_enum WHERE enumtypid=$1::regtype ORDER BY enumsortorder', [enumType]))
      .map(row => row.enumlabel);
  }

  async function concurrentPublication(competingName) {
    await ds.query(`DELETE FROM ${sqlTable} WHERE type::text='belt_squat'`);
    const first = await connection();
    const second = await connection(fixtureSchema, competingName);
    let pending;
    try {
      const [{pid: firstPid}] = await first.query('SELECT pg_backend_pid() AS pid');
      const [{pid: secondPid}] = await second.query('SELECT pg_backend_pid() AS pid');
      for (const runner of [first, second]) {
        await runner.query("SET default_transaction_isolation = 'repeatable read'");
      }
      // Run the real file and hold only COMMIT so the competing statement waits.
      await first.query(dataSql.replace(/\nCOMMIT;\s*$/, '\n'));
      const firstRows = await first.query(`SELECT to_jsonb(t) AS row FROM ${sqlTable} t WHERE type::text='belt_squat'`);
      pending = outcome(second.query(dataSql));
      await blockedBy(secondPid, firstPid);
      await first.query('COMMIT');
      const result = await bounded(pending, 'concurrent belt squat publication timed out');
      if (competingName === equipmentName) {
        assert(result.ok, 'same-name publication must become a no-op after waiting');
      } else {
        assert(!result.ok && code(result.error) === 'P0001', 'different-name publication must reject the committed conflict');
      }
      same(await ds.query(`SELECT to_jsonb(t) AS row FROM ${sqlTable} t WHERE type::text='belt_squat'`), firstRows,
        'waiting publication must preserve exactly the first equipment UUID, name and timestamps');
    } finally {
      await first.query('ROLLBACK');
      if (pending) await bounded(pending, 'belt squat lock cleanup timed out');
      await reset(second);
      await reset(first);
    }
  }

  try {
    await runCase('belt squat preflight reads quoted schema metadata and permits an unresolved stored name without writes', async () => {
      await ds.query(`CREATE SCHEMA ${schema}`);
      await ds.query(`CREATE TYPE ${enumType} AS ENUM ('squat_rack','smith_machines','hack_squat_machines','butterfly','butterfly_forearm','kettlebells','assisted_pull_up_dip','plate_loaded_row')`);
      await ds.query(`CREATE TABLE ${groupTable} (id uuid PRIMARY KEY, name text NOT NULL, type text,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      await ds.query(`CREATE TABLE ${sqlTable} (id uuid PRIMARY KEY, name text NOT NULL, type ${enumType},
        equipment_group_id uuid REFERENCES ${groupTable}(id),
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      machines = randomUUID();
      await ds.query(`INSERT INTO ${groupTable}(id,name,type) VALUES ($1,'Synthetic machines','machines')`, [machines]);
      for (const type of ['squat_rack', 'smith_machines', 'hack_squat_machines', 'butterfly', 'butterfly_forearm', 'kettlebells', 'assisted_pull_up_dip', 'plate_loaded_row']) {
        const id = randomUUID();
        oldIds.push(id);
        await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,$2,$3,$4)`,
          [id, `Synthetic ${type}`, type, machines]);
      }
      const before = await snapshot();
      const oldLabels = await labels();
      const notices = await preflightNoticesWithoutName();
      assert(notices.some(message => /^Existing belt_squat catalog record present: (?:f|false)$/.test(message)),
        'preflight must identify a missing catalog record');
      assert(!notices.some(message => /already published:/i.test(message)),
        'missing record must not be reported as already published');
      assert(notices.some(message => message.startsWith('Server name unresolved:')),
        'preflight must report unresolved name independently of catalog presence');
      await execute(preflightSql);
      same(await snapshot(), before, 'preflight must leave all catalog rows unchanged');
      same(await labels(), oldLabels, 'preflight must not append the new enum value');
    });

    await runCase('belt squat schema step appends only the new label and rejects premature data publication', async () => {
      const before = await snapshot();
      await rejectUnchanged(dataSql, 'data step requires the committed new label');
      await execute(enumSql);
      await execute(enumSql);
      same(await labels(), ['squat_rack', 'smith_machines', 'hack_squat_machines', 'butterfly', 'butterfly_forearm', 'kettlebells', 'assisted_pull_up_dip', 'plate_loaded_row', 'belt_squat'], 'old enum labels and order must remain intact');
      same(await snapshot(), before, 'schema step must preserve old UUIDs and timestamps without publishing a row');
    });

    await runCase('belt squat data step requires an explicit name and preserves generated or existing UUIDs and timestamps', async () => {
      for (const name of ['', '   ', ` ${equipmentName}`, `${equipmentName} `]) {
        await rejectUnchanged(dataSql, 'unset, blank or untrimmed stored name must fail', fixtureSchema, name);
      }
      const before = await rows();
      await execute(dataSql);
      const after = await rows();
      const added = after.find(item => item.row.type === 'belt_squat').row;
      assert.match(added.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      assert(!oldIds.includes(added.id) && added.equipment_group_id === machines, 'belt_squat needs its own UUID in machines');
      assert.equal(added.name, equipmentName, 'stored name must be exactly the explicit input');
      same(after.filter(item => item.row.type !== 'belt_squat'), before, 'data step must preserve old equipment byte-equivalently');
      await execute(dataSql);
      await execute(preflightSql);
      same(await rows(), after, 'repeat and preflight must preserve all equipment UUIDs and timestamps');
      const existingSnapshot = await snapshot();
      const notices = await preflightNoticesWithoutName();
      assert(notices.some(message => /^Existing belt_squat catalog record present: (?:t|true)$/.test(message)),
        'preflight must identify an existing catalog record even without an agreed name');
      assert(notices.some(message => /already published:/i.test(message)),
        'existing row must be reported as already published for current client compatibility review');
      assert(notices.some(message => message.startsWith('Server name unresolved:')),
        'already published record must not imply that a server name was agreed');
      same(await snapshot(), existingSnapshot, 'existing-record preflight with unresolved name must remain read-only');
      await ds.query(`DELETE FROM ${sqlTable} WHERE id=$1`, [added.id]);
      const existingId = randomUUID();
      await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id,created_at,updated_at)
        VALUES ($1,$2,'belt_squat',$3,'2001-01-02 03:04:05','2002-02-03 04:05:06')`, [existingId, equipmentName, machines]);
      const manuallyExisting = await rows();
      await execute(dataSql);
      same(await rows(), manuallyExisting, 'correct manually existing entry must keep its original UUID and timestamps');
    });

    await runCase('belt squat preflight and data reject group, type, name and timestamp conflicts without edits', async () => {
      const [{id}] = await ds.query(`SELECT id FROM ${sqlTable} WHERE type::text='belt_squat'`);
      const baseline = await snapshot();
      const rejectBoth = async message => {
        for (const sql of [preflightSql, dataSql]) await rejectUnchanged(sql, message);
      };
      await ds.query(`UPDATE ${groupTable} SET type=NULL WHERE id=$1`, [machines]);
      await rejectBoth('missing machines group must fail');
      await ds.query(`UPDATE ${groupTable} SET type='machines' WHERE id=$1`, [machines]);
      const other = randomUUID();
      await ds.query(`INSERT INTO ${groupTable}(id,name,type) VALUES ($1,'Synthetic extra group','machines')`, [other]);
      await rejectBoth('duplicate machines groups must fail');
      await ds.query(`UPDATE ${groupTable} SET type='other' WHERE id=$1`, [other]);
      await ds.query(`UPDATE ${sqlTable} SET equipment_group_id=$1 WHERE id=$2`, [other, id]);
      await rejectBoth('existing belt_squat under another group must fail');
      await ds.query(`UPDATE ${sqlTable} SET equipment_group_id=$1,name='Synthetic unexpected name' WHERE id=$2`, [machines, id]);
      await rejectBoth('existing belt_squat with a different stored name must fail');
      await ds.query(`UPDATE ${sqlTable} SET name=$1 WHERE id=$2`, [equipmentName, id]);
      const duplicate = randomUUID();
      await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,'Synthetic duplicate','belt_squat',$2)`, [duplicate, machines]);
      await rejectBoth('duplicate belt_squat type must fail');
      for (const otherType of [null, 'squat_rack']) {
        await ds.query(`UPDATE ${sqlTable} SET type=$1,name=$2 WHERE id=$3`, [otherType, ` ${equipmentName.toUpperCase()} `, duplicate]);
        await rejectBoth('normalized name under another or NULL type must fail');
      }
      await ds.query(`DELETE FROM ${sqlTable} WHERE id=$1`, [duplicate]);
      for (const column of ['created_at', 'updated_at']) {
        await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN ${column} DROP NOT NULL`);
        const [{value}] = await ds.query(`SELECT ${column} AS value FROM ${sqlTable} WHERE id=$1`, [id]);
        await ds.query(`UPDATE ${sqlTable} SET ${column}=NULL WHERE id=$1`, [id]);
        await rejectBoth('existing belt_squat with a missing timestamp must fail');
        await ds.query(`UPDATE ${sqlTable} SET ${column}=$1 WHERE id=$2`, [value, id]);
        await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN ${column} SET NOT NULL`);
      }
      await ds.query(`DELETE FROM ${groupTable} WHERE id=$1`, [other]);
      same(await snapshot(), baseline, 'conflict fixtures must restore the exact original catalog');
    });

    await runCase('belt squat SQL requires a verified schema and refuses unexpected enum consumers', async () => {
      for (const sql of [preflightSql, enumSql, dataSql]) {
        await rejectUnchanged(sql, 'missing schema must fail', '');
        await rejectUnchanged(sql, 'unknown schema must fail', 'grippo_missing_belt_squat_schema');
      }
      const before = await labels();
      for (const consumerType of [enumType, `${enumType}[]`]) {
        await ds.query(`CREATE TABLE ${schema}.unexpected_consumer (type ${consumerType})`);
        try {
          for (const sql of [preflightSql, enumSql, dataSql]) {
            await rejectUnchanged(sql, 'direct or array enum consumer must require explicit review');
          }
          same(await labels(), before, 'unexpected consumers must not change the enum');
        } finally { await ds.query(`DROP TABLE ${schema}.unexpected_consumer`); }
      }
    });

    await runCase('belt squat preflight and data reject incompatible catalog column metadata', async () => {
      const before = await snapshot();
      for (const column of ['name', 'created_at', 'equipment_group_id']) {
        await ds.query(`ALTER TABLE ${sqlTable} RENAME COLUMN ${column} TO unexpected_column`);
        try {
          for (const sql of [preflightSql, dataSql]) {
            await rejectUnchanged(sql, 'missing required catalog column must require schema review');
          }
        } finally { await ds.query(`ALTER TABLE ${sqlTable} RENAME COLUMN unexpected_column TO ${column}`); }
      }
      await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN type TYPE text USING type::text`);
      try {
        for (const sql of [preflightSql, enumSql, dataSql]) {
          await rejectUnchanged(sql, 'a text equipment type cannot substitute for the actual PostgreSQL enum');
        }
      } finally { await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN type TYPE ${enumType} USING type::${enumType}`); }
      same(await snapshot(), before, 'metadata fixtures must restore the exact original catalog');
    });

    await runCase('concurrent identical belt squat publications observe the committed row after waiting despite repeatable-read defaults', async () => {
      await concurrentPublication(equipmentName);
    });

    await runCase('concurrent differently named belt squat publication rejects the first committed row without replacing its UUID', async () => {
      await concurrentPublication('Synthetic competing belt_squat');
    });

    await runCase('belt squat service preserves squat equipment and neighboring additions with independent UUID exclusions', async () => {
      const confirmedName = 'Belt Squat';
      const groupRepo = ds.getRepository(E.EquipmentGroupsEntity);
      const machineGroup = await groupRepo.save({name: 'Synthetic machines', type: 'machines'});
      const freeGroup = await groupRepo.save({name: 'Synthetic free weights', type: 'free_weight'});
      const benchGroup = await groupRepo.save({name: 'Synthetic benches', type: 'benches_and_racks'});
      const example = await seedExample();
      const identity = await seedUser();
      try {
        const old = [];
        for (const [type, equipmentGroup] of [
          ['squat_rack', benchGroup], ['smith_machines', machineGroup], ['hack_squat_machines', machineGroup],
          ['butterfly', machineGroup], ['butterfly_forearm', machineGroup], ['kettlebells', freeGroup],
          ['assisted_pull_up_dip', machineGroup], ['plate_loaded_row', machineGroup],
        ]) {
          old.push(await ds.getRepository(E.EquipmentsEntity).save({name: `Synthetic ${type}`, type, equipmentGroup}));
          await ds.getRepository(E.ExerciseExamplesEquipmentsEntity).save({exerciseExampleId: example.id, equipmentId: old.at(-1).id});
        }
        const users = ctx.services.UsersService;
        await users.updateExcludedEquipments(identity.user, old.map(item => item.id));
        const relatedRows = () => Promise.all([
          ds.query("SELECT to_jsonb(t) AS row FROM equipments t WHERE type::text IS DISTINCT FROM 'belt_squat' ORDER BY id"),
          ds.query('SELECT to_jsonb(t) AS row FROM exercise_examples_equipments t ORDER BY id'),
          ds.query('SELECT to_jsonb(t) AS row FROM excluded_equipments t WHERE profile_id=$1 ORDER BY id', [identity.profile.id]),
          ds.query('SELECT to_jsonb(t) AS row FROM equipment_groups t ORDER BY id'),
        ]);
        const before = await relatedRows();
        await execute(enumSql, 'public');
        await execute(preflightSql, 'public', confirmedName);
        await execute(dataSql, 'public', confirmedName);
        await execute(dataSql, 'public', confirmedName);
        same(await relatedRows(), before, 'publication must preserve previous equipment, groups, all exercise refs and existing exclusions');
        const groups = await ctx.services.EquipmentsService.getEquipments();
        const parent = groups.find(item => item.id === machineGroup.id);
        const entries = groups.flatMap(item => item.equipments).filter(item => item.type === 'belt_squat');
        assert.equal(entries.length, 1, 'service must return exactly one belt_squat entry');
        const added = entries[0];
        assert(parent.type === 'machines' && parent.equipments.some(item => item.id === added.id)
          && added.equipmentGroupId === parent.id, 'belt squat group ID must equal its machines parent');
        assert(!old.some(item => item.id === added.id), 'belt squat requires its own server identity');
        same(Object.keys(added).sort(), ['id','name','type','equipmentGroupId','createdAt','updatedAt'].sort(), 'public equipment response shape must stay unchanged');
        assert(added.id && added.name === confirmedName && added.createdAt instanceof Date && added.updatedAt instanceof Date,
          'all required response fields must be populated');
        const allIds = [...old.map(item => item.id), added.id];
        await users.updateExcludedEquipments(identity.user, allIds);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id).sort(), [...allIds].sort(),
          'all previous equipment and belt_squat must be independently excludable');
        for (const removed of old) {
          const keep = allIds.filter(id => id !== removed.id);
          await users.updateExcludedEquipments(identity.user, keep);
          same((await users.getExcludedEquipments(identity.user)).map(item => item.id).sort(), [...keep].sort(),
            'removing any previous equipment exclusion must preserve all other and new exclusions');
        }
        await users.updateExcludedEquipments(identity.user, old.map(item => item.id));
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id).sort(), old.map(item => item.id).sort(),
          'removing the belt squat exclusion must preserve all previous equipment exclusions');
        const afterToggles = await relatedRows();
        same([afterToggles[0], afterToggles[1], afterToggles[3]], [before[0], before[1], before[3]],
          'exclusion toggles must preserve all old equipment, groups and exercise refs');
      } finally {
        for (const group of [machineGroup, freeGroup, benchGroup]) await groupRepo.delete(group.id);
      }
    });
  } finally {
    await ds.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  }
}

module.exports = {runBeltSquatCases, expectedCases: 9};
