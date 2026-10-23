-- Historical equipment-publication regression fixture: additive enum step.
-- Archived after confirmed publication/readback; retained for isolated PostgreSQL regression coverage.
-- Not an operational script; no live access is authorized by this fixture.
-- Uses explicit grippo.catalog_schema and actual enum metadata.
-- Its COMMIT precedes data SQL; no surrounding transaction.
-- Enum extension is additive, without synchronize or enum recreation.
-- This fixture appends only the new equipment label;
-- it does not publish a row or alter any existing equipment types.
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $equipment_enum$
DECLARE
    catalog_schema text := current_setting('grippo.catalog_schema', true);
    equipment_table regclass;
    enum_oid oid;
    enum_schema name;
    enum_name name;
    consumers integer;
BEGIN
    IF catalog_schema IS NULL OR catalog_schema = '' THEN
        RAISE EXCEPTION 'Set grippo.catalog_schema to the verified catalog schema first';
    END IF;
    equipment_table := to_regclass(format('%I.equipments', catalog_schema));
    IF equipment_table IS NULL OR NOT EXISTS (
        SELECT FROM pg_class WHERE oid = equipment_table AND relkind = 'r'
    ) THEN RAISE EXCEPTION 'Expected equipments table is missing'; END IF;

    EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE', equipment_table);
    SELECT t.oid, n.nspname, t.typname INTO enum_oid, enum_schema, enum_name
    FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE a.attrelid = equipment_table AND a.attname = 'type'
      AND a.attnum > 0 AND NOT a.attisdropped AND t.typtype = 'e';
    IF enum_oid IS NULL THEN RAISE EXCEPTION 'Expected equipments.type enum is missing'; END IF;
    IF NOT EXISTS (SELECT FROM pg_enum WHERE enumtypid = enum_oid AND enumlabel = 'barbell')
        OR NOT EXISTS (SELECT FROM pg_enum WHERE enumtypid = enum_oid AND enumlabel = 'plate_loaded_row') THEN
        RAISE EXCEPTION 'Expected existing barbell and plate_loaded_row equipment enum labels are missing';
    END IF;
    SELECT count(*) INTO consumers FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE a.atttypid IN (enum_oid, (SELECT typarray FROM pg_type WHERE oid = enum_oid))
      AND a.attnum > 0 AND NOT a.attisdropped AND c.relkind IN ('r','p');
    IF consumers <> 1 THEN RAISE EXCEPTION 'Unexpected equipment enum consumers; review schema first'; END IF;

    EXECUTE format('ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L', enum_schema, enum_name, 'landmine');
END
$equipment_enum$;
COMMIT;
