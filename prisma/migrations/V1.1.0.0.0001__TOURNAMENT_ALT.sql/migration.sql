DO $$
BEGIN
    -- Verificar si start_date existe y no es DATE
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tournament' 
        AND column_name = 'start_date' 
        AND data_type != 'date'
        AND table_schema = 'carm'
    ) THEN
        -- Convertir start_date a DATE si no lo es
        ALTER TABLE carm.tournament 
        ALTER COLUMN start_date TYPE DATE 
        USING start_date::DATE;
        
        RAISE NOTICE 'start_date convertido a DATE';
    ELSE
        RAISE NOTICE 'start_date ya es DATE o no existe';
    END IF;

    -- Verificar si end_date existe y no es DATE
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tournament' 
        AND column_name = 'end_date' 
        AND data_type != 'date'
        AND table_schema = 'carm'
    ) THEN
        -- Convertir end_date a DATE si no lo es
        ALTER TABLE carm.tournament 
        ALTER COLUMN end_date TYPE DATE 
        USING end_date::DATE;
        
        RAISE NOTICE 'end_date convertido a DATE';
    ELSE
        RAISE NOTICE 'end_date ya es DATE o no existe';
    END IF;
END $$;
