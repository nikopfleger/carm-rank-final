-- Migration: Fix updated_at to nullable (IDEMPOTENT)
-- This migration:
-- 1. Changes updated_at from NOT NULL to NULL in all tables (if not already nullable)
-- 2. Sets updated_at to NULL in all existing records (if not already null)

-- Step 1: Change updated_at column from NOT NULL to NULL (idempotent)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- Loop through all tables that have updated_at column with NOT NULL constraint
    FOR table_name IN 
        SELECT DISTINCT t.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name
        WHERE c.column_name = 'updated_at' 
        AND c.is_nullable = 'NO'
        AND t.table_schema = 'carm'
    LOOP
        EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at DROP NOT NULL', table_name);
        RAISE NOTICE 'Changed updated_at to nullable in table: %', table_name;
    END LOOP;
END $$;

-- Step 2: Set updated_at to NULL in all existing records (idempotent)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- Loop through all tables that have updated_at column
    FOR table_name IN 
        SELECT DISTINCT t.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name
        WHERE c.column_name = 'updated_at' 
        AND t.table_schema = 'carm'
    LOOP
        EXECUTE format('UPDATE %I SET updated_at = NULL WHERE updated_at IS NOT NULL', table_name);
        RAISE NOTICE 'Set updated_at to NULL in table: %', table_name;
    END LOOP;
END $$;
