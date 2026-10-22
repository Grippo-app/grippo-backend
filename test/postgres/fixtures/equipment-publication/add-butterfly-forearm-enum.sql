-- Separate, explicitly approved schema operation; psql -v ON_ERROR_STOP=1.
-- First SET grippo.catalog_schema to the verified schema in this session.
-- Run this file alone: its COMMIT must precede the equipment data operation.
-- Never use synchronize or recreate an existing enum for this transition.
-- Do not wrap in an outer transaction. Refresh metadata after a lock wait,
-- even when the session default is REPEATABLE READ.
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
    IF NOT EXISTS (SELECT FROM pg_enum WHERE enumtypid = enum_oid AND enumlabel = 'butterfly')
        OR NOT EXISTS (SELECT FROM pg_enum WHERE enumtypid = enum_oid AND enumlabel = 'butterfly_reverse') THEN
        RAISE EXCEPTION 'Expected existing butterfly enum labels are missing';
    END IF;
    SELECT count(*) INTO consumers FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
    WHERE a.atttypid = enum_oid AND a.attnum > 0 AND NOT a.attisdropped AND c.relkind IN ('r','p');
    IF consumers <> 1 THEN RAISE EXCEPTION 'Unexpected equipment enum consumers; review schema first'; END IF;

    EXECUTE format('ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L', enum_schema, enum_name, 'butterfly_forearm');
END
$equipment_enum$;
COMMIT;
