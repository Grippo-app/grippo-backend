-- Historical equipment-publication regression fixture: read-only preflight.
-- Archived after confirmed publication/readback; retained for isolated PostgreSQL regression coverage.
-- Not an operational script; no live access is authorized by this fixture.
-- Uses explicit grippo.catalog_schema; optional grippo.landmine_name has no default.
-- Owner confirmed server name 'Landmine' on 2026-10-23; supplied explicitly.
-- Emits schema metadata/status only, never catalog rows/names/UUIDs.
-- Snapshot checks are repeated inside the data publication transaction.
-- Schema/enum metadata and persistent UUIDs are discovered, never inferred.
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $equipment_preflight$
DECLARE
    catalog_schema text := current_setting('grippo.catalog_schema', true);
    equipment_name text := nullif(current_setting('grippo.landmine_name', true), '');
    equipment_table regclass;
    group_table regclass;
    enum_oid oid;
    enum_schema name;
    enum_name name;
    consumers integer;
    free_weight_ids uuid[];
    existing_count integer;
    existing_id uuid;
    existing_group_id uuid;
    existing_name text;
    existing_created_at timestamp;
    existing_updated_at timestamp;
BEGIN
    IF catalog_schema IS NULL OR catalog_schema = '' THEN
        RAISE EXCEPTION 'Set grippo.catalog_schema to the verified catalog schema first';
    END IF;
    IF equipment_name IS NOT NULL AND (equipment_name !~ '[^[:space:]]'
        OR equipment_name <> btrim(equipment_name)) THEN
        RAISE EXCEPTION 'Supplied server name must be nonblank and trimmed';
    END IF;
    equipment_table := to_regclass(format('%I.equipments', catalog_schema));
    group_table := to_regclass(format('%I.equipment_groups', catalog_schema));
    IF equipment_table IS NULL OR group_table IS NULL OR (
        SELECT count(*) FROM pg_class WHERE oid IN (equipment_table, group_table) AND relkind = 'r'
    ) <> 2 THEN RAISE EXCEPTION 'Expected equipment catalog tables are missing'; END IF;
    IF (SELECT count(*) FROM pg_attribute WHERE attnum > 0 AND NOT attisdropped
        AND atttypid = 'uuid'::regtype
        AND ((attrelid = equipment_table AND attname IN ('id', 'equipment_group_id'))
          OR (attrelid = group_table AND attname = 'id'))) <> 3 THEN
        RAISE EXCEPTION 'Expected UUID equipment and group identities';
    END IF;
    IF (SELECT count(*) FROM pg_attribute WHERE attrelid = equipment_table
        AND attnum > 0 AND NOT attisdropped AND
          ((attname = 'name' AND atttypid IN ('text'::regtype, 'varchar'::regtype))
           OR (attname IN ('created_at', 'updated_at') AND atttypid = 'timestamp'::regtype))) <> 3 THEN
        RAISE EXCEPTION 'Expected equipment name and timestamp columns';
    END IF;
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
    EXECUTE format('SELECT array_agg(id ORDER BY id) FROM %s WHERE type::text = %L', group_table, 'free_weight')
        INTO free_weight_ids;
    IF coalesce(cardinality(free_weight_ids), 0) <> 1 OR free_weight_ids[1] IS NULL THEN
        RAISE EXCEPTION 'Expected exactly one free_weight equipment group';
    END IF;
    EXECUTE format('SELECT count(*) FROM %s WHERE type::text = %L', equipment_table, 'landmine') INTO existing_count;
    IF existing_count > 1 THEN RAISE EXCEPTION 'Duplicate landmine equipment; resolve explicitly'; END IF;
    RAISE NOTICE 'Existing landmine catalog record present: %', existing_count = 1;
    IF existing_count = 1 THEN
        RAISE NOTICE 'Landmine is already published: assess current client compatibility before any further operation';
        EXECUTE format('SELECT id, equipment_group_id, name, created_at, updated_at FROM %s WHERE type::text = %L', equipment_table, 'landmine')
            INTO existing_id, existing_group_id, existing_name, existing_created_at, existing_updated_at;
        IF existing_id IS NULL OR existing_group_id IS DISTINCT FROM free_weight_ids[1]
            OR existing_name IS NULL OR existing_name !~ '[^[:space:]]'
            OR existing_name <> btrim(existing_name)
            OR (equipment_name IS NOT NULL AND existing_name IS DISTINCT FROM equipment_name)
            OR existing_created_at IS NULL OR existing_updated_at IS NULL THEN
            RAISE EXCEPTION 'Existing landmine equipment conflicts with the expected contract';
        END IF;
    END IF;
    -- Even without a supplied name, detect collisions with an existing row's stored name.
    EXECUTE format('SELECT count(*) FROM %s WHERE lower(btrim(name)) = lower(btrim($1)) AND id IS DISTINCT FROM $2', equipment_table)
        INTO existing_count USING coalesce(equipment_name, existing_name), existing_id;
    IF existing_count <> 0 THEN RAISE EXCEPTION 'Equipment name already belongs to another record; resolve explicitly'; END IF;
    IF equipment_name IS NULL THEN
        RAISE NOTICE 'Server name not supplied: agreed-name conflict checks are incomplete; any future data operation requires the explicitly confirmed name';
    END IF;
    RAISE NOTICE 'Verified equipment enum metadata: %.%; landmine label present: %', enum_schema, enum_name,
        EXISTS (SELECT FROM pg_enum WHERE enumtypid = enum_oid AND enumlabel = 'landmine');
    RAISE NOTICE 'Catalog checks passed for this snapshot only; recheck inside the approved publication transaction';
