-- ============================================
-- Migration: Add new columns, enums, and tables
-- Datafix Ticketing System
-- Date: 2026-02-11
-- ============================================

-- 1. Create m_regions table (if not exists)
CREATE TABLE IF NOT EXISTS m_regions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    region_name text NOT NULL,
    region_code int4
);

-- Enable RLS on m_regions
ALTER TABLE m_regions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read regions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'm_regions' AND policyname = 'Regions are viewable by authenticated users') THEN
        CREATE POLICY "Regions are viewable by authenticated users"
            ON m_regions FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

-- 2. Add region_id to profiles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'region_id') THEN
        ALTER TABLE profiles ADD COLUMN region_id uuid REFERENCES m_regions(id);
    END IF;
END $$;

-- 3. Add region_id to m_branches (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'm_branches' AND column_name = 'region_id') THEN
        ALTER TABLE m_branches ADD COLUMN region_id uuid REFERENCES m_regions(id);
    END IF;
END $$;

-- 4. Add new columns to datafix_tickets
DO $$
BEGIN
    -- origin_region_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'origin_region_id') THEN
        ALTER TABLE datafix_tickets ADD COLUMN origin_region_id uuid REFERENCES m_regions(id);
    END IF;

    -- target_team (text, not enum for simplicity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'target_team') THEN
        ALTER TABLE datafix_tickets ADD COLUMN target_team text;
    END IF;

    -- target_region_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'target_region_id') THEN
        ALTER TABLE datafix_tickets ADD COLUMN target_region_id uuid REFERENCES m_regions(id);
    END IF;

    -- stage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'stage') THEN
        ALTER TABLE datafix_tickets ADD COLUMN stage text;
    END IF;

    -- triaged_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'triaged_by') THEN
        ALTER TABLE datafix_tickets ADD COLUMN triaged_by uuid;
    END IF;

    -- triaged_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'triaged_at') THEN
        ALTER TABLE datafix_tickets ADD COLUMN triaged_at timestamptz;
    END IF;

    -- current_queue (default 'INITIAL')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'current_queue') THEN
        ALTER TABLE datafix_tickets ADD COLUMN current_queue text NOT NULL DEFAULT 'INITIAL';
    END IF;

    -- redirected_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'redirected_by') THEN
        ALTER TABLE datafix_tickets ADD COLUMN redirected_by uuid;
    END IF;

    -- redirected_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datafix_tickets' AND column_name = 'redirected_at') THEN
        ALTER TABLE datafix_tickets ADD COLUMN redirected_at timestamptz;
    END IF;
END $$;

-- 5. Insert sample regions (if table is empty)
INSERT INTO m_regions (region_name, region_code)
SELECT * FROM (VALUES
    ('Region 1 - Jakarta', 1),
    ('Region 2 - Jawa Barat', 2),
    ('Region 3 - Jawa Tengah', 3),
    ('Region 4 - Jawa Timur', 4),
    ('Region 5 - Sumatera', 5)
) AS v(region_name, region_code)
WHERE NOT EXISTS (SELECT 1 FROM m_regions LIMIT 1);

-- 6. Verify everything
SELECT 'Columns in datafix_tickets:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'datafix_tickets' 
AND column_name IN ('origin_region_id', 'target_team', 'target_region_id', 'stage', 'triaged_by', 'triaged_at', 'current_queue', 'redirected_by', 'redirected_at')
ORDER BY column_name;

SELECT 'Foreign keys on datafix_tickets:' as info;
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'datafix_tickets' AND tc.constraint_type = 'FOREIGN KEY';
