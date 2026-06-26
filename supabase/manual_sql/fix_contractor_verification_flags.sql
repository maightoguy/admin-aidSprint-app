-- =============================================================================
-- FIX: Prevent premature contractor verification flag promotion
-- =============================================================================
-- Problem: The Android app sets id_verification_complete, police_check_complete,
-- and service_licences_complete to true during document upload, BEFORE admin
-- review. The check_contractor_verification() trigger then auto-promotes
-- is_verified = true, skipping document approval entirely.
--
-- Solution:
--   1. Drop the legacy trigger that auto-promotes is_verified from the three flags
--   2. Create a new trigger that DERIVES the flags from actual document statuses,
--      preventing writes that bypass admin review
-- =============================================================================

-- Step 1: Drop the legacy trigger that auto-promotes is_verified
-- The admin app already derives verification state from contractor_documents.status
-- using deriveContractorVerificationState(), so this trigger is no longer needed.
drop trigger if exists on_contractor_verification_update on public.contractors;

-- Step 2: Replace the function with one that derives flags from actual document status
-- instead of trusting client-supplied values.
create or replace function public.check_contractor_verification()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  has_approved_id boolean;
  has_approved_police boolean;
  has_approved_service_licence boolean;
  has_any_pending_or_rejected boolean;
begin
  -- Derive verification flags from actual contractor_documents rows.
  -- This prevents clients (Android) from setting flags to true when
  -- documents are still pending or not yet admin-reviewed.

  select exists(
    select 1 from public.contractor_documents
    where contractor_id = new.id
      and document_type in ('government_id', 'drivers_licence', 'passport', 'national_id')
      and status = 'approved'
  ) into has_approved_id;

  select exists(
    select 1 from public.contractor_documents
    where contractor_id = new.id
      and document_type = 'police_check'
      and status = 'approved'
  ) into has_approved_police;

  select exists(
    select 1 from public.contractor_documents
    where contractor_id = new.id
      and document_type = 'service_licence'
      and status = 'approved'
  ) into has_approved_service_licence;

  -- Derive the flags from actual document approval state
  new.id_verification_complete := has_approved_id;
  new.police_check_complete := has_approved_police;
  new.service_licences_complete := has_approved_service_licence;

  -- Only mark as verified when ALL required documents are approved
  if has_approved_id and has_approved_police and has_approved_service_licence then
    new.is_verified := true;

    -- Promote out of pending_approval when fully verified
    if new.availability_status = 'pending_approval' then
      new.availability_status := 'offline';
    end if;
  else
    -- Check if there are any pending or rejected documents that should
    -- cause is_verified to be reset
    select exists(
      select 1 from public.contractor_documents
      where contractor_id = new.id
        and status in ('pending', 'rejected')
    ) into has_any_pending_or_rejected;

    if has_any_pending_or_rejected then
      new.is_verified := false;
    end if;
    -- Note: if there are NO documents at all, we leave is_verified unchanged
    -- to avoid resetting legacy contractors that were verified before the
    -- contractor_documents table was introduced.
  end if;

  return new;
end;
$$;

-- Step 3: Re-create the trigger with the new function
create trigger on_contractor_verification_update
  before update on public.contractors
  for each row
  execute function public.check_contractor_verification();

-- Step 4: Fix any already-corrupted rows in staging/production
-- Uncomment and run this after deploying the trigger above:
--
-- update public.contractors
-- set updated_at = now()  -- triggers the new function to re-derive flags
-- where is_verified = true
--   and (
--     id_verification_complete = true
--     or police_check_complete = true
--     or service_licences_complete = true
--   )
--   and not exists (
--     -- Only fix contractors where documents are still pending (the bug case)
--     select 1 from public.contractor_documents doc
--     where doc.contractor_id = contractors.id
--       and doc.status = 'approved'
--       and doc.document_type in ('government_id', 'drivers_licence', 'passport', 'national_id')
--   )
--   and not exists (
--     select 1 from public.contractor_documents doc
--     where doc.contractor_id = contractors.id
--       and doc.status = 'approved'
--       and doc.document_type = 'police_check'
--   )
--   and not exists (
--     select 1 from public.contractor_documents doc
--     where doc.contractor_id = contractors.id
--       and doc.status = 'approved'
--       and doc.document_type = 'service_licence'
--   );