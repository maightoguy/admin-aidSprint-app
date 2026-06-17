begin;

-- Admin-level MFA policy and security timestamps.
create table if not exists public.admin_security_settings (
  admin_user_id uuid primary key
    references public.profiles(id) on delete cascade,
  mfa_policy text not null default 'optional',
  recovery_codes_generated_at timestamp with time zone,
  last_reauth_at timestamp with time zone,
  last_mfa_reset_requested_at timestamp with time zone,
  last_mfa_reset_by uuid
    references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint admin_security_settings_mfa_policy_check
    check (mfa_policy in ('optional', 'required'))
);

-- Hashed, single-use recovery codes.
-- Store only hashes here. Generate raw codes in a trusted server path.
create table if not exists public.admin_mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null
    references public.profiles(id) on delete cascade,
  code_hash text not null,
  generated_at timestamp with time zone not null default now(),
  consumed_at timestamp with time zone,
  consumed_by_ip inet,
  metadata jsonb not null default '{}'::jsonb,
  constraint admin_mfa_recovery_codes_unique_hash
    unique (admin_user_id, code_hash)
);

-- Security audit trail for MFA and password events.
create table if not exists public.admin_security_events (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null
    references public.profiles(id) on delete cascade,
  actor_id uuid not null
    references public.profiles(id),
  action text not null,
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint admin_security_events_action_check
    check (
      action in (
        'mfa_enrolled',
        'mfa_challenged',
        'mfa_verified',
        'recovery_codes_generated',
        'recovery_code_used',
        'mfa_reset_requested',
        'mfa_disabled',
        'password_changed'
      )
    )
);

create index if not exists admin_mfa_recovery_codes_admin_user_id_idx
  on public.admin_mfa_recovery_codes (admin_user_id);

create index if not exists admin_mfa_recovery_codes_available_idx
  on public.admin_mfa_recovery_codes (admin_user_id, consumed_at);

create index if not exists admin_security_events_admin_user_id_created_at_idx
  on public.admin_security_events (admin_user_id, created_at desc);

create index if not exists admin_security_events_actor_id_created_at_idx
  on public.admin_security_events (actor_id, created_at desc);

drop trigger if exists set_admin_security_settings_updated_at
  on public.admin_security_settings;

create trigger set_admin_security_settings_updated_at
before update on public.admin_security_settings
for each row
execute function public.update_updated_at();

alter table public.admin_security_settings enable row level security;
alter table public.admin_mfa_recovery_codes enable row level security;
alter table public.admin_security_events enable row level security;

drop policy if exists "Admins can view own security settings"
  on public.admin_security_settings;
create policy "Admins can view own security settings"
  on public.admin_security_settings
  for select
  to authenticated
  using (public.is_admin_user() and auth.uid() = admin_user_id);

drop policy if exists "Admins can insert own security settings"
  on public.admin_security_settings;
create policy "Admins can insert own security settings"
  on public.admin_security_settings
  for insert
  to authenticated
  with check (public.is_admin_user() and auth.uid() = admin_user_id);

drop policy if exists "Admins can update own security settings"
  on public.admin_security_settings;
create policy "Admins can update own security settings"
  on public.admin_security_settings
  for update
  to authenticated
  using (public.is_admin_user() and auth.uid() = admin_user_id)
  with check (public.is_admin_user() and auth.uid() = admin_user_id);

drop policy if exists "Admins can view own MFA recovery codes"
  on public.admin_mfa_recovery_codes;
create policy "Admins can view own MFA recovery codes"
  on public.admin_mfa_recovery_codes
  for select
  to authenticated
  using (public.is_admin_user() and auth.uid() = admin_user_id);

drop policy if exists "Admins can insert own MFA recovery codes"
  on public.admin_mfa_recovery_codes;
create policy "Admins can insert own MFA recovery codes"
  on public.admin_mfa_recovery_codes
  for insert
  to authenticated
  with check (public.is_admin_user() and auth.uid() = admin_user_id);

drop policy if exists "Admins can update own MFA recovery codes"
  on public.admin_mfa_recovery_codes;
create policy "Admins can update own MFA recovery codes"
  on public.admin_mfa_recovery_codes
  for update
  to authenticated
  using (public.is_admin_user() and auth.uid() = admin_user_id)
  with check (public.is_admin_user() and auth.uid() = admin_user_id);

drop policy if exists "Admins can delete own MFA recovery codes"
  on public.admin_mfa_recovery_codes;
create policy "Admins can delete own MFA recovery codes"
  on public.admin_mfa_recovery_codes
  for delete
  to authenticated
  using (public.is_admin_user() and auth.uid() = admin_user_id);

drop policy if exists "Admins can view own security events"
  on public.admin_security_events;
create policy "Admins can view own security events"
  on public.admin_security_events
  for select
  to authenticated
  using (
    public.is_admin_user()
    and (auth.uid() = admin_user_id or auth.uid() = actor_id)
  );

drop policy if exists "Admins can insert own security events"
  on public.admin_security_events;
create policy "Admins can insert own security events"
  on public.admin_security_events
  for insert
  to authenticated
  with check (
    public.is_admin_user()
    and auth.uid() = actor_id
    and auth.uid() = admin_user_id
  );

grant select, insert, update on table public.admin_security_settings to authenticated;
grant select, insert, update, delete on table public.admin_mfa_recovery_codes to authenticated;
grant select, insert on table public.admin_security_events to authenticated;

grant all on table public.admin_security_settings to service_role;
grant all on table public.admin_mfa_recovery_codes to service_role;
grant all on table public.admin_security_events to service_role;

commit;