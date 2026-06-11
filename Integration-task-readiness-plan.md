# AidSprint Admin Integration Task Readiness Plan

Last updated: 2026-06-05

## Purpose

This document defines the phased integration plan for moving the completed admin frontend from mock data into live Supabase-backed behavior.

The goal is not to do a one-shot integration. The goal is to connect the admin app safely, in small stages, using the PRD as the product target and the current Supabase schema as the starting backend contract.

## PRD Goals This Integration Must Support

From the PRD, the admin dashboard must support:

- secure admin access
- manage users and contractors
- contractor verification and approvals
- edit service categories and tier pricing
- job monitoring in real time
- fraud/risk monitoring
- track low-rated contractors
- financial payouts and reports
- support tickets and disputes
- suspend and restore contractor accounts
- push notification management
- promo code management

Relevant PRD references:

- Admin dashboard capabilities: [PRODUCT REQUIREMENTS DOCUMENT.md:L61-L75](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/PRODUCT%20REQUIREMENTS%20DOCUMENT.md#L61-L75)
- Admin dashboard KPIs: [PRODUCT REQUIREMENTS DOCUMENT.md:L92-L101](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/PRODUCT%20REQUIREMENTS%20DOCUMENT.md#L92-L101)
- Security requirement for admin 2FA: [PRODUCT REQUIREMENTS DOCUMENT.md:L219-L223](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/PRODUCT%20REQUIREMENTS%20DOCUMENT.md#L219-L223)
- Backend/platform direction: [PRODUCT REQUIREMENTS DOCUMENT.md:L197-L206](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/PRODUCT%20REQUIREMENTS%20DOCUMENT.md#L197-L206)

## Current State

The frontend execution board is complete:

- Phase 1 complete
- Phase 2 complete
- Phase 3 complete
- Phase 4 complete

Current status source: [current-task.md:L23-L42](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/current-task.md#L23-L42)

Important current reality:

- the admin UI is operationally structured and backend-ready in naming
- auth is still mock/local in [auth.store.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/auth/auth.store.ts)
- most screens still use mock datasets
- Supabase schema already supports jobs, contractors, contractor documents, categories, service types, urgency tiers, payments, withdrawals, notifications, reviews, and realtime for key tables
- Supabase schema does not yet fully support disputes, support tickets, promo codes, admin roles, or deeper finance audit/reconciliation workflows

## Integration Principles

- Start with the thinnest working vertical slice, not the biggest module.
- Replace mock data module by module, not app-wide at once.
- Keep the current Figma-backed UI intact; integration should mainly swap data sources and action handlers.
- Prefer contract alignment over speed: if frontend states do not map cleanly to Supabase yet, define the backend contract first.
- Add Supabase reads before writes where possible.
- Add writes before realtime where possible.
- Add realtime only after base fetch + mutation flows are stable.
- Protect admin-only access with proper auth and RLS before exposing live data.

## Overall Readiness Summary

### Ready to begin now

- auth architecture on the frontend
- route protection structure
- requests/job monitoring surface
- contractor ops and KYC review surface
- settings marketplace configuration
- finance ops surface at the UI layer

### Needs backend decisions before full production integration

- admin role and permission model
- disputes and support-ticket schema
- promo/campaign schema
- richer finance audit/reconciliation schema
- fraud/risk backend modeling

## Recommended Integration Order

1. Admin auth and session foundation
2. Shared Supabase client, environment, and query layer
3. Read-only live fetch for overview/requests/contractors/settings
4. Read-write contractor KYC and contractor admin actions
5. Read-write requests/job monitoring actions
6. Read-write settings categories/pricing/urgency tiers
7. Finance reads, then finance writes
8. Realtime job/contractor/notification updates
9. Disputes/support backend expansion and integration
10. Promos/notification campaigns/fraud tooling/backend hardening

## Phase Plan

### Phase A - Admin Auth Foundation

Objective:

- replace mock auth with Supabase-backed admin authentication

Why first:

- every live admin read/write depends on trusted session handling
- PRD explicitly requires secure admin dashboard access and two-factor security

Scope:

- add Supabase client setup
- add environment variables for Supabase URL and anon key
- replace mock sign-in in `src/auth/auth.store.ts`
- map login flow to Supabase auth
- preserve existing validation/loading/session-expiry UX
- define how admin users are identified

Required backend decisions:

- decide where admin identity lives:
  - option A: add `admin` to `profiles.role`
  - option B: create separate `admin_users` table
  - option C: use auth metadata + RLS mapping
- decide whether 2FA is required immediately or deferred to a later auth hardening phase

Deliverables:

- live sign-in/sign-out/session refresh
- protected admin routes backed by real session state
- unauthorized admin rejection
- initial admin-only RLS policy plan

Do not start Phase B until:

- admin login works against Supabase
- unauthorized non-admin users are blocked cleanly

### Phase B - Shared Data Layer And Contract Mapping

Objective:

- create the integration foundation used by every screen

Scope:

- create a central Supabase access layer
- define typed query/mutation modules by domain
- map frontend lifecycle/status types to actual schema values
- separate UI view models from raw DB rows where needed

Recommended outputs:

- `src/lib/supabase/` or similar
- domain mappers for jobs, contractors, documents, payments, withdrawals, categories, notifications
- error-handling and loading-state conventions

Key contract-mapping work:

- jobs status map from `jobs.status`
- contractor verification/readiness map from `contractors` + `contractor_documents`
- finance map from `payments` + `withdrawals`
- settings map from `service_categories`, `service_types`, `urgency_tiers`, `platform_config`

Do not begin wide live fetch replacement until:

- one shared pattern exists for read, mutation, loading, empty, and error states

### Phase C - Read-Only Live Fetch Pass

Objective:

- replace mock list/detail reads with Supabase fetches without changing workflows yet

Recommended order:

1. requests
2. contractors
3. overview
4. settings
5. transactions

Why this order:

- requests and contractors are the strongest schema matches
- overview can then aggregate real counts from those domains
- settings and transactions need more mapping work

Per-module goal:

- page loads real data
- filters work against live data or server-shaped data
- detail sidebars use real records
- no write actions yet, unless trivial

Definition of done for this phase:

- mock seed dependency is removed for the targeted module
- loading, error, and empty states are visible and stable

### Phase D - Contractor And KYC Write Integration

Objective:

- make contractor management and KYC review real first, because this is one of the cleanest admin workflows in the schema

Backend tables already aligned:

- `contractors`
- `contractor_documents`
- `contractor_bank_accounts`
- `reviews`

Write flows to implement:

- approve/reject contractor documents
- persist rejection reasons
- persist contractor availability/lifecycle-style admin actions where schema allows
- decide how suspension/restore should be represented if no explicit suspended field exists yet

Backend gap to settle:

- current schema does not yet expose a clean admin suspension field/workflow
- decide whether to add:
  - `is_suspended`
  - `suspension_reason`
  - `suspended_at`
  - `suspended_by`

### Phase E - Requests And Job Monitoring Write Integration

Objective:

- connect operations workflows to real job records

Backend tables/functions already aligned:

- `jobs`
- `job_attachments`
- `job_declined_contractors`
- `accept_job(...)`
- realtime on `jobs`

Write flows to implement:

- update job lifecycle state
- cancellation handling
- intervention actions that map to real schema
- realtime updates for queue changes

Backend gap to settle:

- frontend now models delayed/dispute/intervention concepts more richly than current `jobs` schema
- decide whether these live:
  - directly on `jobs`
  - in separate operations tables
  - in disputes/support tables later

### Phase F - Settings Integration

Objective:

- move marketplace configuration from mock state to live admin-managed config

Backend tables already aligned:

- `service_categories`
- `service_types`
- `urgency_tiers`
- `platform_config`

Safe first live writes:

- category enable/disable
- category create/edit
- service type create/edit
- urgency tier multiplier/fee updates
- basic platform config reads/writes

Not fully backed yet:

- promo creation
- notification campaign management beyond generic notifications

Backend additions likely needed:

- `promo_codes`
- `promo_code_rules`
- `notification_campaigns` or `notification_templates`

### Phase G - Finance Integration

Objective:

- connect finance operations gradually, because the UI is ahead of the current schema in workflow depth

Backend tables already aligned:

- `payments`
- `withdrawals`
- contractor payout readiness fields on `contractors`

Recommended order:

1. live read-only finance lists and detail sidebars
2. live export based on fetched data
3. live payout status updates where backend contract exists
4. only then add reconciliation/reversal/admin audit workflows

Known mismatch:

- frontend finance states include review/reconciliation/reversal flows
- schema supports only a subset today:
  - payments have `pending`, `processing`, `authorized`, `paid`, `captured`, `failed`, `refunded`, `cancelled`
  - withdrawals have `pending`, `processing`, `completed`, `failed`

Backend additions likely needed:

- finance audit log table
- reconciliation table
- payout decision history
- reversal/refund admin action history

### Phase H - Realtime Enablement

Objective:

- upgrade important surfaces from polling/static fetch to realtime updates

Best candidates:

- requests/job monitoring
- overview operational counts
- contractor availability
- notifications

Current realtime-ready tables:

- `jobs`
- `contractors`
- `notifications`
- chat tables

Rule:

- only enable realtime after baseline read/write flows are stable

### Phase I - Disputes And Support Backend Expansion

Objective:

- connect the completed disputes/support UI to real backend models

Why later:

- this is one of the biggest schema gaps
- the frontend is ready, but the DB contract is not yet complete

Likely required new tables:

- `disputes`
- `dispute_evidence`
- `dispute_action_log`
- `support_tickets`
- `support_ticket_messages`

This phase should define:

- dispute lifecycle contract
- resolution contract
- refund/reversal linkage to payments/withdrawals
- auditability requirements

### Phase J - Final Hardening

Objective:

- move from “working integration” to “production-safe admin system”

Scope:

- RLS review
- service-role/server-side action review
- audit logging
- admin activity logging
- better observability
- pagination/performance tuning
- retry/error UX polishing
- final removal of remaining mock-only fallbacks

## Small-Start Execution Plan

This is the recommended immediate path:

### Step 1

- implement real Supabase auth for admin login

### Step 2

- add shared Supabase client and domain query modules

### Step 3

- convert one read-only module to live fetch:
  - start with `requests`

### Step 4

- convert `contractors` and `contractor-kyc-tab`

### Step 5

- convert `overview` aggregations to real data

### Step 6

- convert `settings` categories/pricing/urgency tiers

### Step 7

- convert `transactions` read-only, then finance writes

### Step 8

- design missing disputes/support/promos backend tables before integrating those modules fully

## Module Readiness Matrix

| Module | Frontend Ready | Schema Ready | Integration Readiness | Notes |
|---|---|---:|---:|---|
| Auth | High | Medium-Low | Medium | Frontend ready, backend admin-role strategy not finalized |
| Requests / Jobs | High | High | High | Best first live data module |
| Contractors | High | High | High | Strong contractor + KYC alignment |
| Overview | High | Medium-High | Medium-High | Depends on live requests/contractors/payments aggregates |
| Settings categories/pricing | High | High | High | Good match to schema |
| Transactions / payouts | High | Medium | Medium | Reads first, writes after contract mapping |
| Disputes | High | Low | Low-Medium | UI ready, schema not ready enough |
| Support | Medium | Low | Low-Medium | Needs backend ticket model |
| Promos | Medium | Low | Low | Needs schema |
| Notification campaigns | Medium | Low-Medium | Low-Medium | Generic notifications exist, campaigns do not |

## Backend Decisions Needed Before Broad Integration

1. Define admin identity and authorization model.
2. Decide whether admin 2FA is phase-1 integration or phase-2 hardening.
3. Add missing suspension/restore backend contract for contractors.
4. Define where delayed/dispute/intervention request metadata should persist.
5. Define disputes/support schema.
6. Define promo and notification campaign schema.
7. Define finance audit/reconciliation/reversal schema.

## Suggested First Integration Task

If starting immediately, the best first task is:

### Integrate real admin auth with Supabase

Why:

- it unlocks every later module
- it is smaller than a full data-module rewrite
- the frontend auth/route structure is already complete
- it lets the next steps move from mock local session to real protected backend access

Immediate deliverables for that first integration task:

- Supabase client setup
- replace mock `signIn` and session persistence
- admin authorization check
- logout/session expiry validation
- basic protected-route validation against live auth

## Chunked Trae Prompt Bank

Use these prompts as execution chunks. Each chunk is intentionally scoped so it can be:

- run on its own
- combined with the next chunk in the same phase
- merged into a larger phase pass if Trae credits are not a concern

Rule:

- prefer one chunk at a time for integration work
- only combine chunks after the earlier chunk is stable
- keep treating Figma as the visual source of truth and the PRD as the workflow source of truth

### Phase A - Admin Auth Foundation

#### Chunk A1 - Supabase auth plumbing (DONE)

```text
Integration task: Set up the Supabase auth foundation for the admin app without changing the current dashboard visual language. Add the shared Supabase client setup, environment-variable access, and any minimal auth utility files needed so the existing login and route-guard architecture can begin using real Supabase sessions instead of mock-only local state.

Scope:
- Add the Supabase client setup and environment access pattern.
- Keep code organization ready for later query/mutation modules.
- Do not redesign `login.tsx`.
- Do not wire live data modules yet.

Files to focus on:
- `src/auth/`
- `src/login/login.tsx`
- `src/App.tsx`
- new shared Supabase client files as needed

Requirements:
- Preserve the current auth-ready UI states.
- Keep route protection behavior intact.
- Structure the setup so later modules can reuse the same client/session source.
- Add focused tests only if setup changes observable auth boot behavior.

NOTE:
- Our Supabase project is already live/ready; tables and configuration will be created/modified incrementally as we integrate.
- When you ask me to “check the current Supabase state”, I should read the newest `supabase/migrations/*_remote_schema.sql` schema snapshot first (highest timestamp).
- If any integration chunk requires SQL changes (new tables, constraints, policies, helper functions), paste the SQL in the task response and also add it as a `.sql` file that I can paste into the Supabase SQL editor.
- Do not add ad-hoc SQL files to `supabase/migrations/` during integration planning. This can cause `supabase db pull` to fail with migration-history mismatches when local files differ from the remote migration history.
- When SQL is needed, store it under `supabase/manual_sql/` using descriptive filenames (no timestamp-based migration naming).
- I run the SQL and update the current Supabase state after any SQL you provide, including updating the locally stored schema snapshot as needed. Assume the Supabase table state I report back is correct after I apply a SQL change.
- The repo Supabase workspace folder is `c:\Users\hp\Desktop\Work\Assignment\aidSprint-app\admin-aidSprint-app\supabase`. Use this location for `config.toml`, `manual_sql`, `backups`, and `migrations` instead of looking for a separate hidden project folder first.
- The admin app should operate on the same shared domain tables the mobile app uses. Separation should happen through auth, roles, and RLS policies, not duplicated admin-only copies of the business tables.
- Current shared domain tables from the schema snapshot:
  - Identity / roles: `public.profiles`
  - Contractor ops: `public.contractors`, `public.contractor_documents`, `public.contractor_bank_accounts`
  - Jobs / fulfillment: `public.jobs`, `public.job_attachments`, `public.job_declined_contractors`
  - Comms: `public.chat_conversations`, `public.chat_messages`, `public.notifications`
  - Money movement: `public.payments`, `public.withdrawals`
  - Marketplace config: `public.platform_config`, `public.service_categories`, `public.service_types`, `public.urgency_tiers`
  - Reputation: `public.reviews`
```

#### Chunk A2 - Replace mock sign-in/session with real Supabase auth (DONE)

```text
Integration task: Replace the mock sign-in/session behavior in `src/auth/auth.store.ts` with real Supabase-backed authentication while preserving the current login UX. Keep the same validation, loading, locked/unauthorized, and session-expiry user experience already present in the app.

Scope:
- Replace mock token/session generation with real Supabase auth session handling.
- Keep the existing store shape as stable as possible unless a cleaner backend-ready contract is clearly needed.
- Preserve session persistence behavior where appropriate.

Requirements:
- Existing protected routes must continue to work.
- Preserve unauthorized and session-expired handling patterns.
- Do not integrate non-auth modules yet.
- Add/update focused tests for the auth store and route protection if behavior changes materially.
```

#### Chunk A3 - Admin authorization and protected access hardening (DONE)

```text
Integration task: Finish Phase A by enforcing admin authorization on top of live Supabase auth. Use the agreed backend identity strategy to ensure only admin users can access the admin dashboard, while non-admin authenticated users are blocked cleanly.

Scope:
- Add the admin authorization check after successful auth.
- Wire unauthorized admin handling into the existing route protection flow.
- Keep the current visual shell and feedback patterns.

Requirements:
- Do not redesign the login page.
- Keep the current redirect and protected-route flow.
- Add focused tests for admin-allowed vs admin-blocked behavior.
- Document any backend dependency such as `profiles.role = admin` or a separate admin table.
```

### Phase B - Shared Data Layer And Contract Mapping

#### Chunk B1 - Shared Supabase query/mutation layer (DONE)

```text
Integration task: Create the shared data-access layer for live Supabase integration without yet converting entire dashboard modules. Add reusable query/mutation helpers, domain folders, and a clean client-access pattern so later module work does not scatter Supabase calls across page components.

Scope:
- Add domain-oriented access structure for jobs, contractors, settings, finance, and notifications.
- Keep it lightweight and frontend-only unless a server-side helper is clearly required.
- Do not replace large mock modules in this chunk.

Requirements:
- Prefer typed functions that return UI-friendly data contracts.
- Keep the structure easy to expand for realtime and mutations later.
- Preserve current component APIs where practical.
```

#### Chunk B2 - Contract mapping and view-model normalization (DONE)

```text
Integration task: Add backend-to-frontend mapping helpers so current admin screens can consume Supabase data without rewriting all UI components. Normalize database rows into the lifecycle/status naming already used by the dashboard.

Scope:
- Add mappers for jobs, contractors, contractor documents, settings, payments, and withdrawals.
- Explicitly handle status/lifecycle translation.
- Keep naming backend-ready and avoid generic buckets.

Requirements:
- Do not convert whole modules to live fetch yet.
- Focus on mapper contracts and shared transformation utilities.
- Add targeted unit tests for the mapping logic if useful.
```

### Phase C - Read-Only Live Fetch Pass

#### Chunk C1 - Requests read-only live fetch (DONE)

```text
Integration task: Convert the requests module to read-only live Supabase fetches first, preserving the current dispatch/monitoring UI. Replace mock request list/detail loading with real jobs data while keeping the current visual language and interactions stable.

Scope:
- Wire `requests.tsx`, `requests-sidebar.tsx`, and `requests-overlay.tsx` to live jobs data.
- Keep actions read-only if mutation mapping is not yet finalized.
- Preserve filters, tables, badges, and responsive mobile cards.

Requirements:
- Add visible loading, empty, and error handling.
- Keep current table/detail styling intact.
- Do not fully wire write actions in this chunk.
```

#### Chunk C2 - Contractors read-only live fetch (DONE)

```text
Integration task: Convert the contractor operations surface to read-only live Supabase fetches while preserving the existing contractor table, details page, and operational widgets. Replace mock contractor and document reads with live data from contractors, profiles, reviews, and contractor documents.

Scope:
- Contractor list
- Contractor details page
- KYC read-only review data
- Request/transaction history sections where safe

Requirements:
- Keep current risk/performance/payout UI structure.
- Add loading, empty, and error states where needed.
- Avoid write integration in this chunk.
```

#### Chunk C3 - Overview and settings read-only live fetch (DONE)

```text
Integration task: Convert the overview operational dashboard and settings read-only panels to live Supabase data while preserving the current shell and layout. Pull overview counts/aggregates from live jobs, contractors, payments, and related tables, and load settings data from service categories, service types, urgency tiers, and platform config.

Scope:
- `overview.tsx`
- settings read-side data dependencies

Requirements:
- Keep current cards/tables/charts visually unchanged.
- If an aggregate cannot yet be backed safely, keep it clearly marked as temporary or derived.
- Do not wire settings write flows yet.
```

### Phase D - Contractor And KYC Write Integration

#### Chunk D1 - KYC approval/rejection writes (DONE)

```text
Integration task: Connect the KYC review workflow to live Supabase writes while preserving the current read-only review + approve/reject UX. Persist document review decisions, reviewed metadata, and rejection reasons using the contractor documents backend contract.

Scope:
- `contractor-kyc-tab.tsx`
- contractor document mutations

Requirements:
- Preserve confirmation + reason capture.
- Keep naming backend-ready and explicit.
- Add focused tests only for changed interaction logic.
```

#### Chunk D2 - Contractor admin action writes (DONE)

```text
Integration task: Connect contractor admin actions to live backend writes where the schema supports them, and explicitly document any suspension/restore contract gaps that still require schema work. Preserve the current contractor operations UX.

Scope:
- contractor lifecycle/admin actions
- payout blocker/readiness updates if appropriate
- backend contract gap handling for suspension/restore

Requirements:
- Do not fake a final backend contract if the table structure is missing.
- If suspension fields do not exist yet, implement only the supported actions and leave clear TODO boundaries.

Current snapshot note:
- The latest snapshot now includes the D2 suspension / restore audit fields on `public.contractors`: `suspended_at`, `suspended_by`, `suspension_reason`, `restored_at`, `restored_by`, and `restore_reason`.
- The latest snapshot also now includes admin RLS support via `public.is_admin_user()` plus admin contractor/document/jobs/payments/withdrawals/notifications policies.
- D2 now uses real frontend suspend / restore writes against the shared `public.contractors` table from both the contractor list and contractor details page.
- Live contractor reads now derive the current lifecycle state from `suspended_at` versus `restored_at` instead of relying on mock-only local status.
- Payout blocker updates remain deferred because the current admin UI does not yet expose a dedicated payout readiness write flow.
```

### Phase E - Requests And Job Monitoring Write Integration

#### Chunk E1 - Job lifecycle writes (DONE)

```text
Integration task: Connect the requests dispatch workflow to live job lifecycle writes using the current jobs schema and any existing database functions where appropriate. Preserve the current operational queue UX and table/sidebar patterns.

Scope:
- job state transitions
- dispatch/lifecycle updates
- cancellation handling that fits the schema

Requirements:
- Keep status naming aligned to backend job statuses.
- Preserve confirmation/reason capture patterns for destructive actions.
- Add focused interaction tests for the updated write paths if needed.

Current snapshot note:
- `public.jobs` already has the lifecycle statuses and timestamps E1 needs: `requested`, `broadcast`, `accepted`, `contractor_en_route`, `arrived`, `in_progress`, `completed`, `cancelled`, plus `accepted_at`, `started_at`, `completed_at`, `cancelled_at`, `cancellation_reason`, and `cancelled_by`.
- The current snapshot already includes `public.accept_job(...)` and now also includes the admin-specific `Admins can update jobs` policy in the latest pulled migration.
- E1 now uses live frontend job lifecycle writes against the shared `public.jobs` table for complete, return-to-dispatch (`broadcast`), and cancel flows while preserving the existing sidebar confirmation/reason UX.
- More advanced intervention metadata and realtime sync remain in E2; E1 only covers job lifecycle writes that fit the current backend contract.
```

#### Chunk E2 - Operational intervention and realtime (DONE)

```text
Integration task: Extend the live requests integration with operational intervention support and realtime job updates where the current backend contract safely allows it. Preserve the existing monitoring UI without redesign.

Scope:
- realtime subscription setup for jobs
- delayed/intervention visibility where backend fields support it
- safe live refresh of sidebar/overlay state

Requirements:
- Do not invent unsupported backend fields.
- If delayed/dispute metadata is not yet modeled, keep those pieces clearly derived or deferred.

Current snapshot note:
- `public.jobs` is already present in the shared realtime publication, so the admin requests surface can subscribe to job changes without adding duplicate tables or changing the mobile contract.
- The current backend contract still does not expose dedicated delay, dispute, or escalation fields for jobs; those intervention notes remain local operations annotations for now.
- E2 now uses realtime job subscriptions plus safe live refresh of the requests table, sidebar, and tracker state while preserving the existing monitoring UI.
```

### Phase F - Settings Integration

#### Chunk F1 - Categories, service types, urgency tiers live writes

```text
Integration task: Convert the settings marketplace configuration workspace from mock state to live Supabase-backed categories, service types, urgency tiers, and platform config writes while preserving the current settings UI and internal section structure.

Scope:
- service category create/edit/enable/disable
- service type create/edit
- urgency tier updates
- platform config reads/writes

Requirements:
- Preserve reason-capture patterns where already implemented.
- Keep the current Settings route and visual language unchanged.
- Add focused tests only where integration materially changes observable behavior.
```

#### Chunk F2 - Settings contract cleanup and unsupported areas

```text
Integration task: Harden the live settings integration by isolating unsupported settings areas from fully backed ones. Keep categories/pricing live, and clearly boundary placeholder-only sections such as promos or notification campaigns if the backend schema is not ready yet.

Scope:
- supported settings paths fully live
- unsupported settings paths clearly marked or safely isolated

Requirements:
- Do not fake persistence for unsupported backend areas.
- Keep the page coherent and visually unchanged.
```

### Phase G - Finance Integration

#### Chunk G1 - Finance read-only live fetch

```text
Integration task: Convert the transactions finance operations workspace to read-only live Supabase data while preserving the current finance summary cards, urgent queues, filters, table, and sidebar detail patterns. Map current UI states cleanly onto payments, withdrawals, and contractor payout readiness data.

Scope:
- live finance list data
- live detail sidebar data
- live summary cards where safe
- keep write actions disabled or non-live if contract mapping is not ready yet

Requirements:
- Preserve current visual structure.
- Keep badge/status naming explicit and backend-aligned.
- Add loading, empty, and error states.
```

#### Chunk G2 - Finance export and supported write actions

```text
Integration task: Extend the finance integration by making export operate on live filtered data and by wiring only the finance write actions that cleanly map to the existing backend contract. Preserve the current finance operations UX.

Scope:
- live export from fetched finance records
- supported payout/payment state updates only
- clear separation between supported and not-yet-modeled actions

Requirements:
- Do not force reconciliation or reversal flows into the current schema if the backend contract is missing.
- Preserve reason-capture UX for any supported admin action.
```

#### Chunk G3 - Finance schema gap preparation

```text
Integration task: Prepare the finance module for deeper production integration by documenting or scaffolding the missing backend contracts needed for reconciliation, reversals, admin finance audit trails, and payout decision history. Keep this chunk planning-safe if full backend tables are not yet ready.

Scope:
- finance contract gap review
- audit/reconciliation model proposal
- frontend boundary cleanup so unsupported flows are clearly separated

Requirements:
- Prefer explicit TODO boundaries over hidden mock persistence.
- Keep the current UI intact.
```

### Phase H - Realtime Enablement

#### Chunk H1 - Jobs and contractors realtime

```text
Integration task: Add Supabase realtime subscriptions for the most operationally important tables first: jobs and contractors. Preserve the current requests, overview, and contractor monitoring surfaces while letting them refresh from live events.

Scope:
- jobs realtime
- contractors realtime
- safe subscription lifecycle handling

Requirements:
- Avoid duplicate updates and stale-state conflicts.
- Keep current UX calm and stable; do not introduce noisy redraw behavior.
```

#### Chunk H2 - Notifications realtime

```text
Integration task: Add realtime notification handling for the admin-facing workflow where it supports existing operations monitoring. Keep the current visual system intact and only surface changes where the current UI already has a natural home.

Scope:
- notifications subscription
- unread/update handling
- integration with existing operational views if appropriate

Requirements:
- Do not redesign the dashboard shell.
- Keep realtime updates additive, not disruptive.
```

### Phase I - Disputes And Support Backend Expansion

#### Chunk I1 - Backend contract shaping for disputes/support

```text
Planning and integration task: Define and scaffold the backend-ready contract for disputes and support before full live integration. Use the completed frontend disputes/support surfaces as the workflow target, but do not force unsupported persistence into the current schema.

Scope:
- dispute lifecycle contract
- support ticket contract
- evidence, timeline, and resolution logging contract
- payment/refund/reversal linkage points

Requirements:
- Keep frontend naming explicit and backend-ready.
- Prefer separate disputes/support tables over overloading jobs/payments if the workflow is distinct.
```

#### Chunk I2 - Live disputes/support reads and writes

```text
Integration task: Once the backend contract exists, connect the disputes and support surfaces to live Supabase data while preserving the existing table, filter, and right-side detail panel patterns.

Scope:
- disputes list/detail live fetch
- support list/detail live fetch
- reason-captured dispute actions
- audit/evidence/timeline persistence

Requirements:
- Preserve the current operations-first UI.
- Add focused tests for live mutation paths only where behavior materially changes.
```

### Phase J - Final Hardening

#### Chunk J1 - RLS, permissions, and admin safety review

```text
Integration task: Harden the admin integration by reviewing and enforcing Supabase RLS, admin-only access rules, and safe mutation boundaries. Keep UI changes minimal and focus on backend safety and predictable authorization behavior.

Scope:
- RLS review
- admin authorization enforcement
- protected mutation boundaries
- service-role/server-only concerns where needed

Requirements:
- Do not weaken existing protected-route behavior.
- Prefer explicit permission failures over silent fallbacks.
```

#### Chunk J2 - Production readiness cleanup

```text
Integration task: Perform final production-readiness cleanup for the integrated admin app. Focus on observability, retry/error UX, performance, remaining mock fallback removal, and consistency across live modules while preserving the current Figma-backed interface.

Scope:
- remove leftover mock-only normal-path behavior
- performance/pagination cleanup
- retry/error-state polish
- audit/admin activity visibility where available

Requirements:
- Keep the visual shell intact.
- Avoid broad redesign; this is a hardening pass, not a new UI phase.
```

## Recommended Combined Prompt Packs

If you want to save credits by combining prompts, these are the safest bundles:

- **Pack 1:** A1 + A2
- **Pack 2:** A3 + B1
- **Pack 3:** B2 + C1
- **Pack 4:** C2 + C3
- **Pack 5:** D1 + D2
- **Pack 6:** E1 + E2
- **Pack 7:** F1 + F2
- **Pack 8:** G1 + G2
- **Pack 9:** H1 + H2
- **Pack 10:** I1 + I2
- **Pack 11:** J1 + J2

Best small-start sequence:

1. A1
2. A2
3. A3
4. B1
5. B2
6. C1
7. C2
8. C3

## Definition Of Integration Success

The admin app is considered truly backend-integrated when:

- admin auth is real
- core modules no longer rely on mock seeds for normal behavior
- writes persist to Supabase for at least auth, requests, contractors/KYC, and settings
- overview aggregates come from live data
- transactions are at least live-read integrated
- disputes/support have either live backend tables or are intentionally held back pending schema work
- RLS and admin authorization are enforced
