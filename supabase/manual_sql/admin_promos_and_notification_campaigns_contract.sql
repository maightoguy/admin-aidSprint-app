begin;

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null default ''::text,
  discount_type text not null,
  discount_value numeric not null,
  discount_currency text,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  max_redemptions_total integer,
  max_redemptions_per_user integer,
  min_job_amount numeric,
  created_by_admin_id uuid references public.profiles(id),
  updated_by_admin_id uuid references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint promo_codes_code_unique unique (code),
  constraint promo_codes_discount_type_check check (discount_type in ('percent', 'amount')),
  constraint promo_codes_discount_value_check check (discount_value > 0),
  constraint promo_codes_date_range_check check (
    starts_on is null
    or ends_on is null
    or ends_on >= starts_on
  ),
  constraint promo_codes_amount_currency_check check (
    discount_type <> 'amount'
    or discount_currency is not null
  )
);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid,
  payment_id uuid,
  discount_applied numeric,
  currency text,
  redeemed_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists promo_code_redemptions_promo_code_id_idx
  on public.promo_code_redemptions(promo_code_id, redeemed_at desc);

create index if not exists promo_code_redemptions_user_id_idx
  on public.promo_code_redemptions(user_id, redeemed_at desc);

drop trigger if exists set_promo_codes_updated_at on public.promo_codes;
create trigger set_promo_codes_updated_at
before update on public.promo_codes
for each row
execute function public.update_updated_at();

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null,
  title_template text,
  body_template text not null default ''::text,
  payload_template jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by_admin_id uuid references public.profiles(id),
  updated_by_admin_id uuid references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notification_templates_channel_check check (channel in ('push', 'email', 'sms'))
);

create unique index if not exists notification_templates_name_unique_idx
  on public.notification_templates(lower(name));

drop trigger if exists set_notification_templates_updated_at on public.notification_templates;
create trigger set_notification_templates_updated_at
before update on public.notification_templates
for each row
execute function public.update_updated_at();

create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default ''::text,
  channel text not null,
  template_id uuid references public.notification_templates(id) on delete set null,
  status text not null default 'draft'::text,
  audience_type text not null default 'admins'::text,
  audience_filter jsonb not null default '{}'::jsonb,
  schedule_type text not null default 'manual'::text,
  scheduled_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_by_admin_id uuid references public.profiles(id),
  updated_by_admin_id uuid references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notification_campaigns_channel_check check (channel in ('push', 'email', 'sms')),
  constraint notification_campaigns_status_check check (status in ('draft', 'enabled', 'disabled', 'archived')),
  constraint notification_campaigns_audience_type_check check (audience_type in ('admins', 'users', 'contractors', 'segment')),
  constraint notification_campaigns_schedule_type_check check (schedule_type in ('manual', 'immediate', 'scheduled'))
);

create index if not exists notification_campaigns_status_idx
  on public.notification_campaigns(status, updated_at desc);

create unique index if not exists notification_campaigns_name_unique_idx
  on public.notification_campaigns(lower(name));

drop trigger if exists set_notification_campaigns_updated_at on public.notification_campaigns;
create trigger set_notification_campaigns_updated_at
before update on public.notification_campaigns
for each row
execute function public.update_updated_at();

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.notification_campaigns(id) on delete set null,
  template_id uuid references public.notification_templates(id) on delete set null,
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_role text,
  channel text not null,
  status text not null default 'queued'::text,
  provider_message_id text,
  provider_error text,
  queued_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  failed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  constraint notification_deliveries_channel_check check (channel in ('push', 'email', 'sms')),
  constraint notification_deliveries_status_check check (status in ('queued', 'sending', 'sent', 'delivered', 'failed', 'canceled'))
);

create index if not exists notification_deliveries_campaign_id_idx
  on public.notification_deliveries(campaign_id, queued_at desc);

create index if not exists notification_deliveries_recipient_id_idx
  on public.notification_deliveries(recipient_id, queued_at desc);

alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_campaigns enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists "Admins can view promo codes" on public.promo_codes;
create policy "Admins can view promo codes"
  on public.promo_codes
  for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can insert promo codes" on public.promo_codes;
create policy "Admins can insert promo codes"
  on public.promo_codes
  for insert
  to authenticated
  with check (public.is_admin_user());

drop policy if exists "Admins can update promo codes" on public.promo_codes;
create policy "Admins can update promo codes"
  on public.promo_codes
  for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Admins can delete promo codes" on public.promo_codes;
create policy "Admins can delete promo codes"
  on public.promo_codes
  for delete
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can view promo code redemptions" on public.promo_code_redemptions;
create policy "Admins can view promo code redemptions"
  on public.promo_code_redemptions
  for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can insert promo code redemptions" on public.promo_code_redemptions;
create policy "Admins can insert promo code redemptions"
  on public.promo_code_redemptions
  for insert
  to authenticated
  with check (public.is_admin_user());

drop policy if exists "Admins can update promo code redemptions" on public.promo_code_redemptions;
create policy "Admins can update promo code redemptions"
  on public.promo_code_redemptions
  for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Admins can view notification templates" on public.notification_templates;
create policy "Admins can view notification templates"
  on public.notification_templates
  for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can insert notification templates" on public.notification_templates;
create policy "Admins can insert notification templates"
  on public.notification_templates
  for insert
  to authenticated
  with check (public.is_admin_user());

drop policy if exists "Admins can update notification templates" on public.notification_templates;
create policy "Admins can update notification templates"
  on public.notification_templates
  for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Admins can delete notification templates" on public.notification_templates;
create policy "Admins can delete notification templates"
  on public.notification_templates
  for delete
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can view notification campaigns" on public.notification_campaigns;
create policy "Admins can view notification campaigns"
  on public.notification_campaigns
  for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can insert notification campaigns" on public.notification_campaigns;
create policy "Admins can insert notification campaigns"
  on public.notification_campaigns
  for insert
  to authenticated
  with check (public.is_admin_user());

drop policy if exists "Admins can update notification campaigns" on public.notification_campaigns;
create policy "Admins can update notification campaigns"
  on public.notification_campaigns
  for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Admins can delete notification campaigns" on public.notification_campaigns;
create policy "Admins can delete notification campaigns"
  on public.notification_campaigns
  for delete
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can view notification deliveries" on public.notification_deliveries;
create policy "Admins can view notification deliveries"
  on public.notification_deliveries
  for select
  to authenticated
  using (public.is_admin_user());

drop policy if exists "Admins can insert notification deliveries" on public.notification_deliveries;
create policy "Admins can insert notification deliveries"
  on public.notification_deliveries
  for insert
  to authenticated
  with check (public.is_admin_user());

drop policy if exists "Admins can update notification deliveries" on public.notification_deliveries;
create policy "Admins can update notification deliveries"
  on public.notification_deliveries
  for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

grant select, insert, update, delete on table public.promo_codes to authenticated;
grant select, insert, update on table public.promo_code_redemptions to authenticated;
grant select, insert, update, delete on table public.notification_templates to authenticated;
grant select, insert, update, delete on table public.notification_campaigns to authenticated;
grant select, insert, update on table public.notification_deliveries to authenticated;

grant all on table public.promo_codes to service_role;
grant all on table public.promo_code_redemptions to service_role;
grant all on table public.notification_templates to service_role;
grant all on table public.notification_campaigns to service_role;
grant all on table public.notification_deliveries to service_role;

commit;

