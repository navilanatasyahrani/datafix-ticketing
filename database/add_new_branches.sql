-- ============================================
-- ADD NEW BRANCHES
-- ============================================
-- Script to add new branch options to the Datafix Ticketing System
-- Run this in Supabase SQL Editor

-- Insert new branches (only if they don't already exist)
INSERT INTO public.m_branches (name, is_active)
SELECT 'Office : Jabodetabek', true
WHERE NOT EXISTS (SELECT 1 FROM public.m_branches WHERE name = 'Office : Jabodetabek')
UNION ALL
SELECT 'Produksi Jabodetabek', true
WHERE NOT EXISTS (SELECT 1 FROM public.m_branches WHERE name = 'Produksi Jabodetabek')
UNION ALL
SELECT 'Pusat Distribusi : Jabodetabek', true
WHERE NOT EXISTS (SELECT 1 FROM public.m_branches WHERE name = 'Pusat Distribusi : Jabodetabek')
UNION ALL
SELECT 'Office : Pontianak', true
WHERE NOT EXISTS (SELECT 1 FROM public.m_branches WHERE name = 'Office : Pontianak');

-- Verify the new branches were added
SELECT id, name, is_active, created_at 
FROM public.m_branches 
WHERE name IN (
    'Office : Jabodetabek',
    'Produksi Jabodetabek',
    'Pusat Distribusi : Jabodetabek',
    'Office : Pontianak'
)
ORDER BY name;
