-- Promote fully verified contractors out of the pending approval bucket.
-- This keeps the shared contractor state aligned with the mobile team's
-- verification contract: verified contractors should end up offline or online,
-- not remain stuck in pending_approval after every verification flag is complete.

create or replace function public.check_contractor_verification()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if new.id_verification_complete
    and new.police_check_complete
    and new.service_licences_complete then
    new.is_verified = true;

    if new.availability_status = 'pending_approval' then
      new.availability_status = 'offline';
    end if;
  end if;

  return new;
end;
$$;
