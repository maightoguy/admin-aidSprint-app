-- =============================================================================
-- FIX: Admin cannot update profile linked_auth_methods (for activate/deactivate)
-- =============================================================================
-- Problem: The existing "Admins can update profiles" policy works for USING
-- (row visibility) but fails for WITH CHECK. PostgreSQL defaults WITH CHECK
-- to the USING expression when not specified explicitly.
--
-- The USING clause: exists(select 1 from profiles where profiles.id = auth.uid()
-- and profiles.role = 'admin') — this correctly checks the CURRENT user is admin.
--
-- But WITH CHECK inherits this expression and evaluates it against the NEW row.
-- For a non-admin target user: target_user.id != auth.uid() → WITH CHECK fails.
--
-- Solution: Add explicit WITH CHECK (true) to allow any write once the admin
-- passes the USING check.
-- =============================================================================

drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Admins can update profiles"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (true);