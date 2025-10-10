-- Temporarily disable RLS on course1 and course2 so the sync API can insert data
-- This allows the /api/sync-alpaca endpoint to update the tables

ALTER TABLE public.course1 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course2 DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('course1', 'course2');
