DO $$
DECLARE
    seq_name TEXT;
    table_name TEXT;
    max_id INTEGER;
    current_val INTEGER;
BEGIN
    -- Loop through all sequences
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'carm'
        AND sequence_name LIKE '%_id_seq'
    LOOP
        -- Extract table name from sequence name (remove _id_seq suffix)
        table_name := replace(seq_name, '_id_seq', '');
        
        -- Get max ID from the corresponding table
        EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', table_name) INTO max_id;
        
        IF max_id > 0 THEN
            -- Get current sequence value
            EXECUTE format('SELECT last_value FROM %I', seq_name) INTO current_val;
            
            -- Only update if current value is less than max_id
            IF current_val < max_id THEN
                EXECUTE format('SELECT pg_catalog.setval(%L, %s, true)', seq_name, max_id);
                RAISE NOTICE 'Updated sequence % to start from %', seq_name, max_id;
            ELSE
                RAISE NOTICE 'Sequence % is already correct (current: %, max: %)', seq_name, current_val, max_id;
            END IF;
        ELSE
            RAISE NOTICE 'Table % is empty, skipping sequence %', table_name, seq_name;
        END IF;
    END LOOP;
END $$;
