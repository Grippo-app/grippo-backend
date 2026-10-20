-- Separate, explicitly approved schema operation. Run with psql -v ON_ERROR_STOP=1.
-- This transaction must COMMIT before any pt-BR/pt-PT row is written.
-- Never run synchronize or recreate an existing enum for this transition.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.exercise_example_translations IN ACCESS EXCLUSIVE MODE;

DO $validation$
DECLARE
    labels text[];
    consumers integer;
BEGIN
    SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder) INTO labels
    FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE n.nspname = 'public' AND t.typname = 'supported_language_enum';
    IF labels IS NULL OR labels[1:3] <> ARRAY['en', 'ua', 'ru']::text[]
        OR cardinality(labels) <> cardinality(ARRAY(SELECT DISTINCT unnest(labels)))
        OR EXISTS (SELECT FROM unnest(labels) AS l WHERE l NOT IN ('en','ua','ru','pt-BR','pt-PT'))
        OR ('pt-PT' = ANY(labels) AND NOT ('pt-BR' = ANY(labels)))
        OR (array_position(labels, 'pt-BR') > array_position(labels, 'pt-PT')) THEN
        RAISE EXCEPTION 'Unsupported language enum shape; stop before schema changes';
    END IF;
    IF NOT EXISTS (
        SELECT FROM pg_attribute a
        WHERE a.attrelid = 'public.exercise_example_translations'::regclass
          AND a.attname = 'language' AND NOT a.attisdropped
          AND a.atttypid = 'public.supported_language_enum'::regtype
    ) THEN RAISE EXCEPTION 'Unexpected translation language column type'; END IF;
    SELECT count(*) INTO consumers FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE a.atttypid = 'public.supported_language_enum'::regtype
      AND NOT a.attisdropped AND a.attnum > 0 AND c.relkind IN ('r','p');
    IF consumers <> 1 THEN RAISE EXCEPTION 'Unexpected language enum consumers'; END IF;
    IF NOT EXISTS (
        SELECT FROM pg_constraint c
        WHERE c.conrelid = 'public.exercise_example_translations'::regclass
          AND c.conname = 'uq_exercise_example_translations_language'
          AND c.contype = 'u' AND NOT c.condeferrable AND c.convalidated
          AND c.conkey = ARRAY[
              (SELECT attnum FROM pg_attribute WHERE attrelid = c.conrelid AND attname = 'exercise_example_id'),
              (SELECT attnum FROM pg_attribute WHERE attrelid = c.conrelid AND attname = 'language')
          ]::smallint[]
    ) THEN RAISE EXCEPTION 'Expected translation pair UNIQUE is missing'; END IF;
END
$validation$;

ALTER TYPE public.supported_language_enum ADD VALUE IF NOT EXISTS 'pt-BR';
ALTER TYPE public.supported_language_enum ADD VALUE IF NOT EXISTS 'pt-PT';
COMMIT;
