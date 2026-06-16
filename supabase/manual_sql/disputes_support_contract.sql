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

create table public.support_tickets (
  id uuid not null default gen_random_uuid(),
  requester_id uuid not null,
  requester_role text not null,
  job_id uuid,
  subject text not null,
  description text not null,
  status text not null,
  priority text not null,
  assigned_admin_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  constraint support_tickets_pkey primary key (id),
  constraint support_tickets_requester_id_fkey foreign key (requester_id) references public.profiles(id),
  constraint support_tickets_assigned_admin_id_fkey foreign key (assigned_admin_id) references public.profiles(id),
  constraint support_tickets_job_id_fkey foreign key (job_id) references public.jobs(id) on delete set null,
  constraint support_tickets_requester_role_check check (requester_role = any (array['user'::text, 'contractor'::text, 'admin'::text])),
  constraint support_tickets_status_check check (status = any (array['open'::text, 'in_review'::text, 'awaiting_requester'::text, 'awaiting_contractor'::text, 'resolved'::text, 'closed'::text])),
  constraint support_tickets_priority_check check (priority = any (array['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))
);

create index if not exists support_tickets_created_at_idx on public.support_tickets using btree (created_at desc);
create index if not exists support_tickets_job_id_idx on public.support_tickets using btree (job_id);
create index if not exists support_tickets_requester_id_idx on public.support_tickets using btree (requester_id);
create index if not exists support_tickets_status_idx on public.support_tickets using btree (status);

alter table public.support_tickets enable row level security;

drop policy if exists "Admins can view support tickets" on public.support_tickets;
create policy "Admins can view support tickets"
on public.support_tickets
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can insert support tickets" on public.support_tickets;
create policy "Admins can insert support tickets"
on public.support_tickets
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update support tickets" on public.support_tickets;
create policy "Admins can update support tickets"
on public.support_tickets
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create table public.support_ticket_events (
  id uuid not null default gen_random_uuid(),
  ticket_id uuid not null,
  actor_id uuid not null,
  actor_role text not null,
  event_type text not null,
  message text not null default ''::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint support_ticket_events_pkey primary key (id),
  constraint support_ticket_events_ticket_id_fkey foreign key (ticket_id) references public.support_tickets(id) on delete cascade,
  constraint support_ticket_events_actor_id_fkey foreign key (actor_id) references public.profiles(id),
  constraint support_ticket_events_actor_role_check check (actor_role = any (array['user'::text, 'contractor'::text, 'admin'::text, 'system'::text])),
  constraint support_ticket_events_event_type_check check (event_type = any (array['created'::text, 'assigned'::text, 'status_changed'::text, 'message'::text, 'note'::text, 'resolved'::text, 'closed'::text]))
);

create index if not exists support_ticket_events_ticket_id_idx on public.support_ticket_events using btree (ticket_id, created_at desc);
create index if not exists support_ticket_events_created_at_idx on public.support_ticket_events using btree (created_at desc);

alter table public.support_ticket_events enable row level security;

drop policy if exists "Admins can view support ticket events" on public.support_ticket_events;
create policy "Admins can view support ticket events"
on public.support_ticket_events
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can insert support ticket events" on public.support_ticket_events;
create policy "Admins can insert support ticket events"
on public.support_ticket_events
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update support ticket events" on public.support_ticket_events;
create policy "Admins can update support ticket events"
on public.support_ticket_events
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create table public.disputes (
  id uuid not null default gen_random_uuid(),
  job_id uuid not null,
  opened_by_id uuid not null,
  opened_by_role text not null,
  dispute_type text not null,
  status text not null,
  priority text not null,
  reason text not null default ''::text,
  requested_resolution text not null default ''::text,
  assigned_admin_id uuid,
  related_payment_id uuid,
  related_withdrawal_id uuid,
  resolution_type text,
  resolution_amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  rejected_at timestamptz,
  constraint disputes_pkey primary key (id),
  constraint disputes_job_id_fkey foreign key (job_id) references public.jobs(id) on delete cascade,
  constraint disputes_opened_by_id_fkey foreign key (opened_by_id) references public.profiles(id),
  constraint disputes_assigned_admin_id_fkey foreign key (assigned_admin_id) references public.profiles(id),
  constraint disputes_related_payment_id_fkey foreign key (related_payment_id) references public.payments(id) on delete set null,
  constraint disputes_related_withdrawal_id_fkey foreign key (related_withdrawal_id) references public.withdrawals(id) on delete set null,
  constraint disputes_opened_by_role_check check (opened_by_role = any (array['user'::text, 'contractor'::text, 'admin'::text])),
  constraint disputes_type_check check (dispute_type = any (array['service_quality'::text, 'payment'::text, 'behavior'::text, 'safety'::text, 'other'::text])),
  constraint disputes_status_check check (status = any (array['open'::text, 'under_review'::text, 'awaiting_evidence'::text, 'proposed_resolution'::text, 'resolved'::text, 'rejected'::text, 'escalated'::text])),
  constraint disputes_priority_check check (priority = any (array['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  constraint disputes_resolution_type_check check (resolution_type is null or resolution_type = any (array['no_action'::text, 'refund'::text, 'partial_refund'::text, 'payout_release'::text, 'payout_block'::text, 'chargeback'::text]))
);

create index if not exists disputes_created_at_idx on public.disputes using btree (created_at desc);
create index if not exists disputes_job_id_idx on public.disputes using btree (job_id);
create index if not exists disputes_status_idx on public.disputes using btree (status);
create index if not exists disputes_assigned_admin_id_idx on public.disputes using btree (assigned_admin_id);

alter table public.disputes enable row level security;

drop policy if exists "Admins can view disputes" on public.disputes;
create policy "Admins can view disputes"
on public.disputes
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can insert disputes" on public.disputes;
create policy "Admins can insert disputes"
on public.disputes
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update disputes" on public.disputes;
create policy "Admins can update disputes"
on public.disputes
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create table public.dispute_evidence (
  id uuid not null default gen_random_uuid(),
  dispute_id uuid not null,
  submitted_by_id uuid not null,
  submitted_by_role text not null,
  evidence_type text not null,
  url text,
  description text not null default ''::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint dispute_evidence_pkey primary key (id),
  constraint dispute_evidence_dispute_id_fkey foreign key (dispute_id) references public.disputes(id) on delete cascade,
  constraint dispute_evidence_submitted_by_id_fkey foreign key (submitted_by_id) references public.profiles(id),
  constraint dispute_evidence_submitted_by_role_check check (submitted_by_role = any (array['user'::text, 'contractor'::text, 'admin'::text])),
  constraint dispute_evidence_type_check check (evidence_type = any (array['text'::text, 'image'::text, 'file'::text, 'link'::text]))
);

create index if not exists dispute_evidence_dispute_id_idx on public.dispute_evidence using btree (dispute_id, created_at desc);

alter table public.dispute_evidence enable row level security;

drop policy if exists "Admins can view dispute evidence" on public.dispute_evidence;
create policy "Admins can view dispute evidence"
on public.dispute_evidence
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can insert dispute evidence" on public.dispute_evidence;
create policy "Admins can insert dispute evidence"
on public.dispute_evidence
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update dispute evidence" on public.dispute_evidence;
create policy "Admins can update dispute evidence"
on public.dispute_evidence
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create table public.dispute_events (
  id uuid not null default gen_random_uuid(),
  dispute_id uuid not null,
  actor_id uuid not null,
  actor_role text not null,
  action text not null,
  reason text not null default ''::text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint dispute_events_pkey primary key (id),
  constraint dispute_events_dispute_id_fkey foreign key (dispute_id) references public.disputes(id) on delete cascade,
  constraint dispute_events_actor_id_fkey foreign key (actor_id) references public.profiles(id),
  constraint dispute_events_actor_role_check check (actor_role = any (array['user'::text, 'contractor'::text, 'admin'::text, 'system'::text])),
  constraint dispute_events_action_check check (action = any (array['created'::text, 'request_evidence'::text, 'add_evidence'::text, 'propose_resolution'::text, 'resolve'::text, 'reject'::text, 'escalate'::text, 'note'::text]))
);

create index if not exists dispute_events_dispute_id_idx on public.dispute_events using btree (dispute_id, created_at desc);
create index if not exists dispute_events_created_at_idx on public.dispute_events using btree (created_at desc);

alter table public.dispute_events enable row level security;

drop policy if exists "Admins can view dispute events" on public.dispute_events;
create policy "Admins can view dispute events"
on public.dispute_events
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can insert dispute events" on public.dispute_events;
create policy "Admins can insert dispute events"
on public.dispute_events
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Admins can update dispute events" on public.dispute_events;
create policy "Admins can update dispute events"
on public.dispute_events
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
