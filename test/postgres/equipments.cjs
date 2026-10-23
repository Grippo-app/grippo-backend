'use strict';

// Extends the existing catalog suite; all connections belong to its disposable DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {runKettlebellCases, expectedCases: kettlebellCases} = require('./kettlebells.cjs');
const {runAssistedPullUpDipCases, expectedCases: assistedPullUpDipCases} = require('./assisted-pull-up-dip.cjs');
const {runPlateLoadedRowCases, expectedCases: plateLoadedRowCases} = require('./plate-loaded-row.cjs');
const {runBeltSquatCases, expectedCases: beltSquatCases} = require('./belt-squat.cjs');
const {runPlateLoadedSeatedDipCases, expectedCases: plateLoadedSeatedDipCases} = require('./plate-loaded-seated-dip.cjs');
const {runAnkleCuffCases, expectedCases: ankleCuffCases} = require('./ankle-cuff.cjs');
const {runPlateLoadedInclineChestPressCases, expectedCases: plateLoadedInclineChestPressCases} = require('./plate-loaded-incline-chest-press.cjs');
const {runVerticalLegPressCases, expectedCases: verticalLegPressCases} = require('./vertical-leg-press.cjs');
const {runLandmineCases, expectedCases: landmineCases} = require('./landmine.cjs');
const {runPlateLoadedDeclineChestPressCases, expectedCases: plateLoadedDeclineChestPressCases} = require('./plate-loaded-decline-chest-press.cjs');

