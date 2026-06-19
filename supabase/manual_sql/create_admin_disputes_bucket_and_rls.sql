-- Create a private storage bucket for admin dispute evidence and example RLS
-- Run this in the Supabase SQL editor for your project.

-- 1) Create a private bucket (returns JSON). Adjust name if needed.
-- Note: The "storage" SQL API is provided by Supabase. If it fails, create the bucket via the Supabase UI.
-- NOTE: Some Supabase projects do not expose a SQL function to create storage buckets.
-- The SQL function `storage.create_bucket` may not be available (error 42883).
-- Create the bucket using one of these options instead:

-- Option A — Supabase UI (recommended):
-- 1. Open your Supabase project -> Storage -> Buckets -> New bucket
-- 2. Name: `admin-disputes`, Public: OFF

-- Option B — Supabase JS client example (run from a trusted admin environment):
-- ```js
-- import { createClient } from '@supabase/supabase-js'
-- const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
-- const { data, error } = await supabase.storage.createBucket('admin-disputes', { public: false })
-- if (error) console.error(error)
-- else console.log('Bucket created', data)
-- ```

-- Option C — Supabase REST/Management API: use the appropriate API call with your service role key.

-- After creating the bucket, continue with the RLS policy SQL below.

-- 2) Example: Add a column to the dispute_evidence table to store storage path if not present
-- (skip if your schema already stores path/url/metadata)
-- ALTER TABLE public.dispute_evidence ADD COLUMN IF NOT EXISTS storage_path text;

-- 3) Example RLS policy: allow only admin users (using public.is_admin_user()) to insert/select
-- Ensure the helper function public.is_admin_user() exists in your DB; adjust predicate as necessary.

-- Enable RLS on the table (if not already enabled)
ALTER TABLE IF EXISTS public.dispute_evidence ENABLE ROW LEVEL SECURITY;
-- Policy for SELECT (admins only)
-- Use DROP IF EXISTS then CREATE because Postgres does not support CREATE POLICY IF NOT EXISTS
DROP POLICY IF EXISTS "dispute_evidence_select_admins_only" ON public.dispute_evidence;
CREATE POLICY "dispute_evidence_select_admins_only"
  ON public.dispute_evidence
  FOR SELECT
  USING (public.is_admin_user());

-- Policy for INSERT (admins only)
DROP POLICY IF EXISTS "dispute_evidence_insert_admins_only" ON public.dispute_evidence;
CREATE POLICY "dispute_evidence_insert_admins_only"
  ON public.dispute_evidence
  FOR INSERT
  WITH CHECK (public.is_admin_user());

-- Policy for DELETE/UPDATE can be added similarly if desired.

-- 4) Notes:
-- - Files uploaded to a private bucket require signed URLs to view. The frontend currently stores a signed URL
--   at upload time for immediate preview; for long-term access consider storing only storage_path and generating
--   signed URLs server-side or via an RPC when needed.
-- - If you want files to be publicly accessible without signed URLs, create the bucket with public=true instead.
-- - Adjust predicates above if your admin guard function differs (e.g., checks profiles.role = 'admin').
