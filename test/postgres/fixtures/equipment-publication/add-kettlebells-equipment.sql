-- Prepared only: separate, explicitly approved catalog publication; psql ON_ERROR_STOP=1.
-- Requires committed enum SQL and confirmed compatibility of supported clients.
-- First SET grippo.catalog_schema AND grippo.kettlebells_name in this session.
-- Name has NO default: obtain explicit agreement; mobile translations are not it.
-- Run alone without an outer transaction/psql -1. No UPDATE/DELETE or exercise refs.
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $equipment_data$
DECLARE
    catalog_schema text := current_setting('grippo.catalog_schema', true);
    equipment_name text := current_setting('grippo.kettlebells_name', true);
    equipment_table regclass;
    group_table regclass;
    enum_oid oid;
    enum_schema name;
    enum_name name;
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
    IF equipment_name IS NULL OR equipment_name !~ '[^[:space:]]'
        OR equipment_name <> btrim(equipment_name) THEN
        RAISE EXCEPTION 'Set grippo.kettlebells_name to the explicitly agreed nonblank, trimmed server name first';
    END IF;
    equipment_table := to_regclass(format('%I.equipments', catalog_schema));
    group_table := to_regclass(format('%I.equipment_groups', catalog_schema));
    IF equipment_table IS NULL OR group_table IS NULL OR (
        SELECT count(*) FROM pg_class WHERE oid IN (equipment_table, group_table) AND relkind = 'r'
    ) <> 2 THEN RAISE EXCEPTION 'Expected equipment catalog tables are missing'; END IF;

    -- Fixed lock order also serializes absent-row checks and other catalog writers.
    -- Subsequent statements use fresh READ COMMITTED snapshots after any wait.
    EXECUTE format('LOCK TABLE %s, %s IN SHARE ROW EXCLUSIVE MODE', group_table, equipment_table);
    SELECT t.oid, n.nspname, t.typname INTO enum_oid, enum_schema, enum_name
    FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE a.attrelid = equipment_table AND a.attname = 'type'
      AND a.attnum > 0 AND NOT a.attisdropped AND t.typtype = 'e';
    IF enum_oid IS NULL OR NOT EXISTS (
        SELECT FROM pg_enum WHERE enumtypid = enum_oid AND enumlabel = 'kettlebells'
    ) THEN RAISE EXCEPTION 'Commit the verified kettlebells enum operation first'; END IF;

    EXECUTE format('SELECT array_agg(id ORDER BY id) FROM %s WHERE type::text = %L', group_table, 'free_weight')
        INTO free_weight_ids;
    IF coalesce(cardinality(free_weight_ids), 0) <> 1 THEN
        RAISE EXCEPTION 'Expected exactly one free_weight equipment group';
    END IF;
    EXECUTE format('SELECT count(*) FROM %s WHERE type::text = %L', equipment_table, 'kettlebells') INTO existing_count;
    IF existing_count > 1 THEN RAISE EXCEPTION 'Duplicate kettlebells equipment; resolve explicitly'; END IF;
    IF existing_count = 1 THEN
        EXECUTE format('SELECT id, equipment_group_id, name, created_at, updated_at FROM %s WHERE type::text = %L', equipment_table, 'kettlebells')
            INTO existing_id, existing_group_id, existing_name, existing_created_at, existing_updated_at;
        IF existing_id IS NULL OR existing_group_id IS DISTINCT FROM free_weight_ids[1]
            OR existing_name IS DISTINCT FROM equipment_name
            OR existing_created_at IS NULL OR existing_updated_at IS NULL THEN
            RAISE EXCEPTION 'Existing kettlebells equipment conflicts with the confirmed contract';
        END IF;
    END IF;
    -- An earlier import under another/NULL type requires an explicit resolution.
    EXECUTE format('SELECT count(*) FROM %s WHERE lower(btrim(name)) = lower(btrim($1)) AND id IS DISTINCT FROM $2', equipment_table)
        INTO existing_count USING equipment_name, existing_id;
    IF existing_count <> 0 THEN RAISE EXCEPTION 'Equipment name already belongs to another record; resolve explicitly'; END IF;
    IF existing_id IS NULL THEN
        EXECUTE format('INSERT INTO %s (id, name, type, equipment_group_id, created_at, updated_at)
            VALUES (pg_catalog.gen_random_uuid(), $1, %L::%I.%I, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            equipment_table, 'kettlebells', enum_schema, enum_name)
            USING equipment_name, free_weight_ids[1];
    END IF;
END
$equipment_data$;
COMMIT;
