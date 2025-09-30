DO $$
DECLARE
  sch text := current_schema();
  fqtn text := format('%I.%I', sch, 'tournament');
BEGIN
  -- Verificar si end_date existe y es NOT NULL
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = sch
      AND table_name   = 'tournament'
      AND column_name  = 'end_date'
      AND is_nullable  = 'NO'
  ) THEN
    -- Hacer end_date nullable
    EXECUTE format('ALTER TABLE %s ALTER COLUMN %I DROP NOT NULL', fqtn, 'end_date');
    RAISE NOTICE 'end_date convertido a nullable en %', fqtn;
  ELSE
    RAISE NOTICE 'end_date ya es nullable o no existe en %', fqtn;
  END IF;
END $$;