async function runEquipmentCases(ctx, helpers) {
  const {ds, E} = ctx;
  const {runCase, same, outcome, code, bounded, blockedBy, seedExample, seedUser} = helpers;
  const enumSql = fs.readFileSync(path.resolve(__dirname, 'fixtures/equipment-publication/add-butterfly-forearm-enum.sql'), 'utf8');
  const dataSql = fs.readFileSync(path.resolve(__dirname, 'fixtures/equipment-publication/add-butterfly-forearm-equipment.sql'), 'utf8');
  const fixtureSchema = 'grippo_equipment_rehearsal';
  const sqlTable = `${fixtureSchema}.equipments`;
  const groupTable = `${fixtureSchema}.equipment_groups`;
  let machines;
  let oldEquipment;

  async function connection(schema = fixtureSchema) {
    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.query("SELECT set_config('grippo.catalog_schema', $1, false)", [schema]);
    return runner;
  }
  async function execute(sql, schema = fixtureSchema) {
    const runner = await connection(schema);
    try { return await runner.query(sql); }
    finally {
      // A failed multi-statement SQL file leaves BEGIN aborted; clear it before release.
      await runner.query('ROLLBACK');
      await runner.query("RESET grippo.catalog_schema");
      await runner.release();
    }
  }
  async function rows(table = sqlTable) {
    return ds.query(`SELECT to_jsonb(t) AS row FROM ${table} t ORDER BY id`);
  }

  try {
    await runCase('equipment schema operation discovers a nonstandard enum and preserves old rows across repeated expansion', async () => {
      await ds.query(`CREATE SCHEMA ${fixtureSchema}`);
      await ds.query(`CREATE TYPE ${fixtureSchema}."actual Equipment Kind" AS ENUM ('butterfly','butterfly_reverse')`);
      await ds.query(`CREATE TABLE ${groupTable} (id uuid PRIMARY KEY, name text NOT NULL, type text,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      await ds.query(`CREATE TABLE ${sqlTable} (id uuid PRIMARY KEY, name text NOT NULL,
        type ${fixtureSchema}."actual Equipment Kind", equipment_group_id uuid REFERENCES ${groupTable}(id),
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
      machines = randomUUID();
      await ds.query(`INSERT INTO ${groupTable}(id,name,type) VALUES ($1,'Synthetic machines','machines')`, [machines]);
      oldEquipment = [randomUUID(), randomUUID()];
      for (const [index, type] of ['butterfly', 'butterfly_reverse'].entries()) {
        await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,$2,$3,$4)`,
          [oldEquipment[index], `Synthetic ${type}`, type, machines]);
      }
      const before = await rows();
      const premature = await outcome(execute(dataSql));
      assert(!premature.ok, 'data operation must reject an enum that lacks the new value');
      await execute(enumSql);
      await execute(enumSql);
      const labels = await ds.query(`SELECT enumlabel FROM pg_enum
        WHERE enumtypid='${fixtureSchema}."actual Equipment Kind"'::regtype ORDER BY enumsortorder`);
      same(labels.map(row => row.enumlabel), ['butterfly', 'butterfly_reverse', 'butterfly_forearm'], 'expansion must only append the new label');
      same(await rows(), before, 'enum expansion must preserve all old rows, UUIDs and timestamps');
      assert.equal((await ds.query(`SELECT count(*)::int AS count FROM ${sqlTable} WHERE type::text='butterfly_forearm'`))[0].count, 0,
        'schema-only operation must not publish equipment');
    });

    await runCase('equipment data operation generates one UUID and repeats without changing either agreed name or timestamps', async () => {
      const before = await rows();
      await execute(dataSql);
      const after = await rows();
      const added = after.find(item => item.row.type === 'butterfly_forearm').row;
      assert.match(added.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      assert(!oldEquipment.includes(added.id) && added.equipment_group_id === machines, 'new equipment needs its own UUID in machines');
      assert.equal(added.name, 'Pec Deck with Forearm Pads');
      same(after.filter(item => item.row.type !== 'butterfly_forearm'), before, 'old equipment identities must remain byte-equivalent');
      await execute(dataSql);
      same(await rows(), after, 'repeat must preserve all UUIDs and timestamps');
      await ds.query(`UPDATE ${sqlTable} SET name=$1 WHERE id=$2`, ['Бабочка с упором на предплечья', added.id]);
      const russian = await rows();
      await execute(dataSql);
      same(await rows(), russian, 'correct existing Russian name must preserve its UUID and timestamps');
    });

    await runCase('equipment data operation rejects missing or duplicate groups and conflicting records atomically', async () => {
      const baseline = await rows();
      const [{id}] = await ds.query(`SELECT id FROM ${sqlTable} WHERE type::text='butterfly_forearm'`);
      await ds.query(`UPDATE ${groupTable} SET type=NULL WHERE id=$1`, [machines]);
      assert(!(await outcome(execute(dataSql))).ok, 'missing machines group must fail');
      await ds.query(`UPDATE ${groupTable} SET type='machines' WHERE id=$1`, [machines]);
      const extraGroup = randomUUID();
      await ds.query(`INSERT INTO ${groupTable}(id,name,type) VALUES ($1,'Synthetic duplicate group','machines')`, [extraGroup]);
      assert(!(await outcome(execute(dataSql))).ok, 'duplicate machines groups must fail');
      await ds.query(`UPDATE ${groupTable} SET type='other' WHERE id=$1`, [extraGroup]);
      await ds.query(`UPDATE ${sqlTable} SET equipment_group_id=$1 WHERE id=$2`, [extraGroup, id]);
      assert(!(await outcome(execute(dataSql))).ok, 'existing record in another group must fail');
      await ds.query(`UPDATE ${sqlTable} SET equipment_group_id=$1,name='Synthetic conflicting name' WHERE id=$2`, [machines, id]);
      assert(!(await outcome(execute(dataSql))).ok, 'unexpected existing name must require explicit resolution');
      await ds.query(`UPDATE ${sqlTable} SET name=$1 WHERE id=$2`, ['Бабочка с упором на предплечья', id]);
      const duplicate = randomUUID();
      await ds.query(`INSERT INTO ${sqlTable}(id,name,type,equipment_group_id) VALUES ($1,'Synthetic duplicate','butterfly_forearm',$2)`, [duplicate, machines]);
      assert(!(await outcome(execute(dataSql))).ok, 'duplicate type must fail');
      await ds.query(`UPDATE ${sqlTable} SET type=NULL,name='Pec Deck with Forearm Pads' WHERE id=$1`, [duplicate]);
      assert(!(await outcome(execute(dataSql))).ok, 'agreed name under another or NULL type must fail');
      await ds.query(`DELETE FROM ${sqlTable} WHERE id=$1`, [duplicate]);
      await ds.query(`DELETE FROM ${groupTable} WHERE id=$1`, [extraGroup]);
      same(await rows(), baseline, 'every rejected operation must leave previous equipment untouched');
    });

    await runCase('concurrent equipment publications override repeatable-read defaults and retain one server UUID after the catalog lock', async () => {
      await ds.query(`DELETE FROM ${sqlTable} WHERE type::text='butterfly_forearm'`);
      const first = await connection();
      const second = await connection();
      const [{pid: firstPid}] = await first.query('SELECT pg_backend_pid() AS pid');
      const [{pid: secondPid}] = await second.query('SELECT pg_backend_pid() AS pid');
      let pending;
      try {
        for (const runner of [first, second]) {
          await runner.query("SET default_transaction_isolation = 'repeatable read'");
        }
        // Execute the real file, holding only its final COMMIT to expose its lock.
        await first.query(dataSql.replace(/\nCOMMIT;\s*$/, '\n'));
        const [{id: firstId}] = await first.query(`SELECT id FROM ${sqlTable} WHERE type::text='butterfly_forearm'`);
        pending = outcome(second.query(dataSql));
        await blockedBy(secondPid, firstPid);
        await first.query('COMMIT');
        const result = await bounded(pending, 'concurrent equipment publication timed out');
        assert(result.ok, 'second publication must succeed as a no-op after waiting');
        const [{count}] = await ds.query(`SELECT count(*)::int AS count FROM ${sqlTable} WHERE type::text='butterfly_forearm'`);
        assert.equal(count, 1, 'concurrent publications must leave exactly one equipment');
        const [{id: finalId}] = await ds.query(`SELECT id FROM ${sqlTable} WHERE type::text='butterfly_forearm'`);
        assert.equal(finalId, firstId, 'waiting publication must preserve the UUID inserted by the first transaction');
      } finally {
        await first.query('ROLLBACK');
        if (pending) await bounded(pending, 'equipment lock cleanup timed out');
        await second.query('ROLLBACK');
        for (const runner of [first, second]) {
          await runner.query('RESET default_transaction_isolation');
          await runner.query('RESET grippo.catalog_schema');
          await runner.release();
        }
      }
    });

    await runCase('equipment SQL requires explicit existing schema and rejects a shared enum before schema writes', async () => {
      for (const sql of [enumSql, dataSql]) {
        assert(!(await outcome(execute(sql, ''))).ok, 'unset catalog schema must fail');
        assert(!(await outcome(execute(sql, 'grippo_missing_schema'))).ok, 'unknown catalog schema must fail');
      }
      await ds.query(`CREATE TABLE ${fixtureSchema}.unexpected_consumer (type ${fixtureSchema}."actual Equipment Kind")`);
      const result = await outcome(execute(enumSql));
      assert(!result.ok && code(result.error) === 'P0001', 'another table consuming the enum must require review');
      await ds.query(`DROP TABLE ${fixtureSchema}.unexpected_consumer`);
    });

    await runCase('equipment service exposes required fields and exclusions distinguish butterfly UUIDs without changing exercise refs', async () => {
      const group = await ds.getRepository(E.EquipmentGroupsEntity).save({name: 'Synthetic machines', type: 'machines'});
      const example = await seedExample();
      const identity = await seedUser();
      const old = [];
      try {
        for (const type of ['butterfly', 'butterfly_reverse']) {
          old.push(await ds.getRepository(E.EquipmentsEntity).save({name: `Synthetic ${type}`, type, equipmentGroup: group}));
        }
        await ds.getRepository(E.ExerciseExamplesEquipmentsEntity).save({exerciseExampleId: example.id, equipmentId: old[0].id});
        const users = ctx.services.UsersService;
        await users.updateExcludedEquipments(identity.user, [old[0].id]);
        const before = await Promise.all([
          ds.query('SELECT to_jsonb(t) AS row FROM equipments t WHERE id=ANY($1::uuid[]) ORDER BY id', [old.map(item => item.id)]),
          ds.query('SELECT to_jsonb(t) AS row FROM exercise_examples_equipments t WHERE exercise_example_id=$1 ORDER BY id', [example.id]),
          ds.query('SELECT to_jsonb(t) AS row FROM excluded_equipments t WHERE profile_id=$1 ORDER BY id', [identity.profile.id]),
        ]);
        await execute(enumSql, 'public');
        await execute(dataSql, 'public');
        await execute(dataSql, 'public');
        const after = await Promise.all([
          ds.query('SELECT to_jsonb(t) AS row FROM equipments t WHERE id=ANY($1::uuid[]) ORDER BY id', [old.map(item => item.id)]),
          ds.query('SELECT to_jsonb(t) AS row FROM exercise_examples_equipments t WHERE exercise_example_id=$1 ORDER BY id', [example.id]),
          ds.query('SELECT to_jsonb(t) AS row FROM excluded_equipments t WHERE profile_id=$1 ORDER BY id', [identity.profile.id]),
        ]);
        same(after, before, 'publication must preserve old equipment, exercise refs and existing exclusions');
        const groups = await ctx.services.EquipmentsService.getEquipments();
        const parent = groups.find(item => item.id === group.id);
        const entries = groups.flatMap(item => item.equipments).filter(item => item.type === 'butterfly_forearm');
        assert.equal(entries.length, 1, 'public service must return exactly one new equipment');
        const added = entries[0];
        assert(parent.equipments.some(item => item.id === added.id) && added.equipmentGroupId === parent.id, 'equipment group ID must match its parent');
        same(Object.keys(added).sort(), ['id','name','type','equipmentGroupId','createdAt','updatedAt'].sort(), 'response shape must remain unchanged');
        assert(added.createdAt instanceof Date && added.updatedAt instanceof Date && added.id && added.name, 'response fields must be populated');
        await users.updateExcludedEquipments(identity.user, [old[0].id, added.id]);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id).sort(), [old[0].id, added.id].sort(), 'old and new equipment must be independently excludable');
        await users.updateExcludedEquipments(identity.user, [added.id]);
        same((await users.getExcludedEquipments(identity.user)).map(item => item.id), [added.id], 'removing the old exclusion must preserve the new exclusion');
      } finally {
        await ds.getRepository(E.EquipmentGroupsEntity).delete(group.id);
      }
    });
  } finally {
    await ds.query(`DROP SCHEMA IF EXISTS ${fixtureSchema} CASCADE`);
  }
  await runKettlebellCases(ctx, helpers);
  await runAssistedPullUpDipCases(ctx, helpers);
  await runPlateLoadedRowCases(ctx, helpers);
  await runBeltSquatCases(ctx, helpers);
  await runPlateLoadedSeatedDipCases(ctx, helpers);
  await runAnkleCuffCases(ctx, helpers);
  await runPlateLoadedInclineChestPressCases(ctx, helpers);
  await runVerticalLegPressCases(ctx, helpers);
  await runLandmineCases(ctx, helpers);
  await runPlateLoadedDeclineChestPressCases(ctx, helpers);
}

module.exports = {runEquipmentCases, expectedCases: 6 + kettlebellCases + assistedPullUpDipCases + plateLoadedRowCases + beltSquatCases + plateLoadedSeatedDipCases + ankleCuffCases + plateLoadedInclineChestPressCases + verticalLegPressCases + landmineCases + plateLoadedDeclineChestPressCases};
