DO $$
DECLARE
  rec RECORD;
  v_max BIGINT;
BEGIN
  FOR rec IN
    SELECT
      n.nspname  AS schema_name,
      c.relname  AS table_name,
      a.attname  AS column_name,
      s.relname  AS sequence_name,
      format('%I.%I', n.nspname, c.relname) AS fq_table,
      format('%I.%I', sn.nspname, s.relname) AS fq_sequence,
      ps.min_value,
      ps.max_value
    FROM pg_class s
    JOIN pg_namespace sn ON sn.oid = s.relnamespace
    JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
    JOIN pg_class c ON c.oid = d.refobjid AND c.relkind = 'r'
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.refobjsubid
    JOIN pg_sequences ps
      ON ps.schemaname = sn.nspname AND ps.sequencename = s.relname
    WHERE s.relkind = 'S'
      AND n.nspname NOT IN (
        'pg_catalog','information_schema',
        'auth','storage','extensions',
        'graphql','realtime','vault','pgbouncer'
      )
  LOOP
    -- MAX(id) de la columna (si no hay filas, 0)
    EXECUTE format('SELECT COALESCE(MAX(%I),0) FROM %s', rec.column_name, rec.fq_table)
      INTO v_max;

    IF v_max <= 0 THEN
      -- Tabla vacía: dejar la secuencia en su mínimo; próximo nextval() = min_value
      EXECUTE format('SELECT pg_catalog.setval(%L, %s, false)', rec.fq_sequence, rec.min_value);
      RAISE NOTICE 'Secuencia % inicializada (tabla vacía) a min=% (nextval=%)',
        rec.fq_sequence, rec.min_value, rec.min_value;
    ELSIF v_max >= rec.max_value THEN
      -- Raro: se alcanzó el max de la secuencia
      RAISE WARNING 'Secuencia % no puede ajustarse: MAX(id)=% >= max_value=%',
        rec.fq_sequence, v_max, rec.max_value;
    ELSE
      -- Tabla con datos: próximo será MAX(id)+1
      EXECUTE format('SELECT pg_catalog.setval(%L, %s, true)', rec.fq_sequence, v_max);
      RAISE NOTICE 'Secuencia % sincronizada a % (nextval=%)',
        rec.fq_sequence, v_max, v_max+1;
    END IF;
  END LOOP;
END$$;
