'use strict';

// Equipment publication rehearsals run only inside the catalog suite's owned DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');

async function runKettlebellCases(ctx, helpers) {
  const {ds, E} = ctx;
  const {runCase, same, outcome, code, bounded, blockedBy, seedExample, seedUser} = helpers;
  const readSql = name => fs.readFileSync(path.resolve(__dirname, `fixtures/equipment-publication/${name}.sql`), 'utf8');
  const preflightSql = readSql('preflight-kettlebells');
  const enumSql = readSql('add-kettlebells-enum');
  const dataSql = readSql('add-kettlebells-equipment');
  const fixtureSchema = 'grippo kettlebells rehearsal';
  const schema = '"grippo kettlebells rehearsal"';
  const sqlTable = `${schema}.equipments`;
  const groupTable = `${schema}.equipment_groups`;
  const enumType = `${schema}."actual Free Weight Kind"`;
  // Deliberately synthetic; this is not a proposed stored production name.
  const equipmentName = "Synthetic kettlebells 'test'";
  let freeWeight;
  const oldIds = [];

  async function connection(catalogSchema = fixtureSchema, name = equipmentName) {
    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.query("SELECT set_config('grippo.catalog_schema', $1, false)", [catalogSchema]);
    await runner.query("SELECT set_config('grippo.kettlebells_name', $1, false)", [name]);
    return runner;
  }

  async function reset(runner) {
    await runner.query('ROLLBACK');
    await runner.query('RESET default_transaction_isolation');
    await runner.query('RESET grippo.catalog_schema');
    await runner.query('RESET grippo.kettlebells_name');
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
    await ds.query(`DELETE FROM ${sqlTable} WHERE type::text='kettlebells'`);
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
      const firstRows = await first.query(`SELECT to_jsonb(t) AS row FROM ${sqlTable} t WHERE type::text='kettlebells'`);
      pending = outcome(second.query(dataSql));
      await blockedBy(secondPid, firstPid);
      await first.query('COMMIT');
      const result = await bounded(pending, 'concurrent kettlebell publication timed out');
      if (competingName === equipmentName) {
        assert(result.ok, 'same-name publication must become a no-op after waiting');
      } else {
        assert(!result.ok && code(result.error) === 'P0001', 'different-name publication must reject the committed conflict');
      }
      same(await ds.query(`SELECT to_jsonb(t) AS row FROM ${sqlTable} t WHERE type::text='kettlebells'`), firstRows,
        'waiting publication must preserve exactly the first equipment UUID, name and timestamps');
    } finally {
      await first.query('ROLLBACK');
      if (pending) await bounded(pending, 'kettlebell lock cleanup timed out');
      await reset(second);
      await reset(first);
    }
  }

  try {
    await runCase('kettlebell preflight reads quoted schema metadata and permits an unresolved stored name without writes', async () => {
      await ds.query(`CREATE SCHEMA ${schema}`);
      await ds.query(`CREATE TYPE ${enumType} AS ENUM ('dumbbells','barbell','rope')`);
      await ds.query(`CREATE TABLE ${groupTable} (id uuid PRIMARY KEY, name text NOT NULL, type text,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      await ds.query(`CREATE TABLE ${sqlTable} (id uuid PRIMARY KEY, name text NOT NULL, type ${enumType},
        equipment_group_id uuid REFERENCES ${groupTable}(id),
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      freeWeight = randomUUID();
      await ds.query(`INSERT INTO ${groupTable}(id,name,type) VALUES ($1,'Synthetic free weights','free_weight')`, [freeWeight]);
      for (const type of ['dumbbells', 'barbell', 'rope']) {
        const id = randomUUID();
        oldIds.push(id);
        await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,$2,$3,$4)`,
          [id, `Synthetic ${type}`, type, freeWeight]);
      }
      const before = await snapshot();
      const oldLabels = await labels();
      const notices = await preflightNoticesWithoutName();
      assert(notices.some(message => /^Existing kettlebells catalog record present: (?:f|false)$/.test(message)),
        'preflight must identify a missing catalog record');
      assert(!notices.some(message => message.startsWith('Kettlebells is already published:')),
        'missing record must not be reported as already published');
      assert(notices.some(message => message.startsWith('Server name unresolved:')),
        'preflight must report unresolved name independently of catalog presence');
      await execute(preflightSql);
      same(await snapshot(), before, 'preflight must leave all catalog rows unchanged');
      same(await labels(), oldLabels, 'preflight must not append the new enum value');
    });

    await runCase('kettlebell schema step appends only the new label and rejects premature data publication', async () => {
      const before = await snapshot();
      await rejectUnchanged(dataSql, 'data step requires the committed new label');
      await execute(enumSql);
      await execute(enumSql);
      same(await labels(), ['dumbbells', 'barbell', 'rope', 'kettlebells'], 'old enum labels and order must remain intact');
      same(await snapshot(), before, 'schema step must preserve old UUIDs and timestamps without publishing a row');
    });

    await runCase('kettlebell data step requires an explicit name and preserves generated or existing UUIDs and timestamps', async () => {
      for (const name of ['', '   ', ` ${equipmentName}`, `${equipmentName} `]) {
        await rejectUnchanged(dataSql, 'unset, blank or untrimmed stored name must fail', fixtureSchema, name);
      }
      const before = await rows();
      await execute(dataSql);
      const after = await rows();
      const added = after.find(item => item.row.type === 'kettlebells').row;
      assert.match(added.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      assert(!oldIds.includes(added.id) && added.equipment_group_id === freeWeight, 'kettlebells needs its own UUID in free_weight');
      assert.equal(added.name, equipmentName, 'stored name must be exactly the explicit input');
      same(after.filter(item => item.row.type !== 'kettlebells'), before, 'data step must preserve old equipment byte-equivalently');
      await execute(dataSql);
      await execute(preflightSql);
      same(await rows(), after, 'repeat and preflight must preserve all equipment UUIDs and timestamps');
      const existingSnapshot = await snapshot();
      const notices = await preflightNoticesWithoutName();
      assert(notices.some(message => /^Existing kettlebells catalog record present: (?:t|true)$/.test(message)),
        'preflight must identify an existing catalog record even without an agreed name');
      assert(notices.some(message => message.startsWith('Kettlebells is already published:')),
        'existing row must be reported as already published for current client compatibility review');
      assert(notices.some(message => message.startsWith('Server name unresolved:')),
        'already published record must not imply that a server name was agreed');
      same(await snapshot(), existingSnapshot, 'existing-record preflight with unresolved name must remain read-only');
      await ds.query(`DELETE FROM ${sqlTable} WHERE id=$1`, [added.id]);
      const existingId = randomUUID();
      await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id,created_at,updated_at)
        VALUES ($1,$2,'kettlebells',$3,'2001-01-02 03:04:05','2002-02-03 04:05:06')`, [existingId, equipmentName, freeWeight]);
      const manuallyExisting = await rows();
      await execute(dataSql);
      same(await rows(), manuallyExisting, 'correct manually existing entry must keep its original UUID and timestamps');
    });

    await runCase('kettlebell preflight and data reject group, type, name and timestamp conflicts without edits', async () => {
      const [{id}] = await ds.query(`SELECT id FROM ${sqlTable} WHERE type::text='kettlebells'`);
      const baseline = await snapshot();
      const rejectBoth = async message => {
        for (const sql of [preflightSql, dataSql]) await rejectUnchanged(sql, message);
      };
      await ds.query(`UPDATE ${groupTable} SET type=NULL WHERE id=$1`, [freeWeight]);
      await rejectBoth('missing free_weight group must fail');
      await ds.query(`UPDATE ${groupTable} SET type='free_weight' WHERE id=$1`, [freeWeight]);
      const other = randomUUID();
      await ds.query(`INSERT INTO ${groupTable}(id,name,type) VALUES ($1,'Synthetic extra group','free_weight')`, [other]);
      await rejectBoth('duplicate free_weight groups must fail');
      await ds.query(`UPDATE ${groupTable} SET type='other' WHERE id=$1`, [other]);
      await ds.query(`UPDATE ${sqlTable} SET equipment_group_id=$1 WHERE id=$2`, [other, id]);
      await rejectBoth('existing kettlebells under another group must fail');
      await ds.query(`UPDATE ${sqlTable} SET equipment_group_id=$1,name='Synthetic unexpected name' WHERE id=$2`, [freeWeight, id]);
      await rejectBoth('existing kettlebells with a different stored name must fail');
      await ds.query(`UPDATE ${sqlTable} SET name=$1 WHERE id=$2`, [equipmentName, id]);
      const duplicate = randomUUID();
      await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,'Synthetic duplicate','kettlebells',$2)`, [duplicate, freeWeight]);
      await rejectBoth('duplicate kettlebells type must fail');
      for (const otherType of [null, 'dumbbells']) {
        await ds.query(`UPDATE ${sqlTable} SET type=$1,name=$2 WHERE id=$3`, [otherType, ` ${equipmentName.toUpperCase()} `, duplicate]);
        await rejectBoth('normalized name under another or NULL type must fail');
      }
      await ds.query(`DELETE FROM ${sqlTable} WHERE id=$1`, [duplicate]);
      for (const column of ['created_at', 'updated_at']) {
        await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN ${column} DROP NOT NULL`);
        const [{value}] = await ds.query(`SELECT ${column} AS value FROM ${sqlTable} WHERE id=$1`, [id]);
        await ds.query(`UPDATE ${sqlTable} SET ${column}=NULL WHERE id=$1`, [id]);
        await rejectBoth('existing kettlebells with a missing timestamp must fail');
        await ds.query(`UPDATE ${sqlTable} SET ${column}=$1 WHERE id=$2`, [value, id]);
        await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN ${column} SET NOT NULL`);
      }
      await ds.query(`DELETE FROM ${groupTable} WHERE id=$1`, [other]);
      same(await snapshot(), baseline, 'conflict fixtures must restore the exact original catalog');
    });

    await runCase('kettlebell SQL requires a verified schema and refuses unexpected enum consumers', async () => {
      for (const sql of [preflightSql, enumSql, dataSql]) {
        await rejectUnchanged(sql, 'missing schema must fail', '');
        await rejectUnchanged(sql, 'unknown schema must fail', 'grippo_missing_kettlebells_schema');
      }
      const before = await labels();
      await ds.query(`CREATE TABLE ${schema}.unexpected_consumer (type ${enumType})`);
      try {
        for (const sql of [preflightSql, enumSql]) {
          await rejectUnchanged(sql, 'unexpected enum consumer must require explicit review');
        }
        same(await labels(), before, 'unexpected consumers must not change the enum');
      } finally { await ds.query(`DROP TABLE ${schema}.unexpected_consumer`); }
    });

    await runCase('concurrent identical kettlebell publications observe the committed row after waiting despite repeatable-read defaults', async () => {
      await concurrentPublication(equipmentName);
    });

    await runCase('concurrent differently named kettlebell publication rejects the first committed row without replacing its UUID', async () => {
      await concurrentPublication('Synthetic competing kettlebells');
    });

    await runCase('kettlebell service preserves old refs and required fields while UUID exclusions independently distinguish dumbbells', async () => {
      const group = await ds.getRepository(E.EquipmentGroupsEntity).save({name: 'Synthetic free weights', type: 'free_weight'});
      const example = await seedExample();
      const identity = await seedUser();
      try {
        const old = [];
        for (const type of ['dumbbells', 'barbell']) {
          old.push(await ds.getRepository(E.EquipmentsEntity).save({name: `Synthetic ${type}`, type, equipmentGroup: group}));
        }
        await ds.getRepository(E.ExerciseExamplesEquipmentsEntity).save({exerciseExampleId: example.id, equipmentId: old[0].id});
        const users = ctx.services.UsersService;
        await users.updateExcludedEquipments(identity.user, [old[0].id]);
        const relatedRows = () => Promise.all([
          ds.query('SELECT to_jsonb(t) AS row FROM equipments t WHERE id=ANY($1::uuid[]) ORDER BY id', [old.map(item => item.id)]),
          ds.query('SELECT to_jsonb(t) AS row FROM exercise_examples_equipments t ORDER BY id'),
          ds.query('SELECT to_jsonb(t) AS row FROM excluded_equipments t WHERE profile_id=$1 ORDER BY id', [identity.profile.id]),
        ]);
        const before = await relatedRows();
        await execute(enumSql, 'public');
        await execute(preflightSql, 'public');
        await execute(dataSql, 'public');
        await execute(dataSql, 'public');
        same(await relatedRows(), before, 'publication must preserve previous equipment, all exercise refs and existing exclusions');
        const groups = await ctx.services.EquipmentsService.getEquipments();
        const parent = groups.find(item => item.id === group.id);
        const entries = groups.flatMap(item => item.equipments).filter(item => item.type === 'kettlebells');
        assert.equal(entries.length, 1, 'service must return exactly one kettlebells entry');
        const added = entries[0];
        assert(parent.type === 'free_weight' && parent.equipments.some(item => item.id === added.id)
          && added.equipmentGroupId === parent.id, 'kettlebell group ID must equal its free_weight parent');
        same(Object.keys(added).sort(), ['id','name','type','equipmentGroupId','createdAt','updatedAt'].sort(), 'public equipment response shape must stay unchanged');
        assert(added.id && added.name === equipmentName && added.createdAt instanceof Date && added.updatedAt instanceof Date,
          'all required response fields must be populated');
        await users.updateExcludedEquipments(identity.user, [old[0].id, added.id]);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id).sort(), [old[0].id, added.id].sort(),
          'dumbbells and kettlebells must be independently excludable');
        await users.updateExcludedEquipments(identity.user, [added.id]);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id), [added.id],
          'removing the dumbbell exclusion must preserve the kettlebell exclusion');
      } finally { await ds.getRepository(E.EquipmentGroupsEntity).delete(group.id); }
    });
  } finally {
    await ds.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  }
}

module.exports = {runKettlebellCases, expectedCases: 8};
