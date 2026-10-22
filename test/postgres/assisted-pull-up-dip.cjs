'use strict';

// Equipment publication rehearsals run only inside the catalog suite's owned DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');

async function runAssistedPullUpDipCases(ctx, helpers) {
  const {ds, E} = ctx;
  const {runCase, same, outcome, code, bounded, blockedBy, seedExample, seedUser} = helpers;
  const readSql = name => fs.readFileSync(path.resolve(__dirname, `../../scripts/sql/${name}.sql`), 'utf8');
  const preflightSql = readSql('preflight-assisted-pull-up-dip');
  const enumSql = readSql('add-assisted-pull-up-dip-enum');
  const dataSql = readSql('add-assisted-pull-up-dip-equipment');
  const fixtureSchema = 'grippo assisted pull up dip rehearsal';
  const schema = '"grippo assisted pull up dip rehearsal"';
  const sqlTable = `${schema}.equipments`;
  const groupTable = `${schema}.equipment_groups`;
  const enumType = `${schema}."actual Assisted Equipment Kind"`;
  const equipmentName = 'Assisted Pull-Up / Dip';
  let machines;
  const oldIds = [];

  async function connection(catalogSchema = fixtureSchema) {
    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.query("SELECT set_config('grippo.catalog_schema', $1, false)", [catalogSchema]);
    return runner;
  }

  async function reset(runner) {
    await runner.query('ROLLBACK');
    await runner.query('RESET default_transaction_isolation');
    await runner.query('RESET grippo.catalog_schema');
    await runner.release();
  }

  async function execute(sql, catalogSchema = fixtureSchema) {
    const runner = await connection(catalogSchema);
    try { return await runner.query(sql); }
    finally { await reset(runner); }
  }

  async function preflightNotices() {
    const runner = await connection();
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

  async function rejectUnchanged(sql, message, catalogSchema = fixtureSchema) {
    const before = await snapshot();
    const result = await outcome(execute(sql, catalogSchema));
    assert(!result.ok && code(result.error) === 'P0001', message);
    same(await snapshot(), before, 'rejected equipment operation must not change catalog rows');
  }

  async function labels() {
    return (await ds.query('SELECT enumlabel FROM pg_enum WHERE enumtypid=$1::regtype ORDER BY enumsortorder', [enumType]))
      .map(row => row.enumlabel);
  }

  async function concurrentPublication(competingName) {
    await ds.query(`DELETE FROM ${sqlTable} WHERE type::text='assisted_pull_up_dip'`);
    const first = await connection();
    const second = await connection();
    let pending;
    try {
      const [{pid: firstPid}] = await first.query('SELECT pg_backend_pid() AS pid');
      const [{pid: secondPid}] = await second.query('SELECT pg_backend_pid() AS pid');
      for (const runner of [first, second]) {
        await runner.query("SET default_transaction_isolation = 'repeatable read'");
      }
      if (competingName === equipmentName) {
        // Run the real file and hold only COMMIT so the competing statement waits.
        await first.query(dataSql.replace(/\nCOMMIT;\s*$/, '\n'));
      } else {
        // An independent catalog writer may commit a conflicting name while publication waits.
        await first.query('BEGIN ISOLATION LEVEL READ COMMITTED');
        await first.query(`LOCK TABLE ${groupTable}, ${sqlTable} IN SHARE ROW EXCLUSIVE MODE`);
        await first.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id)
          VALUES (pg_catalog.gen_random_uuid(),$1,'assisted_pull_up_dip',$2)`, [competingName, machines]);
      }
      const firstRows = await first.query(`SELECT to_jsonb(t) AS row FROM ${sqlTable} t WHERE type::text='assisted_pull_up_dip'`);
      pending = outcome(second.query(dataSql));
      await blockedBy(secondPid, firstPid);
      await first.query('COMMIT');
      const result = await bounded(pending, 'concurrent assisted pull-up/dip publication timed out');
      if (competingName === equipmentName) {
        assert(result.ok, 'same-name publication must become a no-op after waiting');
      } else {
        assert(!result.ok && code(result.error) === 'P0001', 'different-name publication must reject the committed conflict');
      }
      same(await ds.query(`SELECT to_jsonb(t) AS row FROM ${sqlTable} t WHERE type::text='assisted_pull_up_dip'`), firstRows,
        'waiting publication must preserve exactly the first equipment UUID, name and timestamps');
    } finally {
      await first.query('ROLLBACK');
      if (pending) await bounded(pending, 'assisted pull-up/dip lock cleanup timed out');
      await reset(second);
      await reset(first);
    }
  }

  try {
    await runCase('assisted pull-up/dip preflight reads quoted schema metadata and checks the confirmed stored name without writes', async () => {
      await ds.query(`CREATE SCHEMA ${schema}`);
      await ds.query(`CREATE TYPE ${enumType} AS ENUM ('pull_up_bar','dip_bars','butterfly','butterfly_forearm','kettlebells')`);
      await ds.query(`CREATE TABLE ${groupTable} (id uuid PRIMARY KEY, name text NOT NULL, type text,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      await ds.query(`CREATE TABLE ${sqlTable} (id uuid PRIMARY KEY, name text NOT NULL, type ${enumType},
        equipment_group_id uuid REFERENCES ${groupTable}(id),
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      machines = randomUUID();
      await ds.query(`INSERT INTO ${groupTable}(id,name,type) VALUES ($1,'Synthetic machines','machines')`, [machines]);
      for (const type of ['pull_up_bar', 'dip_bars', 'butterfly', 'butterfly_forearm', 'kettlebells']) {
        const id = randomUUID();
        oldIds.push(id);
        await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,$2,$3,$4)`,
          [id, `Synthetic ${type}`, type, machines]);
      }
      const before = await snapshot();
      const oldLabels = await labels();
      const notices = await preflightNotices();
      assert(notices.some(message => /^Existing assisted_pull_up_dip catalog record present: (?:f|false)$/.test(message)),
        'preflight must identify a missing catalog record');
      assert(!notices.some(message => message.startsWith('Assisted pull-up/dip is already published:')),
        'missing record must not be reported as already published');
      assert(!notices.some(message => message.startsWith('Server name unresolved:')),
        'preflight must use the confirmed stored name without a session name parameter');
      await execute(preflightSql);
      same(await snapshot(), before, 'preflight must leave all catalog rows unchanged');
      same(await labels(), oldLabels, 'preflight must not append the new enum value');
    });

    await runCase('assisted pull-up/dip schema step appends only the new label and rejects premature data publication', async () => {
      const before = await snapshot();
      await rejectUnchanged(dataSql, 'data step requires the committed new label');
      await execute(enumSql);
      await execute(enumSql);
      same(await labels(), ['pull_up_bar', 'dip_bars', 'butterfly', 'butterfly_forearm', 'kettlebells', 'assisted_pull_up_dip'], 'old enum labels and order must remain intact');
      same(await snapshot(), before, 'schema step must preserve old UUIDs and timestamps without publishing a row');
    });

    await runCase('assisted pull-up/dip data step uses the confirmed name and preserves generated or existing UUIDs and timestamps', async () => {
      const before = await rows();
      const runner = await connection();
      try {
        await runner.query("SELECT set_config('grippo.assisted_pull_up_dip_name', $1, false)", ["Synthetic obsolete name 'test'"]);
        await runner.query(dataSql);
        await runner.query(preflightSql);
      } finally {
        await runner.query('ROLLBACK');
        await runner.query('RESET grippo.assisted_pull_up_dip_name');
        await reset(runner);
      }
      const after = await rows();
      const added = after.find(item => item.row.type === 'assisted_pull_up_dip').row;
      assert.match(added.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      assert(!oldIds.includes(added.id) && added.equipment_group_id === machines, 'assisted_pull_up_dip needs its own UUID in machines');
      assert.equal(added.name, equipmentName, 'stored name must remain Assisted Pull-Up / Dip despite an obsolete session name parameter');
      same(after.filter(item => item.row.type !== 'assisted_pull_up_dip'), before, 'data step must preserve old equipment byte-equivalently');
      await execute(dataSql);
      await execute(preflightSql);
      same(await rows(), after, 'repeat and preflight must preserve all equipment UUIDs and timestamps');
      const existingSnapshot = await snapshot();
      const notices = await preflightNotices();
      assert(notices.some(message => /^Existing assisted_pull_up_dip catalog record present: (?:t|true)$/.test(message)),
        'preflight must identify an existing catalog record with the confirmed name');
      assert(notices.some(message => message.startsWith('Assisted pull-up/dip is already published:')),
        'existing row must be reported as already published for current client compatibility review');
      assert(!notices.some(message => message.startsWith('Server name unresolved:')),
        'preflight must not report the confirmed name as unresolved');
      same(await snapshot(), existingSnapshot, 'existing-record preflight must remain read-only');
      await ds.query(`DELETE FROM ${sqlTable} WHERE id=$1`, [added.id]);
      const existingId = randomUUID();
      await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id,created_at,updated_at)
        VALUES ($1,$2,'assisted_pull_up_dip',$3,'2001-01-02 03:04:05','2002-02-03 04:05:06')`, [existingId, equipmentName, machines]);
      const manuallyExisting = await rows();
      await execute(dataSql);
      same(await rows(), manuallyExisting, 'correct manually existing entry must keep its original UUID and timestamps');
    });

    await runCase('assisted pull-up/dip preflight and data reject group, type, name and timestamp conflicts without edits', async () => {
      const [{id}] = await ds.query(`SELECT id FROM ${sqlTable} WHERE type::text='assisted_pull_up_dip'`);
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
      await rejectBoth('existing assisted_pull_up_dip under another group must fail');
      await ds.query(`UPDATE ${sqlTable} SET equipment_group_id=$1,name='Synthetic unexpected name' WHERE id=$2`, [machines, id]);
      await rejectBoth('existing assisted_pull_up_dip with a different stored name must fail');
      await ds.query(`UPDATE ${sqlTable} SET name=$1 WHERE id=$2`, [equipmentName, id]);
      const duplicate = randomUUID();
      await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,'Synthetic duplicate','assisted_pull_up_dip',$2)`, [duplicate, machines]);
      await rejectBoth('duplicate assisted_pull_up_dip type must fail');
      for (const otherType of [null, 'pull_up_bar']) {
        await ds.query(`UPDATE ${sqlTable} SET type=$1,name=$2 WHERE id=$3`, [otherType, ` ${equipmentName.toUpperCase()} `, duplicate]);
        await rejectBoth('normalized name under another or NULL type must fail');
      }
      await ds.query(`DELETE FROM ${sqlTable} WHERE id=$1`, [duplicate]);
      for (const column of ['created_at', 'updated_at']) {
        await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN ${column} DROP NOT NULL`);
        const [{value}] = await ds.query(`SELECT ${column} AS value FROM ${sqlTable} WHERE id=$1`, [id]);
        await ds.query(`UPDATE ${sqlTable} SET ${column}=NULL WHERE id=$1`, [id]);
        await rejectBoth('existing assisted_pull_up_dip with a missing timestamp must fail');
        await ds.query(`UPDATE ${sqlTable} SET ${column}=$1 WHERE id=$2`, [value, id]);
        await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN ${column} SET NOT NULL`);
      }
      await ds.query(`DELETE FROM ${groupTable} WHERE id=$1`, [other]);
      same(await snapshot(), baseline, 'conflict fixtures must restore the exact original catalog');
    });

    await runCase('assisted pull-up/dip SQL requires a verified schema and refuses unexpected enum consumers', async () => {
      for (const sql of [preflightSql, enumSql, dataSql]) {
        await rejectUnchanged(sql, 'missing schema must fail', '');
        await rejectUnchanged(sql, 'unknown schema must fail', 'grippo_missing_assisted_pull_up_dip_schema');
      }
      const before = await labels();
      for (const consumerType of [enumType, `${enumType}[]`]) {
        await ds.query(`CREATE TABLE ${schema}.unexpected_consumer (type ${consumerType})`);
        try {
          for (const sql of [preflightSql, enumSql, dataSql]) {
            await rejectUnchanged(sql, 'unexpected direct or array enum consumer must require explicit review');
          }
          same(await labels(), before, 'unexpected consumers must not change the enum');
        } finally { await ds.query(`DROP TABLE ${schema}.unexpected_consumer`); }
      }
      await ds.query(`ALTER TABLE ${sqlTable} RENAME COLUMN type TO legacy_type`);
      try {
        for (const sql of [preflightSql, enumSql, dataSql]) {
          await rejectUnchanged(sql, 'missing enum type column must require explicit review');
        }
      } finally { await ds.query(`ALTER TABLE ${sqlTable} RENAME COLUMN legacy_type TO type`); }
      await ds.query(`ALTER TABLE ${sqlTable} DROP CONSTRAINT equipments_equipment_group_id_fkey`);
      await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN equipment_group_id TYPE text USING equipment_group_id::text`);
      try {
        for (const sql of [preflightSql, dataSql]) {
          await rejectUnchanged(sql, 'non-UUID equipment group reference must require explicit review');
        }
      } finally {
        await ds.query(`ALTER TABLE ${sqlTable} ALTER COLUMN equipment_group_id TYPE uuid USING equipment_group_id::uuid`);
        await ds.query(`ALTER TABLE ${sqlTable} ADD FOREIGN KEY (equipment_group_id) REFERENCES ${groupTable}(id)`);
      }
      await ds.query(`ALTER TYPE ${enumType} RENAME VALUE 'pull_up_bar' TO 'synthetic_missing_bar'`);
      try {
        for (const sql of [preflightSql, enumSql, dataSql]) {
          await rejectUnchanged(sql, 'missing expected legacy labels must require explicit review');
        }
      } finally { await ds.query(`ALTER TYPE ${enumType} RENAME VALUE 'synthetic_missing_bar' TO 'pull_up_bar'`); }
      same(await labels(), before, 'schema conflict fixtures must restore all labels and order');
    });

    await runCase('concurrent identical assisted pull-up/dip publications observe the committed row after waiting despite repeatable-read defaults', async () => {
      await concurrentPublication(equipmentName);
    });

    await runCase('assisted pull-up/dip publication rejects a concurrent conflicting-name writer without replacing its UUID', async () => {
      await concurrentPublication('Synthetic competing assisted machine');
    });

    await runCase('assisted pull-up/dip service preserves all legacy equipment and refs while UUID exclusions distinguish bars and assistance', async () => {
      const repo = ds.getRepository(E.EquipmentGroupsEntity);
      const groupsByType = {};
      for (const type of ['machines', 'body_weight', 'free_weight']) {
        groupsByType[type] = await repo.save({name: `Synthetic ${type}`, type});
      }
      const example = await seedExample();
      const identity = await seedUser();
      try {
        const old = [];
        for (const [type, groupType] of [
          ['pull_up_bar', 'body_weight'], ['dip_bars', 'body_weight'],
          ['butterfly', 'machines'], ['butterfly_forearm', 'machines'], ['kettlebells', 'free_weight'],
        ]) {
          old.push(await ds.getRepository(E.EquipmentsEntity).save({
            name: `Synthetic ${type}`, type, equipmentGroup: groupsByType[groupType],
          }));
        }
        for (const equipment of old) {
          await ds.getRepository(E.ExerciseExamplesEquipmentsEntity).save({exerciseExampleId: example.id, equipmentId: equipment.id});
        }
        const users = ctx.services.UsersService;
        await users.updateExcludedEquipments(identity.user, [old[0].id, old[1].id]);
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
        same(await relatedRows(), before, 'publication must preserve all legacy equipment UUIDs, timestamps, exercise refs and exclusions');
        const groups = await ctx.services.EquipmentsService.getEquipments();
        const parent = groups.find(item => item.id === groupsByType.machines.id);
        const entries = groups.flatMap(item => item.equipments).filter(item => item.type === 'assisted_pull_up_dip');
        assert.equal(entries.length, 1, 'service must return exactly one assisted_pull_up_dip entry');
        const added = entries[0];
        assert(parent.type === 'machines' && parent.equipments.some(item => item.id === added.id)
          && added.equipmentGroupId === parent.id, 'assisted equipment group ID must equal its machines parent');
        assert(!old.some(item => item.id === added.id), 'assisted equipment must have its own server UUID');
        same(Object.keys(added).sort(), ['id','name','type','equipmentGroupId','createdAt','updatedAt'].sort(), 'public equipment response shape must stay unchanged');
        assert(added.name === equipmentName && added.createdAt instanceof Date && added.updatedAt instanceof Date,
          'all required response fields must be populated');
        const publicIds = groups.flatMap(item => item.equipments).map(item => item.id);
        assert(old.every(item => publicIds.includes(item.id)), 'every previous equipment must remain publicly selectable');
        await users.updateExcludedEquipments(identity.user, [old[0].id, old[1].id, added.id]);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id).sort(), [old[0].id, old[1].id, added.id].sort(),
          'pull-up bar, dip bars and assisted equipment must be independently excludable');
        await users.updateExcludedEquipments(identity.user, [old[1].id, added.id]);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id).sort(), [old[1].id, added.id].sort(),
          'removing the pull-up bar exclusion must preserve dip bars and assisted equipment');
        await users.updateExcludedEquipments(identity.user, [added.id]);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id), [added.id],
          'removing both bar exclusions must preserve assisted equipment');
      } finally {
        for (const group of Object.values(groupsByType)) await repo.delete(group.id);
      }
    });
  } finally {
    await ds.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  }
}

module.exports = {runAssistedPullUpDipCases, expectedCases: 8};