END
$equipment_preflight$;

-- Review actual columns/defaults/nullability, enum labels and column consumers.
SELECT c.relname AS table_name, a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS column_type, a.attnotnull,
       pg_get_expr(d.adbin, d.adrelid) AS column_default
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
WHERE n.nspname = current_setting('grippo.catalog_schema')
  AND c.relname IN ('equipments', 'equipment_groups') AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

SELECT n.nspname AS enum_schema, t.typname AS enum_name, e.enumlabel
FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid
JOIN pg_namespace n ON n.oid = t.typnamespace JOIN pg_enum e ON e.enumtypid = t.oid
WHERE a.attrelid = to_regclass(format('%I.equipments', current_setting('grippo.catalog_schema')))
  AND a.attname = 'type' AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY e.enumsortorder;

SELECT n.nspname AS consumer_schema, c.relname AS consumer_table, a.attname AS consumer_column
FROM pg_attribute source JOIN pg_type t ON t.oid = source.atttypid
JOIN pg_attribute a ON a.atttypid IN (t.oid, t.typarray)
JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE source.attrelid = to_regclass(format('%I.equipments', current_setting('grippo.catalog_schema')))
  AND source.attname = 'type' AND source.attnum > 0 AND NOT source.attisdropped
  AND a.attnum > 0 AND NOT a.attisdropped AND c.relkind IN ('r','p')
ORDER BY n.nspname, c.relname, a.attnum;

-- Constraint metadata includes incoming refs/exclusions, without their data.
SELECT source_ns.nspname AS source_schema, source.relname AS source_table,
       constraint_row.conname AS constraint_name, constraint_row.contype AS constraint_type,
       pg_get_constraintdef(constraint_row.oid) AS constraint_definition
FROM pg_constraint constraint_row
JOIN pg_class source ON source.oid = constraint_row.conrelid
JOIN pg_namespace source_ns ON source_ns.oid = source.relnamespace
WHERE constraint_row.conrelid IN (
    to_regclass(format('%I.equipments', current_setting('grippo.catalog_schema'))),
    to_regclass(format('%I.equipment_groups', current_setting('grippo.catalog_schema')))
) OR constraint_row.confrelid IN (
    to_regclass(format('%I.equipments', current_setting('grippo.catalog_schema'))),
    to_regclass(format('%I.equipment_groups', current_setting('grippo.catalog_schema')))
)
ORDER BY source_ns.nspname, source.relname, constraint_row.conname;
COMMIT;
