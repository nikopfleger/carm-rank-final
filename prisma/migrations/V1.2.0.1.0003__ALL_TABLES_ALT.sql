-- Migra TODAS las PK(id int4) del esquema actual a BIGINT usando columna sombra "id2"
-- Crea y valida nuevas FKs hacia id2, luego hace swap (id2->id) y renombra FKs al nombre original.
-- Idempotente (omite lo ya hecho). No toca datos (solo copia valores), no regenera la PK (solo la reatacha al nuevo índice).
DO $$
DECLARE
  v_schema text := current_schema();
  -- Sufijos personalizables
  v_new_col_suffix text := '2';       -- id2 / player_id2
  v_old_col_suffix text := '_old';    -- id_old / player_id_old
  v_new_fk_suffix  text := '__newfk'; -- sufijo temporal de FKs nuevas
  v_idx_suffix     text := '_id2_uidx';

  r_parent RECORD;
  r_fk     RECORD;
  r_child  RECORD;

  -- Helpers
  FUNCTION col_exists(p_schema text, p_tbl text, p_col text) RETURNS boolean AS $f$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = p_schema AND table_name = p_tbl AND column_name = p_col
    );
  END;
  $f$ LANGUAGE plpgsql;

  FUNCTION idx_exists(p_schema text, p_idx text) RETURNS boolean AS $f$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=p_schema AND c.relname=p_idx AND c.relkind='i'
    );
  END;
  $f$ LANGUAGE plpgsql;

  FUNCTION fk_exists(p_schema text, p_tbl text, p_fk text) RETURNS boolean AS $f$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_class t ON t.oid=con.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE con.contype='f' AND n.nspname=p_schema AND t.relname=p_tbl AND con.conname=p_fk
    );
  END;
  $f$ LANGUAGE plpgsql;

