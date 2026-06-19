# AidSprint Admin Integration Task Readiness Plan

Last updated: 2026-06-19

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

**POST-AUDIT UPDATE (2026-06-19):** The frontend execution board is complete and the majority of backend integration is also complete.

- Phase 1 complete — Operations surfaces (overview, requests, contractors, KYC)
- Phase 2 complete — Marketplace + disputes
- Phase 3 complete — Finance ops
- Phase 4 complete — Auth + routes
- **Phases A-L (backend integration):** ~80% complete — most core modules are live-backed

Current status source: [current-task.md:L23-L42](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/current-task.md#L23-L42)

**Important current reality (corrected post-audit):**

- Auth is **LIVE** (real Supabase auth, admin role check, MFA TOTP, session persistence) — NOT mock/local
- Most screens use **LIVE Supabase data** — NOT mock datasets
- Supabase schema supports: jobs, contractors, contractor documents, categories, service types, urgency tiers, payments, withdrawals, notifications, reviews, realtime, support_tickets, disputes, dispute_evidence, dispute_events, promo_codes, promo_code_redemptions, notification_templates, notification_campaigns, notification_deliveries, admin_security_settings, admin_mfa_recovery_codes, admin_security_events, finance_admin_events, profiles with admin role
- **What is NOT yet integrated:** evidence file uploads (I3), support message threading (I4), dispute refund linkage to payments (I5), admin audit logging for all mutations (J3), error recovery/circuit breaker (J4), comprehensive RLS audit (J5), end-to-end testing (P1-P4), rate limiting & abuse prevention (Q1-Q4), finance write contract (M1-M2), intervention contract decision (O1-O2)

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

### Completed (live-backed and working)

- Admin auth with real Supabase (A1-A3)
- Shared data layer with typed domain modules (B1-B2)
- Requests/job monitoring with realtime (C1, E1-E2, H1)
- Contractor ops with suspend/restore/realtime (C2, D1-D2, H1)
- Overview with live aggregates (C3)
- Settings marketplace with live writes (F1-F2)
- Finance read-only with live export (G1-G3)
- Disputes/support with live reads + action writes (I1-I2)
- Notifications with realtime (H2)
- Admin MFA/TOTP with recovery codes (K1-K2)
- Promos and notification campaigns — live CRUD with local fallback (L1-L2)
- User management cleanup — unsupported actions disabled (N1-N2)
- RLS hardening — admin session guard + actor verification (J1-J2)

### Needs backend decisions before full production integration

- Finance write contract (M1-M2)
- Request intervention contract (O1-O2)

### Needs implementation

- **I3** — Evidence file handling for disputes (Storage bucket + upload/download UI)
- **I4** — Support ticket message threading (conversation model + read tracking)
- **I5** — Dispute refund linkage to payments (payment table coordination)
- **J3** — Admin audit logging for all mutations (beyond MFA events)
- **J4** — Error recovery with exponential backoff and circuit breaker
- **J5** — Comprehensive RLS audit and permission matrix testing
- **P1-P4** — End-to-end tests, permission matrix tests, error scenario tests, performance tests
- **Q1-Q4** — Rate limiting strategy, auth rate limiting, mutation rate limiting, abuse detection

## Recommended Integration Order (Remaining Work)

1. **I3** — Evidence file handling (Storage + upload/download UI)
2. **I4** — Support message threading (conversation model)
3. **I5** — Dispute refund linkage (payment table coordination)
4. **M1-M2** — Finance write contract design + live writes
5. **O1-O2** — Intervention contract decision + UI alignment
6. **J3** — Admin audit logging expansion
7. **J4** — Error recovery with retry/circuit breaker
8. **J5** — RLS comprehensive audit and permission matrix
9. **P1-P4** — Testing suite
10. **Q1-Q4** — Rate limiting and abuse prevention

---

## ⚠️ DISCREPANCY LOG (Post-Audit 2026-06-19)

The following discrepancies were found between what the Integration Plan previously stated and what the codebase actually contains. These have been corrected in this document:

| # | Chunk | Previously Marked | Actual Status | Correction Applied |
|---|-------|-------------------|---------------|-------------------|
| 1 | **Auth (A1-A3)** | "Medium-Low schema readiness" | ✅ **LIVE** — Real Supabase auth, admin role via `profiles.role`, MFA TOTP, recovery codes, security events | Matrix updated |
| 2 | **Disputes** | "Low schema readiness, not ready enough" | ✅ **LIVE** — `disputes`, `dispute_evidence`, `dispute_events` tables exist; live reads + action writes in `disputes.tsx` | Matrix updated |
| 3 | **Support** | "Needs backend ticket model" | ✅ **LIVE** — `support_tickets`, `support_ticket_events` tables exist; live reads + status writes in `support.tsx` | Matrix updated |
| 4 | **Promos (L2)** | NOT DONE | ✅ **ACTUALLY DONE** — `promo_codes` + `promo_code_redemptions` tables; live CRUD in `marketplace-config.tsx` with local fallback | L2 marked DONE |
| 5 | **Notification Campaigns** | "Not ready, generic only" | ✅ **LIVE** — `notification_campaigns`, `notification_templates`, `notification_deliveries` tables; live CRUD in `marketplace-config.tsx` | Matrix updated |
| 6 | **Admin MFA/Security** | Not in original matrix | ✅ **LIVE** — TOTP enroll/verify/disable, recovery codes, password change, security events logging, `admin_security_settings`, `admin_mfa_recovery_codes`, `admin_security_events` tables | Row added to matrix |
| 7 | **Current State: "auth is still mock/local"** | Stale statement | ❌ **INCORRECT** — Auth is 100% real Supabase, not mock | Corrected in Current State section |
| 8 | **Current State: "most screens still use mock datasets"** | Stale statement | ❌ **INCORRECT** — Almost all screens use live Supabase data with mock fallback only when Supabase is unavailable | Corrected in Current State section |
| 9 | **Current State: "schema does not yet fully support disputes, support tickets, promo codes"** | Stale statement | ❌ **INCORRECT** — These tables all exist and are populated in the latest schema | Corrected in Current State section |

---

## Phase Plan

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
- When you ask me to "check the current Supabase state", I should read the newest `supabase/migrations/*_remote_schema.sql` schema snapshot first (highest timestamp).
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
- The latest snapshot includes the D2 suspension/restore audit fields on `public.contractors`: `suspended_at`, `suspended_by`, `suspension_reason`, `restored_at`, `restored_by`, and `restore_reason`.
- Admin RLS support via `public.is_admin_user()` plus admin contractor/document/jobs/payments/withdrawals/notifications policies.
- D2 uses real frontend suspend/restore writes against the shared `public.contractors` table from both the contractor list and contractor details page.
- Live contractor reads derive the current lifecycle state from `suspended_at` versus `restored_at` instead of relying on mock-only local status.
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
```

### Phase F - Settings Integration

#### Chunk F1 - Categories, service types, urgency tiers live writes (DONE)

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

#### Chunk F2 - Settings contract cleanup and unsupported areas (DONE)

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

#### Chunk G1 - Finance read-only live fetch (DONE)

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

#### Chunk G2 - Finance export and supported write actions (DONE)

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

#### Chunk G3 - Finance schema gap preparation (DONE)

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

#### Chunk H1 - Jobs and contractors realtime (DONE)

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

#### Chunk H2 - Notifications realtime (DONE)

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

#### Chunk I1 - Backend contract shaping for disputes/support (DONE)

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

#### Chunk I2 - Live disputes/support reads and writes (DONE)

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

#### Chunk I3 - Evidence file handling for disputes (NOT DONE)

```text
Integration task: Add safe file upload/download/viewing for dispute evidence using Supabase Storage while preserving the dispute detail panel UX. Wire the dispute evidence surface to persistent file storage with proper admin-only RLS protection.

Scope:
- add file upload form to the dispute detail panel
- store uploaded files in Supabase Storage at `admin/disputes/<dispute_id>/` paths
- persist file metadata (name, size, type, uploaded_at, uploaded_by) to `public.dispute_evidence` table
- add file download/view actions in the evidence timeline
- handle storage errors, file-size limits, and retry behavior
- remove any local-only file handling from the current UI

Requirements:
- preserve the current dispute detail panel structure
- keep file uploads and downloads behind admin authorization
- use Supabase Storage buckets with RLS/security rules for admin-only access
- add focused tests for file upload success, failure, and permission scenarios
- validate file types and sizes server-side before acceptance

Current implementation note:

- `public.dispute_evidence` table exists with columns: `id`, `dispute_id`, `evidence_type`, `file_path`, `file_name`, `file_size`, `file_type`, `uploaded_by`, `uploaded_at`, `metadata`, `created_at`.
- `src/components/dashboard/disputes/disputes.tsx` loads evidence from the table but has no upload UI or download handlers.
- Supabase Storage bucket `admin/disputes/` with RLS policies does not yet exist; needs creation.
- No file size/type validation or Supabase Storage integration functions in `src/lib/supabase/data.ts` yet.
- Backend storage contract and error-handling patterns need definition.
```

#### Chunk I4 - Support ticket message threading (NOT DONE)

```text
Integration task: Add message creation, retrieval, and read-state tracking for support tickets so the timeline flows as a proper conversation instead of a flat event log. Preserve the support ticket detail panel while enabling sequential messages with read/unread tracking.

Scope:
- extend `public.support_ticket_events` or create `public.support_ticket_messages` table with message ordering
- add message creation endpoint/function to the support detail panel
- implement read-state tracking (`message_read_at` per message per recipient)
- auto-add message sender as participant on first response
- retrieve and display messages in chronological order with read indicators
- preserve existing support event/status timeline alongside conversation

Requirements:
- use server timestamps (not client timestamps) for message ordering
- keep messages and events separate in the UI (conversation vs status timeline)
- support read-state so admins know which messages have been read
- add focused tests for message creation, ordering, and read-state edge cases
- handle concurrent message inserts without ordering conflicts

Current implementation note:

- `public.support_ticket_events` table exists and stores event_type, message, metadata, but no `message_read_at` or ordering metadata.
- `public.support_tickets` has basic `created_at`, `updated_at`, `resolved_at` but no conversation thread tracking.
- `src/lib/supabase/data.ts` has `listEventsByTicketIds()` but no message creation or read-state update functions.
- `src/components/dashboard/support/support.tsx` shows a flat event list but no message-threading UI.
- No participant tracking or auto-add logic exists yet.
```

#### Chunk I5 - Dispute refund linkage and payment reversal coordination (NOT DONE)

```text
Integration task: Link resolved disputes to actual payment reversals and refund tracking so dispute resolution metadata becomes actionable finance operations. Connect the dispute resolution actions to the payments table and finance audit trail.

Scope:
- extend `public.disputes` to track linked `payment_id` or `withdrawal_id` when resolution involves a refund
- add refund/reversal functions in the data layer that update both dispute and payment records together
- persist resolution actions (refund approved, partial refund, chargeback initiated) to both `dispute_events` and finance audit log
- validate that only authorized finance admins can execute reversals
- track refund status: pending, processing, completed, failed
- handle refund failure scenarios and retry logic

Requirements:
- keep dispute and payment records consistent across resolution
- use transactions or multi-step mutations to avoid partial failures
- document the boundary between admin-initiated reversals vs Stripe/payment-processor reversals
- add focused tests for successful refund linking, refund failures, and concurrent refund prevention
- preserve the dispute resolution UI while adding a "refund status" indicator

Current implementation note:

- `public.disputes` table has `status`, `resolution_type`, `requested_resolution` but no `payment_id` or `refund_status` field.
- `public.payments` table has `status` (pending, processing, authorized, paid, captured, failed, refunded, cancelled) but no `refund_initiated_by`, `refund_reason`, or `refund_dispute_id`.
- `src/lib/supabase/data.ts` has `supabaseDisputes.applyAction()` that can set resolution_type to "refund" or "partial_refund" as metadata, but doesn't actually update payment records.
- No refund linking, reversal coordination, or payment-audit integration exists yet.
- The contract for admin vs server-side refund execution is not yet defined.
```

### Phase J - Final Hardening

#### Chunk J1 - RLS, permissions, and admin safety review (DONE)

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

#### Chunk J2 - Production readiness cleanup (DONE)

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

#### Chunk J3 - Admin audit logging expansion for all mutations (NOT DONE)

```text
Integration task: Extend admin audit logging beyond MFA security events to capture all sensitive admin mutations (contractor suspend/restore, KYC approve/reject, dispute resolution, job cancellation, payout actions, etc.) so the entire admin activity is auditable and traceable.

Scope:
- design `public.admin_action_log` table (or extend `admin_security_events`) to capture all mutation types
- add audit logging to every mutation path in `src/lib/supabase/data.ts`: contractors, jobs, disputes, support, settings, finance
- capture: action type, actor id, target resource, reason, timestamp, metadata, result (success/failure)
- add RLS policies so admins can read their own and other admins' actions (for transparency)
- create a data layer function `insertAdminAuditLog()` used consistently by all mutations
- implement audit log retrieval for compliance and investigation workflows

Requirements:
- do not slow down mutations with synchronous audit logging; batch or async where safe
- keep audit messages explicit and searchable (good action names, consistent reason capture)
- add focused tests for audit log capture success, failure, and audit trail integrity
- support audit log export for compliance reporting
- preserve the current mutation UX; auditing should be invisible to the user experience

Current implementation note:

- `public.admin_security_events` table exists and is used for MFA-related audit events only.
- No `admin_action_log` table yet; the schema does not capture general mutations.
- `src/lib/supabase/data.ts` mutations (suspend contractor, approve KYC, resolve dispute, etc.) do not log their actions.
- No centralized audit logging pattern exists; each mutation is self-contained.
- No audit log retrieval endpoint or compliance export exists.
- The admin action audit requirement from the PRD has no backend implementation yet.
```

#### Chunk J4 - Error recovery with exponential backoff and circuit breaker (NOT DONE)

```text
Integration task: Add resilience patterns to the data layer so transient failures (network timeouts, temporary Supabase unavailability) are retried automatically while permanent failures fail fast and alert the operator.

Scope:
- implement exponential backoff retry logic with configurable max attempts and base delay
- add circuit breaker pattern to detect persistent failures and prevent cascading errors
- differentiate transient errors (network, timeout) from permanent errors (permission denied, validation failure)
- add retry hooks to all critical read and write paths in `src/lib/supabase/data.ts`
- track retry attempts and expose retry metrics/instrumentation
- implement graceful degradation when retry limits are exceeded

Requirements:
- do not retry permission-denied or validation errors; fail fast
- use jittered exponential backoff to avoid thundering herd
- set sensible defaults: initial delay 300ms, max delay 10s, max 3-5 attempts
- add focused tests for successful retries, permanent failures, and circuit breaker state transitions
- provide clear error messages to operators when max retries exceeded
- do not change the public API of data layer functions; retries should be transparent

Current implementation note:

- `src/lib/supabase/data.ts` mutations return `SupabaseResult<T>` with `ok: boolean` and `message: string`, but have no retry logic.
- UI components show "Retry" buttons but call the same mutation function again (no backoff).
- No circuit breaker state machine exists; all failures are treated uniformly.
- Network timeouts and database errors have no retry differentiation.
- No instrumentation or metrics collection for retry attempts.
```

#### Chunk J5 - RLS comprehensive audit and permission matrix testing (NOT DONE)

```text
Integration task: Conduct comprehensive RLS policy testing and document the complete admin permission matrix so the backend enforces intended boundaries and no privilege escalation is possible. Verify that multi-admin scenarios are handled safely.

Scope:
- test read access: each table/resource type, single admin vs multiple admins, admin vs non-admin
- test write/mutation access: each mutation type, with and without proper actor id, with and without required fields
- test RLS policy behavior: cascade deletes, policy interactions, edge cases
- document the admin permission matrix (who can do what to what resources)
- test multi-admin scenarios: concurrent mutations, actor id validation, session isolation
- test permission failure modes: RLS violations, policy-denied operations, authorization boundary errors

Requirements:
- add comprehensive RLS test suite (20-30+ test cases)
- document the intended permission matrix and test coverage
- identify and remediate any policy gaps or unintended privilege escalation paths
- include tests for the specific admin role model in use (auth metadata vs profiles.role)
- provide step-by-step instructions for auditing RLS policies in production

Current implementation note:

- `src/lib/supabase/data.test.ts` has basic authorization guard tests (~5-10 test cases).
- No comprehensive RLS policy matrix or permission testing exists.
- The scope of admin mutations (who can suspend which contractors, who can resolve which disputes, etc.) is not explicitly tested.
- RLS policies in the latest migration include admin-only access but are not comprehensively validated.
- Multi-admin scenarios (concurrent edits, actor id mismatches) have minimal test coverage.
- No compliance documentation of the admin permission model exists.
```

### Phase K - Admin Auth Hardening And Security Settings

#### Chunk K1 - Admin 2FA/MFA backend contract and auth flow design (DONE)

```text
Planning and integration task: Extend the admin auth foundation with a real second-factor strategy that fits Supabase and the current admin-only access model. Keep the login and route shell visually stable while defining the backend-safe MFA contract, recovery flow, and enforcement rules for admin accounts.

Scope:
- choose the MFA method for admins (TOTP authenticator app)
- define enrollment, challenge, recovery, and reset rules
- define where MFA-required state is enforced in the current auth flow
- define any Supabase auth settings, policies, or supporting tables needed

Requirements:
- preserve the current login visual language
- do not bolt on fake MFA UI without a real backend path
- keep admin authorization and session-expiry behavior intact
- document whether MFA is required for all admins or introduced in staged rollout
```

#### Chunk K2 - Persist live security settings and MFA management (DONE)

```text
Integration task: Connect the Settings security surface to real backend-backed security actions once the MFA contract is approved. Preserve the current settings route and visual shell while making password/security actions real and explicit.

Scope:
- connect password update flow where supported
- add MFA enrollment / disable / reset actions for admins
- add clear success, failure, recovery, and re-auth states
- ensure security actions respect the current protected-session model

Requirements:
- keep the current security panel styling intact
- prefer explicit unsupported states over silent no-op toasts
- add focused tests for live security mutation paths only where behavior materially changes
```

### Phase L - Promos And Notification Campaigns Backend Expansion

#### Chunk L1 - Promo and notification campaign schema/contracts (DONE)

```text
Planning and backend-contract task: Add the missing backend shape for promo codes and notification campaigns so the current local-only settings sections can become real. Treat the current marketplace configuration UI as the workflow target and keep the shared mobile/admin domain model in mind.

Scope:
- define `promo_codes` and related rule / usage tables as needed
- define notification template / campaign tables and delivery metadata
- define admin-only read/write policies
- define how these contracts map to existing settings UI states and filters

Requirements:
- do not overload generic notifications rows for campaign authoring if the workflow is distinct
- keep naming explicit and backend-ready
- provide planning-safe SQL under `supabase/manual_sql/` when schema changes are required
```

#### Chunk L2 - Replace local-only promos and campaign settings with live integration (DONE)

```text
Integration task: Convert the local-only promos and notification campaign areas in the marketplace/settings workspace into live Supabase-backed flows while preserving the current page structure and section layout.

Scope:
- promo create/edit/enable/disable/delete
- notification template/campaign create/edit/enable/disable where supported
- live load, empty, error, and retry handling for the currently local-only sections
- remove local-only success messaging once persistence is real

Requirements:
- preserve the current Settings and Marketplace visual language
- do not imply persistence for any action until the backend contract is live
- add focused tests only for the newly live mutation paths
```

**⚠️ DISCREPANCY CORRECTION:** This chunk was previously marked as NOT DONE. After codebase audit, it is actually DONE. The `marketplace-config.tsx` and `marketplace-config.data.ts` implement live CRUD for both promos and notification campaigns with a local fallback when Supabase is unavailable. The `promo_codes`, `promo_code_redemptions`, `notification_templates`, `notification_campaigns`, and `notification_deliveries` tables exist in the schema with admin RLS policies.

### Phase M - Finance Writes And Admin Audit Contract

#### Chunk M1 - Finance write contract, policies, and audit trail design (NOT DONE)

```text
Planning and backend-contract task: Define the supported admin finance write paths that can safely move beyond read-only behavior. Keep mobile/shared payment flows intact and prefer additive admin audit/event models over risky direct-table overload.

Scope:
- define which payment/withdrawal admin actions are truly supported first
- add required admin update policies and audit/event tables
- define actor, reason, and timestamp capture requirements
- define which actions remain server-only or Stripe-mediated

Requirements:
- do not force reconciliation/reversal workflows into unsupported direct writes
- prefer explicit finance admin events / audit records over hidden state changes
- document the exact boundary between live-supported actions and deferred actions

Current implementation note:

- `public.payments` table has statuses: pending, processing, authorized, paid, captured, failed, refunded, cancelled.
- `public.withdrawals` table has statuses: pending, processing, completed, failed.
- `public.finance_admin_events` table exists with actor_id, payment_id, withdrawal_id, action, reason, metadata, created_at.
- Schema has admin read policies (`Admins can view payments`, `Admins can view withdrawals`) but NO admin update policies for finance writes.
- `src/lib/supabase/data.ts` finance reads are live; all status actions remain blocked/read-only in the UI.
- No Stripe/payment-processor integration for admin-initiated reversals.
```

#### Chunk M2 - Live finance status actions for supported admin workflows (NOT DONE)

```text
Integration task: Replace the current read-only finance action boundary with real supported writes once the finance contract and RLS policies are ready. Preserve the existing transactions workspace layout, filters, detail sidebar, and reason-capture UX.

Scope:
- wire supported payment/withdrawal status actions
- persist reason-captured admin decisions
- surface audit history where available
- keep unsupported finance actions clearly blocked

Requirements:
- preserve current finance UX and badge naming
- do not re-enable local-only toasts for unsupported live records
- add focused interaction coverage for the supported live write paths
```

### Phase N - User Management Persistence Cleanup

#### Chunk N1 - Persist user lifecycle/admin actions where backend support exists (DONE)

```text
Planning and integration task: Review the Users and User Details surfaces and connect only the account lifecycle actions that have a real backend contract. Preserve the current users table, details page, and modal patterns.

Scope:
- define whether user activate/deactivate maps to auth, profile, or linked-method state
- persist supported user account actions from both the users list and the user details page
- keep authorization, actor identity, and auditability explicit
- add any minimal backend contract needed for admin-triggered user lifecycle actions

Requirements:
- do not fake persistence for user actions that still lack backend support
- keep the current UX but remove misleading success states
- prefer one shared action path so users list and user details stay consistent
```

#### Chunk N2 - Remove or disable unsupported user-profile request actions (DONE)

```text
Integration task: Clean up the user-details request-history workflow so unsupported request-side actions are either truly persisted or explicitly disabled. Keep the current page and request sidebar patterns visually intact.

Scope:
- review current request status actions launched from the user profile context
- persist supported actions if a safe backend path already exists
- disable or boundary unsupported user-context request actions that remain client-side only
- remove leftover mock-only normal-path behavior in this feature area

Requirements:
- prefer clear disabled states over silent client-side-only status changes
- preserve navigation from Users to User Details
- add focused tests where user-profile actions change materially
```

### Phase O - Request Intervention Contract Decision

#### Chunk O1 - Decide where intervention notes belong in the backend contract (NOT DONE)

```text
Planning task: Resolve the current product-contract ambiguity for delay, escalation, intervention, and dispute-adjacent notes on requests/jobs. Use the existing requests, disputes, and support workflows as the frontend target and decide where this operational metadata should persist.

Scope:
- compare these options:
  - add fields directly to `jobs`
  - add a separate job-operations / intervention log table
  - move dispute/support-style notes fully into disputes/support records
- define actor, reason, status, and timeline requirements
- define which operational notes must be realtime-visible

Requirements:
- choose one primary contract direction before wider write expansion
- avoid duplicating the same intervention data across jobs and disputes/support
- keep the admin workflow operationally clear and audit-friendly

Current implementation note:

- `public.jobs` has no dedicated delay, dispute, escalation, or intervention fields.
- `public.disputes` and `public.support_tickets` exist but are separate workflow tables.
- No decision has been made on where intervention metadata should persist.
- Admin operators currently have no way to annotate jobs with intervention notes that persist to Supabase.
```

#### Chunk O2 - Align requests/support/disputes UI boundaries to the chosen contract (NOT DONE)

```text
Integration task: After the intervention contract is chosen, align the requests workflow and adjacent support/disputes surfaces so each admin note/action persists in the right place. Preserve the current tables, sidebars, overlays, and Figma-backed shell.

Scope:
- wire intervention notes to the chosen backend model
- update requests live state messaging to remove temporary/local-only notes where possible
- keep disputes/support linkage explicit when intervention becomes formalized
- clean up any now-obsolete local operations annotations

Requirements:
- keep the current monitoring UI calm and stable
- prefer explicit domain boundaries over mixed request/dispute semantics
- add focused tests for any live intervention write/read paths that become supported
```

### Phase P - Comprehensive Integration Testing

#### Chunk P1 - End-to-end admin workflow tests (NOT DONE)

```text
Integration task: Add comprehensive end-to-end test suites that exercise complete admin workflows from login through action completion, validating that major user journeys work reliably and consistently.

Scope:
- happy-path workflows: admin login → request dispatch → dispute resolution → payout approval
- critical failure scenarios: session expiry, permission denied, network failure during mutation
- cross-module workflows: contractor suspend → view in list → check details → restore
- realtime workflows: job status change → sidebar update → live counter
- test setup: seed realistic test data, tear down cleanly

Requirements:
- use Vitest + testing-library or Playwright for integration tests
- each test should validate UI state, network calls, and final database state
- tests should be deterministic and not depend on execution order
- provide clear failure messages identifying which workflow step failed
- keep tests focused on user-visible behavior, not implementation details

Current implementation note:

- Focused unit/component tests exist for specific features (contractors, KYC, support, disputes).
- No end-to-end workflow tests exist that validate multiple steps together.
- Test infrastructure supports unit tests but E2E test patterns are not yet established.
- No test data seeding utilities exist for realistic multi-step scenarios.
```

#### Chunk P2 - Authorization and permission matrix testing (NOT DONE)

```text
Integration task: Validate the complete admin permission matrix through comprehensive testing. Ensure that authorization boundaries are enforced correctly and that no unintended privilege escalation is possible.

Scope:
- test matrix: each admin action × each role/permission × allowed/denied scenarios
- test multi-admin: two admins, same action, different authorization states
- test session: action with valid session, expired session, mismatched actor id
- test RLS: permission denied on read, permission denied on write, cascading deletes
- document findings: which actions are blocked as intended, which passed, which need remediation

Requirements:
- create a test matrix spreadsheet mapping actions to expected outcomes
- add 30+ permission test cases covering role boundaries
- clearly label tests as "passing boundary enforcement" or "gap found"
- suggest RLS policy fixes for any gaps identified
- test both positive (allowed) and negative (denied) scenarios

Current implementation note:

- Basic admin authorization tests exist in `src/lib/supabase/data.test.ts`.
- No comprehensive permission matrix or multi-admin testing.
- The RLS policies are in place but not systematically validated.
- No permission gap analysis or compliance documentation exists.
```

#### Chunk P3 - Error scenario and failure mode testing (NOT DONE)

```text
Integration task: Add comprehensive test coverage for error scenarios and failure modes so the admin UI handles problems gracefully and operators understand what went wrong.

Scope:
- network failures: timeout, 500 error, connection refused
- data integrity: RLS violations, constraint violations, concurrent conflict
- state mismatch: actor id mismatch, expired session, stale data
- partial failures: mutation succeeds but audit log fails, evidence upload succeeds but metadata fails
- user input: invalid reason, missing required fields, malformed data

Requirements:
- each test should validate error message clarity and user actionability
- test both API error responses and UI error rendering
- verify that failed mutations don't corrupt application state
- provide operators with clear next steps (retry, contact support, etc.)
- add 20+ error scenario test cases

Current implementation note:

- Some error handling exists in components (loading, empty states, error messages).
- No systematic error scenario testing suite.
- No validation of error message quality or operator guidance.
- Partial failure modes (e.g., mutation succeeds but audit log fails) are not tested.
```

#### Chunk P4 - Performance baseline and load testing (NOT DONE)

```text
Integration task: Establish performance baselines and validate that the admin system can handle realistic load without degradation.

Scope:
- baseline latency: measure query/mutation response times under normal load
- pagination: validate that large lists (1000+ records) load efficiently
- concurrent operations: test 2-5 admins performing mutations simultaneously
- realtime updates: measure latency of job status changes appearing in UI
- memory/resource usage: profile component re-renders and memory leaks

Requirements:
- establish baseline targets: queries <500ms, mutations <1s, realtime updates <2s
- use performance profiling tools (Lighthouse, React Profiler, browser DevTools)
- add load tests with realistic data volumes
- document findings and identify optimization opportunities
- test pagination and filtering performance on large lists

Current implementation note:

- No baseline performance tests or load testing exists.
- No performance targets documented.
- Pagination logic exists but is not tested under load.
- Realtime update latency is not measured.
- No performance profiling or optimization has been done.
```

### Phase Q - Rate Limiting And Abuse Prevention

#### Chunk Q1 - Rate limiting strategy and backend contract (NOT DONE)

```text
Planning task: Define the rate-limiting strategy for admin operations to prevent abuse, brute-force attacks, and system overload. Document the limits, recovery rules, and monitoring approach.

Scope:
- define rate limits per endpoint: authentication (strict), mutations (moderate), reads (generous)
- suggested limits: auth 5 attempts/15min, mutations 100/min per admin, reads 1000/min
- define reset/recovery rules: what triggers unlock, how long lockout lasts
- define monitoring and alerting: which patterns should trigger security team alerts
- define the contract between frontend and backend for rate limit responses (429, Retry-After)

Requirements:
- rate limits should not interfere with normal admin workflows
- clearly distinguish between admin-initiated rate limiting (per-action quota) and system-wide limits
- document recovery procedures for locked admins
- define abuse patterns that should trigger alerts (repeated failed attempts, bulk operations, etc.)
- coordinate with security team on response procedures

Current implementation note:

- Supabase Auth has built-in rate limiting configured in `supabase/config.toml`.
- No custom admin mutation rate limiting or abuse detection exists.
- No monitoring or alerting infrastructure for rate limit events.
- The contract for admin-specific rate limits is not yet defined.
```

#### Chunk Q2 - Auth rate limiting and brute-force protection (NOT DONE)

```text
Integration task: Implement strict rate limiting on authentication endpoints to prevent brute-force login attacks and enforce progressive delays on failed attempts.

Scope:
- rate limit login attempts: 5 per 15 minutes per IP + email combination
- progressive delays: immediate on first failure, 1s delay after 3rd, 5s after 5th
- account lockout: temporary lock after 10 failed attempts, unlock after 30 minutes or manual reset
- track failed attempts: store in `admin_login_attempts` table for audit
- Retry-After header: indicate when next attempt is allowed
- security event logging: log all lockout and unlock events to `admin_security_events`

Requirements:
- implement at the server layer (not just frontend validation)
- support lockout reset via recovery code or support team intervention
- measure and log all rate-limit violations
- test that legitimate admins are not locked out by attackers abusing their email
- coordinate with security team on lockout notification procedures

Current implementation note:

- Supabase Auth has default rate limiting but lacks progressive delay and admin-specific lockout.
- `admin_login_attempts` table exists in schema but is not populated.
- No server-side login attempt tracking in `server/routes/`.
- No Retry-After header or progressive delay logic.
- No account lockout/unlock mechanism.
```

#### Chunk Q3 - Mutation rate limiting and operation-specific throttling (NOT DONE)

```text
Integration task: Add rate limiting to admin mutations (contractor suspend, KYC approval, dispute resolution, payout actions) to prevent spam and bulk abuse while allowing normal operations.

Scope:
- global mutation limit: 100 mutations per minute per admin
- per-operation limits: suspend 5/min, approve_kyc 10/min, resolve_dispute 5/min
- per-resource limits: prevent bulk operations on same resource (5 edits/min on same contractor)
- sliding window tracking: use time-based buckets to track rate
- enforce via middleware: check limits before executing mutations
- response codes: 429 Too Many Requests with Retry-After header

Requirements:
- limits should not block normal admin work (single actions per few seconds)
- track limits in Redis or Postgres for persistence
- provide admins with clear feedback on rate-limit status
- log all rate-limit violations to `admin_action_log`
- allow security team to adjust limits per admin if needed

Current implementation note:

- No mutation rate limiting exists in the data layer or server routes.
- No per-operation or per-resource throttling logic.
- No tracking of mutation frequency or abuse patterns.
- Server middleware does not validate rate limits before mutations.
```

#### Chunk Q4 - Abuse detection and alerting (NOT DONE)

```text
Integration task: Implement abuse detection that identifies suspicious patterns and alerts the security team for investigation and response.

Scope:
- pattern detection: volume spikes, unusual access times, geographic anomalies, failed operation chains
- alert types: high volume in short period, new IP address, many failures in a row, bulk operations on sensitive resources
- alert routing: direct to security team inbox/channel with contextual details
- compliance dashboard: daily/weekly report of abuse attempts and responses
- lockdown procedures: manual admin disable if compromise suspected, with audit trail

Requirements:
- alerts should be actionable and not false-positive prone
- include context in alerts: which admin, which operations, which resources, timestamps
- preserve all abuse-related events in audit log for post-incident analysis
- coordinate with incident response team on alert response procedures
- document the abuse detection rules and how to tune sensitivity

Current implementation note:

- No abuse detection logic exists in the codebase.
- No alerting infrastructure for security events.
- `admin_security_events` and `admin_action_log` tables capture data but have no anomaly detection.
- No compliance reporting or abuse analysis tools.
- Security team has no way to investigate suspicious admin activity patterns.
```

---

## Module Readiness Matrix (Corrected Post-Audit)

| Module | Frontend Ready | Schema Ready | Integration Readiness | **Actual Status** | Notes |
|--------|---------------|-------------|---------------------|-------------------|-------|
| Auth | High | High | High | ✅ **LIVE** | Real Supabase auth, admin role check, route protection, MFA TOTP enrollment working |
| Requests / Jobs | High | High | High | ✅ **LIVE** | Live reads + lifecycle writes (complete/cancel/broadcast) + realtime subscriptions |
| Contractors | High | High | High | ✅ **LIVE** | Live reads + lifecycle writes (suspend/restore with audit fields) + realtime |
| Overview | High | High | High | ✅ **LIVE** | Aggregates from live jobs, contractors, payments data |
| Settings categories/pricing | High | High | High | ✅ **LIVE** | Categories, service types, urgency tiers, platform config all live CRUD |
| Transactions / payouts | High | Medium | Medium | ✅ **LIVE (read-only)** | Payments + withdrawals live reads; export works; writes blocked pending finance contract |
| Disputes | High | High | High | ✅ **LIVE** | Live reads + action mutation writes; evidence timeline from DB |
| Support | High | High | High | ✅ **LIVE** | Live reads + status update writes; audit events persisted |
| Promos | High | High | High | ✅ **LIVE** | `promo_codes` + `promo_code_redemptions` tables; live CRUD with local fallback |
| Notification campaigns | High | High | High | ✅ **LIVE** | `notification_campaigns`, `notification_templates`, `notification_deliveries`; live CRUD with local fallback |
| Admin MFA / Security | High | High | High | ✅ **LIVE** | TOTP enroll/verify/disable, recovery codes, password change; `admin_security_settings`, `admin_mfa_recovery_codes`, `admin_security_events` tables |
| Users | High | High | High | ✅ **LIVE (read-only)** | Profile reads live; activate/deactivate disabled in live mode |
| Evidence file handling | Low | Medium | Low-Medium | ❌ **NOT DONE (I3)** | `dispute_evidence` table exists but no Storage bucket, upload UI, or download handlers |
| Support message threading | Low | Low | Low | ❌ **NOT DONE (I4)** | `support_ticket_events` is a flat event log; no threading, read tracking, or message creation |
| Dispute refund linkage | Low | Low | Low | ❌ **NOT DONE (I5)** | Resolution metadata can say "refund" but doesn't update `payments` table or coordinate with processor |
| Finance writes | Medium | Low | Low-Medium | ❌ **NOT DONE (M1-M2)** | No approved finance write contract; all finance status actions remain blocked/read-only |
| Intervention contract | Low | Low | Low | ❌ **NOT DONE (O1-O2)** | No decision on where delay/escalation/dispute metadata should persist |
| Admin audit logging | Low | Low | Low | ❌ **NOT DONE (J3)** | Only MFA events logged; no `admin_action_log` table for general mutations |
| Error recovery / retry | Low | Low | Low | ❌ **NOT DONE (J4)** | No exponential backoff, no circuit breaker, no transient/permanent failure differentiation |
| RLS comprehensive testing | Low | Low | Low | ❌ **NOT DONE (J5)** | ~5-10 basic auth guard tests; no permission matrix or multi-admin testing |
| E2E testing | Low | Low | Low | ❌ **NOT DONE (P1-P4)** | No end-to-end workflow tests, no performance baselines, no error scenario suite |
| Rate limiting / abuse | Low | Low | Low | ❌ **NOT DONE (Q1-Q4)** | No strategy defined; auth rate limiting, mutation limiting, abuse detection all unimplemented |

---

## Backend Decisions Still Needed

1. ✅ ~~Define admin identity and authorization model~~ — **DONE**: `profiles.role = admin` + `public.is_admin_user()` RLS helper
2. ✅ ~~Decide whether admin 2FA is phase-1 or phase-2~~ — **DONE**: Phase K1-K2 implemented; TOTP MFA live
3. ✅ ~~Add suspension/restore backend contract for contractors~~ — **DONE**: Fields added to `public.contractors`: `suspended_at`, `suspended_by`, `suspension_reason`, `restored_at`, `restored_by`, `restore_reason`
4. ✅ ~~Define disputes/support schema~~ — **DONE**: Tables: `disputes`, `dispute_evidence`, `dispute_events`, `support_tickets`, `support_ticket_events`
5. ✅ ~~Define promo and notification campaign schema~~ — **DONE**: Tables: `promo_codes`, `promo_code_redemptions`, `notification_templates`, `notification_campaigns`, `notification_deliveries`
6. ❌ **Define where delayed/dispute/intervention request metadata should persist** — **NOT DONE (O1)**
7. ❌ **Define finance audit/reconciliation/reversal schema** — **NOT DONE (M1)**

---

## Recommended Combined Prompt Packs

### Completed Phases (A-O — can be referenced as context):

- **Pack 1:** A1 + A2 (Auth plumbing + sign-in)
- **Pack 2:** A3 + B1 (Admin auth hardening + data layer)
- **Pack 3:** B2 + C1 (Contract mapping + requests reads)
- **Pack 4:** C2 + C3 (Contractor reads + overview reads)
- **Pack 5:** D1 + D2 (KYC writes + contractor writes)
- **Pack 6:** E1 + E2 (Job lifecycle + realtime)
- **Pack 7:** F1 + F2 (Settings writes)
- **Pack 8:** G1 + G2 + G3 (Finance reads + export)
- **Pack 9:** H1 + H2 (Realtime jobs/contractors + notifications)
- **Pack 10:** I1 + I2 (Disputes/support schema + live integration)
- **Pack 11:** J1 + J2 (RLS review + production cleanup)
- **Pack 12:** K1 + K2 (MFA contract + live security settings)
- **Pack 13:** L1 + L2 (Promo/campaign schema + live integration)
- **Pack 14:** N1 + N2 (User management persistence cleanup)

### Remaining Work — Execution Prompts

Use these prompts as standalone or combinable chunks. Each is scoped for a single agent session.

#### Pack 15 — Evidence file handling for disputes (I3)

```text
Integration task: Add safe file upload/download/viewing for dispute evidence using Supabase Storage while preserving the dispute detail panel UX. Wire the dispute evidence surface to persistent file storage with proper admin-only RLS protection.

Scope:
- add file upload form to the dispute detail panel
- store uploaded files in Supabase Storage at `admin/disputes/<dispute_id>/` paths
- persist file metadata (name, size, type, uploaded_at, uploaded_by) to `public.dispute_evidence` table
- add file download/view actions in the evidence timeline
- handle storage errors, file-size limits, and retry behavior
- remove any local-only file handling from the current UI

Requirements:
- preserve the current dispute detail panel structure
- keep file uploads and downloads behind admin authorization
- use Supabase Storage buckets with RLS/security rules for admin-only access
- add focused tests for file upload success, failure, and permission scenarios
- validate file types and sizes server-side before acceptance

Current implementation note:
- `public.dispute_evidence` table exists with columns: id, dispute_id, evidence_type, file_path, file_name, file_size, file_type, uploaded_by, uploaded_at, metadata, created_at.
- `src/components/dashboard/disputes/disputes.tsx` loads evidence from the table but has no upload UI or download handlers.
- Supabase Storage bucket `admin/disputes/` with RLS policies does not yet exist; needs creation.
- No file size/type validation or Supabase Storage integration functions in `src/lib/supabase/data.ts` yet.

Files to focus on:
- `src/components/dashboard/disputes/disputes.tsx`
- `src/components/dashboard/disputes/disputes.data.ts`
- `src/lib/supabase/data.ts`
- New storage bucket setup needed
- SQL for Storage bucket RLS policies under `supabase/manual_sql/`
```

#### Pack 16 — Support ticket message threading (I4)

```text
Integration task: Add message creation, retrieval, and read-state tracking for support tickets so the timeline flows as a proper conversation instead of a flat event log. Preserve the support ticket detail panel while enabling sequential messages with read/unread tracking.

Scope:
- extend `public.support_ticket_events` or create `public.support_ticket_messages` table with message ordering
- add message creation endpoint/function to the support detail panel
- implement read-state tracking (message_read_at per message per recipient)
- auto-add message sender as participant on first response
- retrieve and display messages in chronological order with read indicators
- preserve existing support event/status timeline alongside conversation

Requirements:
- use server timestamps (not client timestamps) for message ordering
- keep messages and events separate in the UI (conversation vs status timeline)
- support read-state so admins know which messages have been read
- add focused tests for message creation, ordering, and read-state edge cases
- handle concurrent message inserts without ordering conflicts

Current implementation note:
- `public.support_ticket_events` table exists and stores event_type, message, metadata, but no `message_read_at` or ordering metadata.
- `src/lib/supabase/data.ts` has `listEventsByTicketIds()` but no message creation or read-state update functions.
- `src/components/dashboard/support/support.tsx` shows a flat event list but no message-threading UI.
- No participant tracking or auto-add logic exists yet.

Files to focus on:
- `src/components/dashboard/support/support.tsx`
- `src/components/dashboard/support/support.data.ts`
- `src/lib/supabase/data.ts`
- New SQL for `support_ticket_messages` table under `supabase/manual_sql/`
```

#### Pack 17 — Dispute refund linkage and payment reversal coordination (I5)

```text
Integration task: Link resolved disputes to actual payment reversals and refund tracking so dispute resolution metadata becomes actionable finance operations. Connect the dispute resolution actions to the payments table and finance audit trail.

Scope:
- extend `public.disputes` to track linked `payment_id` or `withdrawal_id` when resolution involves a refund
- add refund/reversal functions in the data layer that update both dispute and payment records together
- persist resolution actions (refund approved, partial refund, chargeback initiated) to both `dispute_events` and finance audit log
- validate that only authorized finance admins can execute reversals
- track refund status: pending, processing, completed, failed
- handle refund failure scenarios and retry logic

Requirements:
- keep dispute and payment records consistent across resolution
- use transactions or multi-step mutations to avoid partial failures
- document the boundary between admin-initiated reversals vs Stripe/payment-processor reversals
- add focused tests for successful refund linking, refund failures, and concurrent refund prevention
- preserve the dispute resolution UI while adding a "refund status" indicator

Current implementation note:
- `public.disputes` table has status, resolution_type, requested_resolution but no `payment_id` or `refund_status` field.
- `public.payments` table has status (pending, processing, authorized, paid, captured, failed, refunded, cancelled) but no `refund_initiated_by`, `refund_reason`, or `refund_dispute_id`.
- `src/lib/supabase/data.ts` has `supabaseDisputes.applyAction()` that can set resolution_type to "refund" or "partial_refund" as metadata, but doesn't actually update payment records.
- No refund linking, reversal coordination, or payment-audit integration exists yet.

Files to focus on:
- `src/components/dashboard/disputes/disputes.tsx`
- `src/lib/supabase/data.ts`
- New SQL for disputes/payment linkage fields under `supabase/manual_sql/`
```

#### Pack 18 — Finance write contract, policies, and audit trail design (M1) + Live finance status actions (M2)

```text
Planning + Implementation task: Define and implement the supported admin finance write paths that can safely move beyond read-only behavior. Keep mobile/shared payment flows intact and prefer additive admin audit/event models over risky direct-table overload.

Scope:
- define which payment/withdrawal admin actions are truly supported first
- add required admin update policies and audit/event tables
- define actor, reason, and timestamp capture requirements
- define which actions remain server-only or Stripe-mediated
- wire supported payment/withdrawal status actions
- persist reason-captured admin decisions
- surface audit history where available
- keep unsupported finance actions clearly blocked

Requirements:
- preserve current finance UX and badge naming
- do not force reconciliation/reversal workflows into unsupported direct writes
- prefer explicit finance admin events / audit records over hidden state changes
- add focused interaction coverage for the supported live write paths

Current implementation note:
- `public.payments` table has statuses: pending, processing, authorized, paid, captured, failed, refunded, cancelled.
- `public.withdrawals` table has statuses: pending, processing, completed, failed.
- `public.finance_admin_events` table exists with actor_id, payment_id, withdrawal_id, action, reason, metadata, created_at.
- Schema has admin read policies but NO admin update policies for finance writes.
- `src/lib/supabase/data.ts` finance reads are live; all status actions remain blocked/read-only in the UI.

Files to focus on:
- `src/components/dashboard/transactions/transactions.tsx`
- `src/lib/supabase/data.ts` (finance mutation functions)
- New SQL for admin finance update policies under `supabase/manual_sql/`
```

#### Pack 19 — Intervention contract decision (O1) + UI alignment (O2)

```text
Planning + Implementation task: Resolve the current product-contract ambiguity for delay, escalation, intervention, and dispute-adjacent notes on requests/jobs. Use the existing requests, disputes, and support workflows as the frontend target and decide where this operational metadata should persist. Then align the UI to the chosen contract.

Scope:
- compare these options:
  - add fields directly to `jobs`
  - add a separate job-operations / intervention log table
  - move dispute/support-style notes fully into disputes/support records
- define actor, reason, status, and timeline requirements
- define which operational notes must be realtime-visible
- wire intervention notes to the chosen backend model
- update requests live state messaging to remove temporary/local-only notes
- keep disputes/support linkage explicit when intervention becomes formalized

Requirements:
- choose one primary contract direction before wider write expansion
- avoid duplicating the same intervention data across jobs and disputes/support
- keep the admin workflow operationally clear and audit-friendly

Current implementation note:
- `public.jobs` has no dedicated delay, dispute, escalation, or intervention fields.
- `public.disputes` and `public.support_tickets` exist but are separate workflow tables.
- No decision has been made on where intervention metadata should persist.
- Admin operators currently have no way to annotate jobs with intervention notes that persist to Supabase.

Files to focus on:
- `src/components/dashboard/requests/requests.tsx`
- `src/components/dashboard/requests/requests-sidebar.tsx`
- `src/lib/supabase/data.ts`
- New SQL under `supabase/manual_sql/`
```

#### Pack 20 — Admin audit logging expansion (J3) + Error recovery with retry/circuit breaker (J4)

```text
Integration task: Extend admin audit logging beyond MFA security events to capture all sensitive admin mutations AND add resilience patterns to the data layer for transient failure handling.

Scope:
- design `public.admin_action_log` table (or extend `admin_security_events`) to capture all mutation types
- add audit logging to every mutation path in `src/lib/supabase/data.ts`: contractors, jobs, disputes, support, settings, finance
- capture: action type, actor id, target resource, reason, timestamp, metadata, result (success/failure)
- add RLS policies so admins can read their own and other admins' actions (for transparency)
- create a data layer function `insertAdminAuditLog()` used consistently by all mutations
- implement exponential backoff retry logic with configurable max attempts and base delay
- add circuit breaker pattern to detect persistent failures and prevent cascading errors
- differentiate transient errors (network, timeout) from permanent errors (permission denied, validation failure)
- add retry hooks to all critical read and write paths
- implement graceful degradation when retry limits are exceeded

Requirements:
- do not slow down mutations with synchronous audit logging; batch or async where safe
- keep audit messages explicit and searchable (good action names, consistent reason capture)
- do not retry permission-denied or validation errors; fail fast
- use jittered exponential backoff to avoid thundering herd
- set sensible defaults: initial delay 300ms, max delay 10s, max 3-5 attempts
- add focused tests for both audit log capture and retry/circuit breaker behavior

Current implementation note:
- `public.admin_security_events` table exists and is used for MFA-related audit events only.
- No centralized audit logging pattern exists; each mutation is self-contained.
- `src/lib/supabase/data.ts` mutations return `SupabaseResult<T>` with `ok`/`message` but have no retry logic.
- UI components show "Retry" buttons but call the same mutation function again (no backoff).

Files to focus on:
- `src/lib/supabase/data.ts`
- `src/lib/supabase/data.test.ts`
- New SQL for `admin_action_log` table under `supabase/manual_sql/`
```

#### Pack 21 — RLS comprehensive audit and permission matrix testing (J5)

```text
Integration task: Conduct comprehensive RLS policy testing and document the complete admin permission matrix so the backend enforces intended boundaries and no privilege escalation is possible.

Scope:
- test read access: each table/resource type, single admin vs multiple admins, admin vs non-admin
- test write/mutation access: each mutation type, with and without proper actor id, with and without required fields
- test RLS policy behavior: cascade deletes, policy interactions, edge cases
- document the admin permission matrix (who can do what to what resources)
- test multi-admin scenarios: concurrent mutations, actor id validation, session isolation
- test permission failure modes: RLS violations, policy-denied operations, authorization boundary errors

Requirements:
- add comprehensive RLS test suite (20-30+ test cases)
- document the intended permission matrix and test coverage
- identify and remediate any policy gaps or unintended privilege escalation paths
- include tests for the specific admin role model in use (`profiles.role = admin`)
- provide step-by-step instructions for auditing RLS policies in production

Current implementation note:
- `src/lib/supabase/data.test.ts` has basic authorization guard tests (~5-10 test cases).
- No comprehensive RLS policy matrix or permission testing exists.
- RLS policies in the latest migration include admin-only access but are not comprehensively validated.
- Multi-admin scenarios (concurrent edits, actor id mismatches) have minimal test coverage.
- No compliance documentation of the admin permission model exists.

Files to focus on:
- `src/lib/supabase/data.test.ts`
- All migration files for RLS policy reference
- New test file for permission matrix: `src/lib/supabase/permission-matrix.test.ts` (suggested)
```

#### Pack 22 — End-to-end admin workflow tests (P1) + Authorization permission matrix testing (P2)

```text
Integration task: Add comprehensive end-to-end test suites that exercise complete admin workflows AND validate the complete admin permission matrix.

Scope:
- happy-path workflows: admin login → request dispatch → dispute resolution → payout approval
- critical failure scenarios: session expiry, permission denied, network failure during mutation
- cross-module workflows: contractor suspend → view in list → check details → restore
- realtime workflows: job status change → sidebar update → live counter
- test setup: seed realistic test data, tear down cleanly
- test matrix: each admin action × each role/permission × allowed/denied scenarios
- test multi-admin: two admins, same action, different authorization states
- test session: action with valid session, expired session, mismatched actor id

Requirements:
- use Vitest + testing-library or Playwright for integration tests
- each test should validate UI state, network calls, and final database state
- tests should be deterministic and not depend on execution order
- create a test matrix spreadsheet mapping actions to expected outcomes
- add 50+ test cases total covering both workflows and permissions

Current implementation note:
- Focused unit/component tests exist for specific features.
- No end-to-end workflow tests exist that validate multiple steps together.
- Basic admin authorization tests exist in `src/lib/supabase/data.test.ts`.
- No comprehensive permission matrix or multi-admin testing.

Files to focus on:
- `src/lib/supabase/data.test.ts`
- New E2E test files for each workflow domain
```

#### Pack 23 — Error scenario and failure mode testing (P3) + Performance baseline and load testing (P4)

```text
Integration task: Add comprehensive test coverage for error scenarios AND establish performance baselines for the admin system.

Scope:
- network failures: timeout, 500 error, connection refused
- data integrity: RLS violations, constraint violations, concurrent conflict
- state mismatch: actor id mismatch, expired session, stale data
- partial failures: mutation succeeds but audit log fails, evidence upload succeeds but metadata fails
- user input: invalid reason, missing required fields, malformed data
- baseline latency: measure query/mutation response times under normal load
- pagination: validate that large lists (1000+ records) load efficiently
- concurrent operations: test 2-5 admins performing mutations simultaneously
- realtime updates: measure latency of job status changes appearing in UI

Requirements:
- each error test should validate error message clarity and user actionability
- verify that failed mutations don't corrupt application state
- establish baseline targets: queries <500ms, mutations <1s, realtime updates <2s
- use performance profiling tools (React Profiler, browser DevTools)
- add 20+ error scenario test cases
- add 5+ performance baseline test cases

Current implementation note:
- Some error handling exists in components (loading, empty states, error messages).
- No systematic error scenario testing suite.
- No baseline performance tests or load testing exists.
- Pagination logic exists but is not tested under load.

Files to focus on:
- Existing test files for error scenario coverage
- New performance test file: `src/lib/supabase/performance.test.ts` (suggested)
```

#### Pack 24 — Rate limiting strategy (Q1) + Auth rate limiting and brute-force protection (Q2)

```text
Planning + Implementation task: Define the rate-limiting strategy for admin operations and implement strict rate limiting on authentication endpoints.

Scope:
- define rate limits per endpoint: auth (5 attempts/15min), mutations (100/min), reads (1000/min)
- define reset/recovery rules and monitoring/alerting approach
- implement rate limiting on login: 5 per 15 minutes per IP + email combination
- progressive delays: immediate on first failure, 1s delay after 3rd, 5s after 5th
- account lockout: temporary lock after 10 failed attempts, unlock after 30 minutes or manual reset
- track failed attempts: store in `admin_login_attempts` table for audit
- security event logging: log all lockout and unlock events to `admin_security_events`
- Retry-After header: indicate when next attempt is allowed

Requirements:
- implement at the server layer (not just frontend validation)
- support lockout reset via recovery code or support team intervention
- measure and log all rate-limit violations
- test that legitimate admins are not locked out by attackers abusing their email
- coordinate with security team on lockout notification procedures

Current implementation note:
- Supabase Auth has default rate limiting but lacks progressive delay and admin-specific lockout.
- `admin_login_attempts` table exists in schema but is not populated.
- No server-side login attempt tracking in `server/routes/`.
- No Retry-After header or progressive delay logic.

Files to focus on:
- `server/routes/admin-security.ts`
- `server/index.ts`
- New SQL under `supabase/manual_sql/`
- `src/auth/auth.store.ts` (frontend rate limit awareness)
```

#### Pack 25 — Mutation rate limiting (Q3) + Abuse detection and alerting (Q4)

```text
Implementation task: Add rate limiting to admin mutations and implement abuse detection that identifies suspicious patterns.

Scope:
- global mutation limit: 100 mutations per minute per admin
- per-operation limits: suspend 5/min, approve_kyc 10/min, resolve_dispute 5/min
- per-resource limits: prevent bulk operations on same resource
- sliding window tracking using time-based buckets
- enforce via middleware: check limits before executing mutations
- response codes: 429 Too Many Requests with Retry-After header
- pattern detection: volume spikes, unusual access times, geographic anomalies, failed operation chains
- alert types: high volume in short period, new IP address, many failures in a row, bulk operations
- alert routing: direct to security team inbox with contextual details
- lockdown procedures: manual admin disable if compromise suspected, with audit trail

Requirements:
- limits should not block normal admin work (single actions per few seconds)
- track limits in Postgres for persistence
- provide admins with clear feedback on rate-limit status
- log all rate-limit violations to `admin_action_log`
- alerts should be actionable and not false-positive prone
- include context in alerts: which admin, which operations, which resources, timestamps

Current implementation note:
- No mutation rate limiting exists in the data layer or server routes.
- No per-operation or per-resource throttling logic.
- No abuse detection logic exists in the codebase.
- No alerting infrastructure for security events.

Files to focus on:
- `src/lib/supabase/data.ts` (mutation rate limit hooks)
- `server/index.ts` (rate limit middleware)
- New server route: `server/routes/admin-rate-limit.ts`
- New SQL under `supabase/manual_sql/`
```

---

## Definition Of Integration Success

The admin app is considered truly backend-integrated when:

- admin auth is real ✅
- core modules no longer rely on mock seeds for normal behavior ✅
- writes persist to Supabase for at least auth, requests, contractors/KYC, and settings ✅
- overview aggregates come from live data ✅
- transactions are at least live-read integrated ✅
- disputes/support have either live backend tables or are intentionally held back pending schema work ✅
- RLS and admin authorization are enforced ✅

**All core integration criteria are met.** Remaining work is production hardening and feature completion for disputes/support edge cases.

---

## Extended Success Criteria For Production Readiness

Beyond core integration, the admin app is production-ready when:

**Phase I (Disputes/Support Completion):**
- [ ] Evidence file uploads work reliably with proper RLS protection (I3)
- [ ] Support ticket conversations persist and display in chronological order (I4)
- [ ] Dispute resolution actions (refunds, denials) link properly to payments table (I5)

**Phase J (Hardening & Observability):**
- [ ] Admin audit logging captures all sensitive actions (J3)
- [ ] Error recovery and retry logic handles transient failures gracefully (J4)
- [ ] RLS policies have been comprehensively audited and tested (J5)

**Phase K (Security):**
- [x] Admin MFA (TOTP) is fully implemented with recovery codes (K1-K2)
- [x] Sessions are re-authenticated for destructive changes
- [x] Security event logging is comprehensive for MFA events

**Phase M (Finance Writes):**
- [ ] Finance write contract is defined and approved (M1)
- [ ] Live finance status actions for supported admin workflows (M2)

**Phase O (Intervention Contract):**
- [ ] Decision made on where intervention notes belong (O1)
- [ ] UI aligned to chosen intervention contract (O2)

**Phase P (Comprehensive Testing):**
- [ ] End-to-end workflow tests pass for all major admin scenarios (P1)
- [ ] Authorization matrix is tested and documented; no privilege escalation exists (P2)
- [ ] Error scenarios have comprehensive test coverage (P3)
- [ ] Performance baselines established and load tests pass (P4)
- [ ] Test coverage >80% for `src/lib/supabase/data.ts` and critical components

**Phase Q (Rate Limiting & Abuse Prevention):**
- [ ] Auth rate limiting prevents brute-force attacks (Q2)
- [ ] Mutation rate limiting prevents spam/abuse (Q3)
- [ ] Abuse detection and alerting logs suspicious patterns (Q4)
- [ ] Security team can investigate and respond to abuse patterns

**Final Readiness Checklist:**
- [ ] All remaining chunks (I3-I5, M1-M2, O1-O2, J3-J5, P1-P4, Q1-Q4) completed and tested
- [ ] Comprehensive integration test suite passing (P1-P4)
- [ ] RLS audit completed and all gaps remediated (J5)
- [ ] Admin audit logging includes all sensitive operations (J3)
- [ ] Rate limiting and MFA deployed to production (Q1-Q4)
- [ ] Performance baselines met: queries <500ms, mutations <1s
- [ ] Evidence file handling works end-to-end (I3)
- [ ] Support message threading and read states functional (I4)
- [ ] Dispute refund linkage properly coordinates with payments (I5)
- [ ] Error recovery with retry logic handles transient failures (J4)
- [ ] No mock-only behavior in production code paths
- [ ] Security team trained on audit logs and abuse alerts
- [ ] Disaster recovery procedure documented (admin account recovery, data restoration, etc.)
- [ ] Go/no-go decision made by product + security teams