-- Separate, explicitly approved catalog publication; psql -v ON_ERROR_STOP=1.
-- First SET grippo.catalog_schema to the verified schema in this session.
-- Requires a committed enum operation AND confirmed client compatibility.
-- No UPDATE/DELETE: preserve existing equipment IDs, timestamps, refs and exclusions.
-- Do not wrap in an outer transaction. Conflict checks must get a fresh snapshot
-- after a lock wait, even when the session default is REPEATABLE READ.
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $equipment_data$
DECLARE
    catalog_schema text := current_setting('grippo.catalog_schema', true);
    equipment_table regclass;
    group_table regclass;
    enum_oid oid;
    enum_schema name;
    enum_name name;
    machine_ids uuid[];
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
    equipment_table := to_regclass(format('%I.equipments', catalog_schema));
    group_table := to_regclass(format('%I.equipment_groups', catalog_schema));
    IF equipment_table IS NULL OR group_table IS NULL OR (
        SELECT count(*) FROM pg_class WHERE oid IN (equipment_table, group_table) AND relkind = 'r'
    ) <> 2 THEN RAISE EXCEPTION 'Expected equipment catalog tables are missing'; END IF;

    -- Table locks serialize even absent-row checks; a row lock alone cannot do that.
    -- Use a fixed order, also excluding other writers while checking for conflicts.
    EXECUTE format('LOCK TABLE %s, %s IN SHARE ROW EXCLUSIVE MODE', group_table, equipment_table);
    SELECT t.oid, n.nspname, t.typname INTO enum_oid, enum_schema, enum_name
    FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE a.attrelid = equipment_table AND a.attname = 'type'
      AND a.attnum > 0 AND NOT a.attisdropped AND t.typtype = 'e';
    IF enum_oid IS NULL OR NOT EXISTS (
        SELECT FROM pg_enum WHERE enumtypid = enum_oid AND enumlabel = 'butterfly_forearm'
    ) THEN RAISE EXCEPTION 'Commit the verified butterfly_forearm enum operation first'; END IF;

    EXECUTE format('SELECT array_agg(id ORDER BY id) FROM %s WHERE type::text = %L', group_table, 'machines') INTO machine_ids;
    IF coalesce(cardinality(machine_ids), 0) <> 1 THEN
        RAISE EXCEPTION 'Expected exactly one machines equipment group';
    END IF;
    EXECUTE format('SELECT count(*) FROM %s WHERE type::text = %L', equipment_table, 'butterfly_forearm') INTO existing_count;
    IF existing_count > 1 THEN RAISE EXCEPTION 'Duplicate butterfly_forearm equipment; resolve explicitly'; END IF;
    IF existing_count = 1 THEN
        EXECUTE format('SELECT id, equipment_group_id, name, created_at, updated_at FROM %s WHERE type::text = %L', equipment_table, 'butterfly_forearm')
            INTO existing_id, existing_group_id, existing_name, existing_created_at, existing_updated_at;
        IF existing_group_id IS DISTINCT FROM machine_ids[1] OR existing_name IS NULL
            OR existing_created_at IS NULL OR existing_updated_at IS NULL
            OR existing_name NOT IN ('Pec Deck with Forearm Pads', 'Бабочка с упором на предплечья') THEN
            RAISE EXCEPTION 'Existing butterfly_forearm equipment conflicts with the confirmed contract';
        END IF;
    END IF;
    -- Catch a previous manual import under another or NULL type; do not silently
    -- rename it or create another record for the same agreed equipment name.
    IF EXISTS (
        SELECT FROM pg_attribute WHERE attrelid = equipment_table AND attname = 'id'
          AND atttypid <> 'uuid'::regtype AND NOT attisdropped
    ) THEN RAISE EXCEPTION 'Expected UUID equipment identities'; END IF;
    EXECUTE format('SELECT count(*) FROM %s WHERE name IN (%L, %L) AND id IS DISTINCT FROM $1',
        equipment_table, 'Pec Deck with Forearm Pads', 'Бабочка с упором на предплечья')
        INTO existing_count USING existing_id;
    IF existing_count <> 0 THEN RAISE EXCEPTION 'Equipment name already belongs to another record; resolve explicitly'; END IF;
    IF existing_id IS NULL THEN
        EXECUTE format('INSERT INTO %s (id, name, type, equipment_group_id, created_at, updated_at)
            VALUES (pg_catalog.gen_random_uuid(), %L, %L::%I.%I, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            equipment_table, 'Pec Deck with Forearm Pads', 'butterfly_forearm', enum_schema, enum_name)
            USING machine_ids[1];
    END IF;
END
$equipment_data$;
COMMIT;
