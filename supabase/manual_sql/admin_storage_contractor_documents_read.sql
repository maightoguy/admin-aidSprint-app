-- =============================================================================
-- FIX: Admins cannot read contractor documents from storage
-- =============================================================================
-- Problem: The contractor-documents bucket storage RLS policy restricts reads to
-- the contractor who owns the folder (auth.uid() = foldername). Admin UIDs never
-- match a contractor's folder, so createSignedUrl() returns an error which the
-- admin app catches silently -- resulting in blank/broken document previews.
--
-- Solution: Add a permissive READ policy that allows admin users to read any
-- object in the contractor-documents bucket.
-- =============================================================================

-- Step 1: Add an admin read policy for the contractor-documents storage bucket.
-- This runs alongside the existing "Contractor doc read" policy (RLS policies are
-- OR'd together, so this grants additional access -- it doesn't revoke the existing one).
create policy "Admin contractor doc read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
  using (
    bucket_id = 'contractor-documents'::text
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Step 2 (optional): If the admin app also needs to upload/download on behalf of
-- contractors (not currently needed), add a similar INSERT policy:
--
-- create policy "Admin contractor doc insert"
--   on "storage"."objects"
--   as permissive
--   for insert
--   to authenticated
--   with check (
--     bucket_id = 'contractor-documents'::text
--     and exists (
--       select 1 from public.profiles
--       where profiles.id = auth.uid()
--         and profiles.role = 'admin'
--     )
--   );