BEGIN
  RAISE NOTICE 'Esquema objetivo: %', v_schema;

  ---------------------------------------------------------------------------
  -- 1) Construir lista de PADRES: tablas con PK simple "id int4"
  ---------------------------------------------------------------------------
  CREATE TEMP TABLE _parents ON COMMIT DROP AS
  SELECT
    n.nspname   AS schema_name,
    c.relname   AS table_name,
    con.conname AS pk_name
  FROM pg_constraint con
  JOIN pg_class c      ON c.oid=con.conrelid
  JOIN pg_namespace n  ON n.oid=c.relnamespace
  JOIN pg_index i      ON i.indrelid=c.oid AND i.indisprimary
  -- PK de 1 sola columna llamada 'id' y tipo int4
  WHERE con.contype='p'
    AND n.nspname = v_schema
    AND array_length(i.indkey,1)=1
    AND (SELECT attname FROM pg_attribute WHERE attrelid=c.oid AND attnum=i.indkey[1])='id'
    AND (SELECT atttypid FROM pg_attribute WHERE attrelid=c.oid AND attnum=i.indkey[1])='int4'::regtype;

  IF NOT EXISTS (SELECT 1 FROM _parents) THEN
    RAISE NOTICE 'No hay PK(id int4) para migrar en el esquema %.', v_schema;
    RETURN;
  END IF;

  ---------------------------------------------------------------------------
  -- 2) Construir tareas de FKs HIJAS que referencian esas PK(id)
  ---------------------------------------------------------------------------
  CREATE TEMP TABLE _fk_tasks ON COMMIT DROP AS
  SELECT
    con.oid                         AS con_oid,
    n_child.nspname                 AS child_schema,
    c_child.relname                 AS child_table,
    con.conname                     AS old_fk_name,
    pg_get_constraintdef(con.oid)  AS old_fk_def,
    n_parent.nspname                AS parent_schema,
    c_parent.relname                AS parent_table,
    attp.attname                    AS parent_col,  -- 'id'
    attc.attname                    AS child_col    -- ej 'player_id'
  FROM pg_constraint con
  JOIN pg_class     c_child  ON c_child.oid=con.conrelid
  JOIN pg_namespace n_child  ON n_child.oid=c_child.relnamespace
  JOIN pg_class     c_parent ON c_parent.oid=con.confrelid
  JOIN pg_namespace n_parent ON n_parent.oid=c_parent.relnamespace
  JOIN LATERAL unnest(con.conkey)  WITH ORDINALITY ck(k, pos) ON TRUE
  JOIN LATERAL unnest(con.confkey) WITH ORDINALITY pk(k, pos) ON pk.pos=ck.pos
  JOIN pg_attribute attc ON attc.attrelid=c_child.oid  AND attc.attnum=ck.k
  JOIN pg_attribute attp ON attp.attrelid=c_parent.oid AND attp.attnum=pk.k
  WHERE con.contype='f'
    AND n_parent.nspname=v_schema
    AND (c_parent.relname, con.conindid) IN (
      SELECT table_name, 0::oid FROM _parents  -- uso del set de padres
    )
    AND attp.attname='id';

  ---------------------------------------------------------------------------
  -- 3) Preparar PADRES: agregar id2 BIGINT, copiar, identity y unique idx
  ---------------------------------------------------------------------------
  FOR r_parent IN
    SELECT * FROM _parents ORDER BY table_name
  LOOP
    -- agregar id2 si no existe
    IF NOT col_exists(r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix) THEN
      EXECUTE format('ALTER TABLE %I.%I ADD COLUMN %I BIGINT',
        r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix);
      EXECUTE format('UPDATE %I.%I SET %I = id',
        r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix);
      EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET NOT NULL',
        r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix);
      -- identidad (sin default previo)
      EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I ADD GENERATED BY DEFAULT AS IDENTITY',
        r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix);
      -- setval al max + 1
      PERFORM setval(
        pg_get_serial_sequence(format('%I.%I', r_parent.schema_name, r_parent.table_name), 'id' || v_new_col_suffix),
        COALESCE( (SELECT MAX(x) FROM (
                    EXECUTE format('SELECT MAX(%I) FROM %I.%I', 'id' || v_new_col_suffix, r_parent.schema_name, r_parent.table_name)
                  ) s(x) ), 0 ) + 1,
        false
      );
      RAISE NOTICE 'Padre %.%: columna id2 creada y copiada', r_parent.schema_name, r_parent.table_name;
    ELSE
      RAISE NOTICE 'Padre %.%: columna id2 ya existía, se omite', r_parent.schema_name, r_parent.table_name;
    END IF;

    -- índice único para futura PK
    IF NOT idx_exists(r_parent.schema_name, r_parent.table_name || v_idx_suffix) THEN
      EXECUTE format('CREATE UNIQUE INDEX %I ON %I.%I(%I)',
        r_parent.table_name || v_idx_suffix, r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix);
      RAISE NOTICE 'Padre %.%: índice único id2 creado', r_parent.schema_name, r_parent.table_name;
    END IF;
  END LOOP;

  ---------------------------------------------------------------------------
  -- 4) Preparar HIJAS: columna sombra child_col2, copiar datos, nueva FK NOT VALID + VALIDATE
  ---------------------------------------------------------------------------
  FOR r_fk IN
    SELECT DISTINCT child_schema, child_table, old_fk_name, old_fk_def, parent_schema, parent_table, parent_col, child_col
    FROM _fk_tasks
    ORDER BY child_schema, child_table, old_fk_name
  LOOP
    -- nombre de columna hija sombra (ej: player_id2)
    PERFORM 1;
    IF NOT col_exists(r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_new_col_suffix) THEN
      EXECUTE format('ALTER TABLE %I.%I ADD COLUMN %I BIGINT',
        r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_new_col_suffix);
      EXECUTE format('UPDATE %I.%I SET %I = %I::BIGINT',
        r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_new_col_suffix, r_fk.child_col);
      RAISE NOTICE 'Hija %.%: columna %s creada y copiada',
        r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_new_col_suffix;
    END IF;

    -- índice auxiliar (no concurrently)
    IF NOT idx_exists(r_fk.child_schema, r_fk.child_table || '_' || r_fk.child_col || v_new_col_suffix || '_idx') THEN
      EXECUTE format('CREATE INDEX %I ON %I.%I(%I)',
        r_fk.child_table || '_' || r_fk.child_col || v_new_col_suffix || '_idx',
        r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_new_col_suffix);
    END IF;

    -- construir nueva definición FK reemplazando "(child_col) REFERENCES parent(id)"
    -- por "(child_col2) REFERENCES parent(id2)"
    -- Tomamos la definición original y cambiamos nombres de columnas y ref:
    -- old_fk_def suele ser como: FOREIGN KEY (child_col) REFERENCES parent_table(parent_col) ...
    -- hacemos replace simple y seguro usando format.
    -- nombre temporal de la nueva FK:
    DECLARE
      v_new_fk_name text := r_fk.old_fk_name || v_new_fk_suffix;
      v_new_fk_sql  text;
    BEGIN
      IF NOT fk_exists(r_fk.child_schema, r_fk.child_table, v_new_fk_name) THEN
        v_new_fk_sql := format(
          'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) NOT VALID',
          r_fk.child_schema, r_fk.child_table, v_new_fk_name,
          r_fk.child_col || v_new_col_suffix,
          r_fk.parent_schema, r_fk.parent_table, r_fk.parent_col || v_new_col_suffix
        );
        EXECUTE v_new_fk_sql;
        EXECUTE format('ALTER TABLE %I.%I VALIDATE CONSTRAINT %I',
                       r_fk.child_schema, r_fk.child_table, v_new_fk_name);
        RAISE NOTICE 'Hija %.%: nueva FK % agregada y validada',
          r_fk.child_schema, r_fk.child_table, v_new_fk_name;
      END IF;
    END;
  END LOOP;

  ---------------------------------------------------------------------------
  -- 5) CUTOVER (corte breve): cambiar PK a id2, renombrar columnas y FKs
  ---------------------------------------------------------------------------
  FOR r_parent IN
    SELECT * FROM _parents ORDER BY table_name
  LOOP
    -- 5.1 Reatachar PK a índice id2 (drop PK viejo, add usando índice)
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r_parent.schema_name, r_parent.table_name, r_parent.pk_name);
    EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I PRIMARY KEY USING INDEX %I',
      r_parent.schema_name, r_parent.table_name, r_parent.pk_name, r_parent.table_name || v_idx_suffix);

    -- 5.2 Para cada hija del padre actual: dropear FK vieja y renombrar la nueva al nombre original
    FOR r_fk IN
      SELECT DISTINCT child_schema, child_table, old_fk_name
      FROM _fk_tasks
      WHERE parent_schema=r_parent.schema_name AND parent_table=r_parent.table_name
    LOOP
      IF fk_exists(r_fk.child_schema, r_fk.child_table, r_fk.old_fk_name) THEN
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
          r_fk.child_schema, r_fk.child_table, r_fk.old_fk_name);
      END IF;
      IF fk_exists(r_fk.child_schema, r_fk.child_table, r_fk.old_fk_name || v_new_fk_suffix) THEN
        EXECUTE format('ALTER TABLE %I.%I RENAME CONSTRAINT %I TO %I',
          r_fk.child_schema, r_fk.child_table,
          r_fk.old_fk_name || v_new_fk_suffix, r_fk.old_fk_name);
      END IF;
    END LOOP;

    -- 5.3 Renombrar columnas padre: id -> id_old, id2 -> id
    IF col_exists(r_parent.schema_name, r_parent.table_name, 'id') THEN
      -- evitar colisión si ya existe id_old
      IF col_exists(r_parent.schema_name, r_parent.table_name, 'id' || v_old_col_suffix) THEN
        EXECUTE format('ALTER TABLE %I.%I DROP COLUMN %I',
          r_parent.schema_name, r_parent.table_name, 'id' || v_old_col_suffix);
      END IF;
      EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN %I TO %I',
        r_parent.schema_name, r_parent.table_name, 'id', 'id' || v_old_col_suffix);
    END IF;
    IF col_exists(r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix) THEN
      EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN %I TO %I',
        r_parent.schema_name, r_parent.table_name, 'id' || v_new_col_suffix, 'id');
    END IF;

    -- 5.4 Renombrar columnas hijas: child_col -> child_col_old ; child_col2 -> child_col
    FOR r_fk IN
      SELECT DISTINCT child_schema, child_table, child_col
      FROM _fk_tasks
      WHERE parent_schema=r_parent.schema_name AND parent_table=r_parent.table_name
    LOOP
      IF col_exists(r_fk.child_schema, r_fk.child_table, r_fk.child_col) THEN
        IF col_exists(r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_old_col_suffix) THEN
          EXECUTE format('ALTER TABLE %I.%I DROP COLUMN %I',
            r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_old_col_suffix);
        END IF;
        EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN %I TO %I',
          r_fk.child_schema, r_fk.child_table, r_fk.child_col, r_fk.child_col || v_old_col_suffix);
      END IF;
      IF col_exists(r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_new_col_suffix) THEN
        EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN %I TO %I',
          r_fk.child_schema, r_fk.child_table, r_fk.child_col || v_new_col_suffix, r_fk.child_col);
      END IF;
    END LOOP;

  END LOOP;

  RAISE NOTICE 'Migración completada en esquema %', v_schema;
END $$;
