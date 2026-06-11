-- Admin portal access should use the same shared domain tables as mobile.
-- Separation happens through roles + RLS, not duplicated admin-only tables.

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(coalesce(role, '')) = 'admin'
  );
$$;

grant execute on function public.is_admin_user() to authenticated;

alter table public.contractors
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid,
  add column if not exists suspension_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid,
  add column if not exists restore_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contractors_suspended_by_fkey'
      and conrelid = 'public.contractors'::regclass
  ) then
    alter table public.contractors
      add constraint contractors_suspended_by_fkey
      foreign key (suspended_by) references public.profiles(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contractors_restored_by_fkey'
      and conrelid = 'public.contractors'::regclass
  ) then
    alter table public.contractors
      add constraint contractors_restored_by_fkey
      foreign key (restored_by) references public.profiles(id);
  end if;
end $$;

drop policy if exists "Admins can view jobs" on public.jobs;
create policy "Admins can view jobs"
on public.jobs
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can view contractor bank accounts" on public.contractor_bank_accounts;
create policy "Admins can view contractor bank accounts"
on public.contractor_bank_accounts
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can view contractor documents" on public.contractor_documents;
create policy "Admins can view contractor documents"
on public.contractor_documents
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can review contractor documents" on public.contractor_documents;
create policy "Admins can review contractor documents"
on public.contractor_documents
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can view payments" on public.payments;
create policy "Admins can view payments"
on public.payments
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can view withdrawals" on public.withdrawals;
create policy "Admins can view withdrawals"
on public.withdrawals
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can view notifications" on public.notifications;
create policy "Admins can view notifications"
on public.notifications
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can update contractors" on public.contractors;
create policy "Admins can update contractors"
on public.contractors
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
