# AidSprint Admin Frontend PRD Assessment and Handover

Last updated: 2026-06-04

## Purpose
This document replaces earlier speculative handover notes with a reality-based assessment of the current admin frontend against the product requirements document in `PRODUCT REQUIREMENTS DOCUMENT.md`.

The goal is to answer three questions clearly:
1. What is essential for the AidSprint admin app frontend?
2. What already exists in the current codebase?
3. What must be added or changed before backend implementation begins?

## Current Verdict
The current admin app is a solid frontend foundation, but it does not yet fully satisfy the PRD for the admin portal.

What exists today is best described as:
- a strong mock-data admin dashboard shell
- good table/detail patterns for users, contractors, requests, transactions, and support
- reusable filtering, pagination, and sheet/sidebar interaction patterns
- an incomplete operations surface for a help-on-demand marketplace

The frontend is not yet ready to be treated as PRD-complete because several required admin capabilities are still missing or under-modeled:
- real-time job monitoring and dispatch operations
- service category management
- tier pricing management
- promo code management
- push notification management
- dispute operations
- fraud and trust-safety tooling
- finance workflows for payouts, reconciliation, and reporting

## PRD Essentials For The Admin App
The PRD makes the following admin-facing capabilities essential:

### Core Operations
- Admin dashboard web portal
- Manage users
- Manage contractors
- Contractor verification and approvals
- Monitor jobs in real time
- Support tickets and disputes
- Suspend and restore contractor accounts

### Marketplace Configuration
- Edit service categories
- Edit tier pricing
- Create promo codes
- Manage push notifications

### Trust, Quality, and Risk
- Automatic fraud detection support surfaces
- Track low-rated contractors
- Visibility into customer satisfaction and poor performance trends

### Financial Operations
- Financial payouts
- Financial reports
- Revenue visibility
- Outstanding dispute visibility

### Dashboard Analytics
The dashboard should surface at least the following high-value operational KPIs:
- total jobs today
- jobs by category
- average response time
- active contractors
- user analytics
- heatmaps
- total revenue
- outstanding disputes
- customer satisfaction rating

## Reality Check: What The Current Frontend Actually Has
The current app is frontend-only and mock-data-driven.

### Routing Surface
Reviewed in [App.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/App.tsx).

Current top-level routes:
- `/` -> login
- `/overview` -> dashboard overview (protected)
- `/users` and `/users/:userId` (protected)
- `/contractors` and `/contractors/:contractorId` (protected)
- `/requests` (protected)
- `/transactions` (protected)
- `/support` (protected)
- `/disputes` (protected, placeholder)
- `/settings` (protected)
- `/marketplace` (protected, placeholder)

Auth readiness note:
- Protected routes are now enforced via a lightweight auth session guard. Unauthenticated access redirects to login and supports session-expiry handling.

### Existing Feature Inventory

#### Dashboard Overview
Reviewed in [overview.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/overview/overview.tsx).

Current strengths:
- KPI-style summary cards
- revenue chart
- top services visualization
- recent requests table
- date filtering

Current limitation:
- this is a generic summary dashboard, not yet an operations dashboard for a live help-on-demand service marketplace

#### Users
Reviewed in [users.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/users/users.tsx) and [user-details-page.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/user-details/user-details-page.tsx).

Current strengths:
- search, filters, pagination
- user status actions
- user detail page
- request history linkage

Current limitation:
- lacks richer admin controls such as payment history visibility, notification history, fraud markers, saved-location oversight, and audit trails

#### Contractors
Reviewed in [contractors.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractors.tsx), [contractor-details-page.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-details-page.tsx), [contractor-kyc-tab.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-kyc-tab.tsx), [contractor-request-history-tab.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-request-history-tab.tsx), and [contractor-transaction-history-tab.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-transaction-history-tab.tsx).

Current strengths:
- contractor list page with filters and actions
- contractor detail tabs
- KYC review surface
- request history tab
- transaction history tab
- lifecycle, trust/risk, payout-readiness, and performance indicators across list/detail views
- suspension and restore workflows with confirmation and reason capture

Current limitations:
- still mock-data driven and not yet backed by live admin APIs or audit persistence
- suspension and restore reasons are captured in the frontend flow, but actor/timestamp persistence is still not modeled as stored audit history
- trust/risk and payout readiness are now visible inside the contractor module, but not yet linked to disputes, finance exports, or cross-module fraud tooling

#### Requests
Reviewed in [requests.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests.tsx), [requests-sidebar.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests-sidebar.tsx), [requests-overlay.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests-overlay.tsx), and [requests.store.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests.store.ts).

Current strengths:
- requests list with filters and pagination
- request detail sidebar
- request status actions
- live-tracker-style overlay concept

Current limitations:
- not yet structured as a true dispatch board
- lacks assignment queue depth, SLA visibility, live event timeline, intervention controls, and escalation/dispute hooks
- request lifecycle states are still simplified for marketplace operations

#### Transactions
Reviewed in [transactions.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/transactions/transactions.tsx).

Current strengths:
- transaction list page
- filterable/searchable table
- detail sidebar
- status update controls

Current limitations:
- not yet a payouts and reconciliation workspace
- no settlement batches, failure handling, exports, payout approvals, or commission reporting views

#### Support
Reviewed in [support.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/support/support.tsx).

Current strengths:
- ticket list, filters, pagination, and details sidebar

Current limitations:
- no dedicated dispute workflow
- no evidence review, refund path, job-linked escalation, or trust-and-safety coordination layer

#### Settings
Reviewed in [settings.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/setting/settings.tsx).

Current strengths:
- basic configuration shell exists

Current limitations:
- far below PRD requirements
- does not yet support service categories, pricing tiers, promo codes, notification templates/campaigns, or operational rules

#### Shared Admin Infrastructure
Reviewed in:
- [dashboard-layout.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/dashboard-layout.tsx)
- [dashboard-sidebar.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/dashboard-sidebar.tsx)
- [dashboard-navigation.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/dashboard-navigation.ts)
- [filter-schema.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/filters/filter-schema.ts)
- [use-url-filters.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/filters/use-url-filters.ts)
- [pagination-utils.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/pagination-utils.ts)

Current strengths:
- reusable dashboard shell
- reusable filter schema and URL-synced filter state
- reusable pagination utilities
- repeatable table + sidebar UI patterns

Current limitations:
- notification drawer is still placeholder-level
- navigation does not yet reflect the full PRD information architecture
- shared admin domain types are still too light for real operations use

### Backend Reality
Reviewed in [server/index.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/server/index.ts) and [api.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/shared/api.ts).

Current state:
- backend is starter-only
- real admin APIs do not exist yet
- only `/api/ping` and `/api/demo` are currently implemented
- shared API typing is minimal

This means all current frontend coverage should be understood as UI architecture and workflow preparation, not integrated product completion.

## Requirement Coverage Assessment

### Meets Or Mostly Meets Frontend Foundation Needs
- dashboard shell and navigation structure
- users list/detail management pattern
- contractors list/detail management pattern
- KYC review pattern
- requests list/detail pattern
- transactions list/detail pattern
- support tickets pattern
- shared filters, tables, and pagination

### Partially Meets PRD
- dashboard analytics: partial visual coverage, but not the right operational KPI set yet
- contractor management: partial because verification exists, but performance/risk controls are incomplete
- request monitoring: partial because request list and tracker concept exist, but no true dispatch/monitoring console
- financial operations: partial because transaction UI exists, but not payouts/reporting workflows
- support: partial because ticket handling exists, but disputes are missing

### Does Not Yet Meet PRD
- service category management
- tier pricing management
- promo code creation and management
- push notification management
- fraud detection review surface
- low-rated contractor watchlist and intervention flow
- suspend/restore contractor lifecycle with proper admin UX
- real-time jobs command center
- dashboard heatmap and response-time analytics
- outstanding disputes dashboard reporting
- customer satisfaction operations view
- auth-ready secure admin flow expectations

## Best-Practice Guidance For A Help-On-Demand Service Admin
The admin frontend should be shaped around operational speed, trust, and intervention.

### Principles To Keep
- Use urgency-first design. High-risk, delayed, disputed, and failed-payment items should be visually prioritized.
- Keep destructive actions guarded. Suspend, cancel, reject, refund, and payout actions should require confirmation and reason capture.
- Preserve auditability. Every admin action should have a visible actor, timestamp, and reason field in the UI model.
- Separate operational queues from settings. Live job management should not compete with configuration tasks.
- Prefer explicit status taxonomies. Avoid ambiguous statuses like generic pending when the business needs assigned, en route, arrived, in progress, completed, cancelled, disputed, refunded, payout pending, payout failed, and similar states.
- Design for backend readiness. Frontend state should map cleanly to future API contracts and avoid temporary naming that will be expensive to unwind.

## What Needs To Change In The Existing Frontend

## Planning Update: UI Impact By Phase
This planning pass confirms that the upcoming roadmap should remain a low-redesign, high-workflow evolution of the current admin UI.

Visual guidance:
- preserve the current dashboard shell, typography rhythm, card language, tables, sidebars, drawers, badges, filters, and action hierarchy
- prefer extending existing Figma-backed patterns over introducing new component families
- treat new work as information architecture and workflow expansion, not a visual redesign

Phase-by-phase UI impact:
- Phase 1: moderate UI change, high workflow change
- Phase 2: moderate to high UI change, especially where disputes and marketplace configuration need clearer separation
- Phase 3: low to moderate UI change, mostly finance-state depth and reporting controls
- Phase 4: low UI change, mostly auth, routing, and protected-state handling

Files most likely to stay visually close to current Figma:
- `overview.tsx`
- `requests.tsx`
- `transactions.tsx`
- `support.tsx`
- contractor list/detail tabs and existing sidebars

Areas most likely to need careful Figma-extension decisions rather than redesign:
- disputes workspace
- pricing and promo management in settings
- notification management
- finance reporting and reconciliation drill-downs

## Trae Prompt Bank
Use the following prompts as implementation chunks. Each prompt is designed to preserve the current AidSprint visual system while increasing workflow depth.

Quick index:
- See [current-task.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/current-task.md) for a user-facing phase/prompt checklist and the reusable “Figma-safe” planning summary.

### Phase 1 Prompt A: Overview Operations Control Center (Planned)
Refactor `src/components/overview/overview.tsx` into an operations-first control center without changing the current dashboard shell or visual language. Reuse the existing summary-card, chart, table, badge, filter, and responsive mobile-card patterns already present in `overview.tsx`, `requests.tsx`, `transactions.tsx`, and the shared dashboard primitives. Keep the page recognizably aligned to current Figma styling, but reorganize the information hierarchy so urgent operational queues appear first. Add cards and sections for delayed jobs, disputed jobs, failed payouts, KYC blockers, low-rated contractors, and live operational KPIs. Use explicit lifecycle labels and backend-ready naming. Do not invent a new design language; extend the current one. Add focused tests only where interaction logic changes materially.

### Phase 1 Prompt B: Requests Dispatch Workflow (Done)
Upgrade `src/components/dashboard/requests/requests.tsx`, `requests-sidebar.tsx`, and `requests-overlay.tsx` into a dispatch and live-monitoring workflow while preserving the current table, sidebar, and overlay styling patterns. Reuse the working status-menu, drawer, badge, filter, pagination, and responsive mobile-card behavior already established across requests, support, transactions, overview, and contractor tabs. Add explicit request lifecycle states, urgent queue visibility, intervention actions, and better operational grouping, but keep the visual styling within the current Figma-backed component system. Ensure mobile and tablet layouts continue following the same breakpoints and stacking patterns as overview/users/contractors.

### Phase 1 Prompt C: Contractor Operations Surface (Done)
Refactor the contractor area in `src/components/dashboard/contractors/` into an operations-first contractor management surface without redesigning the existing Figma language. Extend the current contractor list, contractor details page, summary cards, request-history tab, and transaction-history tab with trust/risk indicators, low-rating watchlists, suspension and restore actions, performance metrics, and clearer contractor lifecycle states. Reuse existing card, tab, table, badge, menu, sidebar, and modal patterns before introducing any new layout structure. Keep the visual system consistent with current dashboard styling.

### Phase 1 Prompt D: Contractor KYC Review Cleanup (Done)
Remove the testing-only admin upload behavior from `src/components/dashboard/contractors/contractor-kyc-tab.tsx` and convert the KYC tab into a read-only review plus approve/reject workflow. Preserve the current tab structure and detail-card styling. Add confirmation and reason-capture UX for rejection decisions using existing modal/drawer patterns where possible. Keep naming and state models backend-ready and aligned with explicit approval states.

### Phase 2 Prompt A: Settings Marketplace Configuration (Planned)
Expand `src/components/dashboard/setting/settings.tsx` into a marketplace-configuration workspace for service categories, pricing tiers, promos, and notification management. Preserve the current settings route and visual language, but reorganize the page into clearly separated configuration sections using existing cards, forms, toggles, tabs, and panel patterns. Treat this as an extension of the existing design system, not a new admin theme. If a workflow becomes too complex for the current page pattern, structure it as clearly separated internal sections before proposing brand-new surfaces.

### Phase 2 Prompt B: Disputes Planning Surface (Planned)
Create a dedicated disputes surface, either as a new route or a clearly separated operational section branching from the support workflow, while staying visually aligned with `support.tsx`, `support-sidebar.tsx`, `requests-sidebar.tsx`, and the existing table/detail-sheet system. Prioritize evidence review, linked job context, refund/reversal readiness, actor/reason auditability, and explicit dispute lifecycle states. Reuse existing list, badge, drawer, and filter patterns first. Only introduce a new page-level layout if the workflow cannot fit cleanly inside current support patterns.

### Phase 3 Prompt A: Transactions Finance Operations (Planned)
Upgrade `src/components/dashboard/transactions/transactions.tsx` into a finance-operations workspace for payouts, exports, reporting, failures, and reconciliation while preserving the current transaction page structure, summary cards, table styling, filters, dropdowns, and right-side detail panel patterns. Expand the workflow with explicit payout states, failure buckets, export actions, and reconciliation-focused views, but keep the UI visually consistent with existing Figma-backed pages. Use backend-ready finance naming and avoid generic statuses.

### Phase 4 Prompt A: Auth-Ready Login And Route Structure (Done)
Make `src/login/login.tsx` and the app route structure auth-ready before backend integration starts. Keep the current visual language intact and limit UI changes to the states needed for real auth behavior: validation, loading, locked/unauthorized access, session expiry, and protected-route handling. Reuse existing feedback patterns such as toasts, inline messages, dialogs, and loading indicators. Focus on route guards, naming, and auth-state architecture more than visual redesign.

### Phase 4 Prompt B: Admin Route Architecture Cleanup (Done)
Refactor route structure and navigation so current and planned admin modules map cleanly to future backend contracts. Keep the existing sidebar and dashboard shell styling, but normalize route naming, module grouping, and protected navigation flow for overview, requests, contractors, transactions, support, disputes, settings, and future marketplace operations. Preserve the visual shell while improving information architecture.

### 1. Turn Overview Into A Real Operations Dashboard
Primary file: [overview.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/overview/overview.tsx)

Required changes:
- replace generic summary cards with PRD-relevant KPIs
- add total jobs today
- add jobs by category
- add average response time
- add active contractors now
- add outstanding disputes count
- add customer satisfaction rating
- add a service-area heatmap placeholder panel
- add an urgent incidents or jobs needing intervention panel
- add a low-rated contractors panel
- add failed payouts or finance alerts panel

Recommended layout:
- top row: operational KPIs
- middle row: jobs by category, revenue, satisfaction, response-time trend
- bottom row: urgent queue, disputes, contractor health, live map/heatmap

### 2. Evolve Requests Into An Operations And Dispatch Workspace
Primary files:
- [requests.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests.tsx)
- [requests-sidebar.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests-sidebar.tsx)
- [requests-overlay.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests-overlay.tsx)
- [requests.store.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests.store.ts)

Required changes:
- add richer request lifecycle statuses
- add urgency/SLA columns and filters
- add assignment state and contractor availability view
- add reschedule, reassign, escalate, and refund/dispute entry actions
- add event timeline in the sidebar
- add customer and contractor communication metadata
- expand the live tracker from a request overlay into a reusable operations map panel
- support bulk queue filters such as unassigned, delayed, disputed, and high priority

Suggested lifecycle model:
- Created
- Awaiting assignment
- Assigned
- Contractor en route
- Arrived
- In progress
- Completed
- Cancelled
- Disputed
- Refunded

### 3. Expand Contractor Management Around Trust And Performance
Primary files:
- [contractors.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractors.tsx)
- [contractor-details-page.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-details-page.tsx)
- [contractor-kyc-tab.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-kyc-tab.tsx)
- [contractors.types.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractors.types.ts)

Required changes:
- add suspend and restore actions with reason capture and status history
- add low-rating and repeated-complaint indicators
- add performance metrics: acceptance rate, completion rate, average rating, response time, last active, service zone coverage
- add account flags: KYC incomplete, payout blocked, risk review, repeated cancellation
- convert KYC admin upload UI into a read-only document review and decision flow
- add contractor payout summary and pending payout indicator on the details page

### 4. Upgrade Transactions Into A Finance Operations Surface
Primary file: [transactions.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/transactions/transactions.tsx)

Required changes:
- separate customer payments from contractor payouts
- add payout status taxonomy: pending, approved, processing, paid, failed, reversed
- add export/report actions
- add payout summary cards
- add failed payout review list
- add reconciliation-oriented filters
- add fee and commission breakdown presentation

### 5. Split Support From Disputes
Primary file: [support.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/support/support.tsx)

Required changes:
- either add top-level tabs or a new route for disputes
- create dispute states such as open, investigating, awaiting evidence, resolved, refunded, rejected
- show linked request, user, contractor, payment amount, evidence, and resolution notes
- support action history and outcome logging

Recommendation:
- keep `Support` for inbound support operations
- add `Disputes` as a dedicated route if the PRD scope remains large

### 6. Rebuild Settings Into Marketplace Configuration
Primary file: [settings.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/setting/settings.tsx)

Required settings modules:
- service categories
- service category subtypes if applicable
- tier pricing rules
- surge or urgency pricing configuration if the business supports it
- promo codes
- push notification templates and campaigns
- operational thresholds or policy settings

Recommendation:
- split Settings into sections or nested routes instead of one shallow page
- use clear ownership panels with draft/publish or save/apply patterns

### 7. Add Missing Admin Modules
Recommended new frontend surfaces:
- `Disputes`
- `Promotions`
- `Notifications`
- `Fraud and Risk`
- `Pricing`
- `Service Categories`

These may live as top-level routes or nested settings routes depending on navigation preference.

### 8. Make Login Auth-Ready Even Before Backend
Primary file: [login.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/login/login.tsx)

Current limitation:
- login simply navigates to `/overview`

Required frontend preparation:
- add proper form validation states
- add loading and error states
- plan route guarding
- reserve support for role-based admin permissions
- prepare a 2FA step or verification screen if required by the business
- add session-expired UX

## Recommended Information Architecture
To better match the PRD, the admin navigation should evolve toward something like this:
- Dashboard
- Operations
- Requests
- Users
- Contractors
- Transactions
- Disputes
- Support
- Promotions
- Notifications
- Settings

Alternative structure if fewer top-level items are preferred:
- Dashboard
- Operations
- Marketplace
- Users
- Contractors
- Finance
- Support
- Settings

Where:
- `Marketplace` contains categories, pricing, promos, notifications
- `Finance` contains transactions, payouts, reports
- `Support` contains tickets and disputes

## Frontend Domain Modeling That Should Be Added Before Backend
The current mock types are useful, but the domain model should be expanded now so the backend contract is easier to implement later.

Recommended frontend type groups:
- request lifecycle and SLA types
- contractor performance and risk types
- payout and settlement types
- dispute case types
- promo campaign types
- notification template and delivery types
- dashboard analytics types
- audit log types

Suggested placement:
- shared cross-app contracts in `shared/`
- feature-specific UI models close to each feature folder

## Concrete Component-Level Change Plan

### Existing Files To Update
- [App.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/App.tsx)
  - add missing routes and reorganize navigation destinations
- [dashboard-navigation.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/dashboard-navigation.ts)
  - add PRD-aligned nav items and rename `Transaction` to `Transactions`
- [dashboard-layout.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/shared/dashboard-layout.tsx)
  - convert placeholder notifications area into a real notification/alert center pattern
- [overview.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/overview/overview.tsx)
  - rebuild around operational KPIs and interventions
- [requests.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests.tsx)
  - add queue and dispatch behavior
- [requests-sidebar.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests-sidebar.tsx)
  - add timeline, assignment, escalation, and dispute hooks
- [requests-overlay.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests-overlay.tsx)
  - expand into a map/live monitoring panel
- [requests.store.ts](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/requests/requests.store.ts)
  - replace simplified status action mapping with richer lifecycle modeling
- [contractors.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractors.tsx)
  - add performance, risk, and suspension states
- [contractor-kyc-tab.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-kyc-tab.tsx)
  - remove testing-only upload control and keep admin review-only behavior
- [contractor-details-page.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/contractors/contractor-details-page.tsx)
  - add performance and payout summary blocks
- [transactions.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/transactions/transactions.tsx)
  - refocus on payouts, reporting, and reconciliation
- [support.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/support/support.tsx)
  - add or split dispute handling
- [settings.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/components/dashboard/setting/settings.tsx)
  - turn into a configuration center
- [login.tsx](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/src/login/login.tsx)
  - add auth-ready UX states

### New Files Or Modules Likely Needed
- operations dashboard widgets/components
- dispute list and dispute details components
- pricing management components
- service category management components
- promo code management components
- notification management components
- fraud/risk review components
- shared timeline, audit log, and status badge utilities

## Recommended Delivery Order

### Phase 1: Close The Biggest Frontend PRD Gaps
- rebuild `Overview` into an operations dashboard
- upgrade `Requests` into a dispatch/monitoring workspace
- expand `Contractors` with trust/performance controls
- remove the testing-only admin upload behavior from KYC

### Phase 2: Add Missing Product Modules
- disputes
- service categories
- pricing tiers
- promo codes
- push notifications

### Phase 3: Strengthen Finance And Trust
- payout workflows
- reporting/export surfaces
- fraud/risk review workspace
- low-rated contractor watchlist

### Phase 4: Backend-Ready Integration Pass
- replace mock loaders with service modules
- introduce shared API contracts
- add route guards and auth shell
- connect async states, empty states, and failure states everywhere

## Risks If We Start Backend Too Early
If backend work starts before the frontend models and workflows are corrected, likely problems include:
- unstable status enums and API contracts
- rework caused by weak lifecycle modeling
- duplicated effort between support, disputes, and requests
- confusion around payout vs transaction terminology
- settings API design that does not match the eventual admin UX

## Recommended Immediate Next Actions
1. Approve the revised admin information architecture.
2. Decide whether disputes, promotions, and notifications should be top-level routes or nested under settings/support.
3. Rework `Overview`, `Requests`, and `Contractors` first because they are closest to the core operations surface.
4. Remove or disable any testing-only admin behaviors that would misrepresent the real product workflow.
5. Define frontend domain types before backend endpoints are designed.

## Figma-Safe UI Impact Assessment
The planned work does not need to become a visual redesign. Most of it can be executed as a structured product-depth expansion inside the existing design language.

### Guiding Rule
Do not redesign the UI unless Figma already provides a new surface. Keep the current visual system and evolve:
- information hierarchy
- data density
- status taxonomy
- actions and workflows
- route structure

That means we should preserve the current:
- spacing rhythm
- card style
- table style
- sidebar/detail-sheet pattern
- filter pattern
- button hierarchy
- icon language
- typography scale

### UI Change By Phase

#### Phase 1: Overview, Requests, Contractor Area, KYC
Expected UI impact: moderate

This phase needs the most product-depth change, but it still does not require a full design reset.

What changes visually:
- `overview.tsx` will need new KPI cards and more operational widgets
- `requests.tsx` will need more queue-oriented columns, filters, badges, and actions
- contractor pages will need more health/performance/status surfaces
- KYC will lose the testing-only upload action and become a stricter review flow

What should stay visually stable:
- dashboard shell
- card styling
- filter modal pattern
- table row styling
- sidebar and sheet treatment
- current color system and component primitives

Recommended Figma-safe approach:
- reuse existing cards rather than inventing new visual containers
- add new sections in the same layout grammar already used across the dashboard
- prefer new badges, stat chips, secondary panels, and tabs over new custom layouts

#### Phase 2: Settings Expansion and Disputes Surface
Expected UI impact: moderate to high

This phase introduces the most net-new product areas, so it may require the most new screens. Even so, the visual language can remain stable.

What changes visually:
- `settings.tsx` likely becomes a multi-section configuration workspace
- disputes may need a new route or a tabbed extension of support
- forms become denser because pricing, categories, promo rules, and notification templates need structured configuration UIs

What should stay visually stable:
- page header pattern
- section cards
- table and sidebar patterns
- filter and pagination patterns
- action menu patterns

Recommended Figma-safe approach:
- treat each new settings capability as a variation of existing dashboard sections
- use tabs, grouped cards, tables, drawers, and confirmation modals instead of inventing a new admin design system
- if Figma does not yet include disputes or marketplace settings screens, build them as extensions of current `Support` and `Settings` patterns, not as visually distinct products

#### Phase 3: Transactions Into Finance Operations
Expected UI impact: low to moderate

This phase is mostly a workflow and information-model upgrade, not a large visual departure.

What changes visually:
- more finance-specific summary cards
- clearer payout states and filters
- export/report actions
- failed payout and reconciliation views

What should stay visually stable:
- transaction table structure
- detail sidebar pattern
- existing status badge treatment
- shared filter and search layout

Recommended Figma-safe approach:
- keep `transactions.tsx` recognizable as the same page
- add finance depth through additional filters, cards, and side-panel detail rather than a new layout concept

#### Phase 4: Auth-Ready Login and Routing
Expected UI impact: low

This is mostly behavioral and structural, not visual.

What changes visually:
- login error states
- loading states
- maybe an MFA or verification step
- route guard behavior and session-expired UX

What should stay visually stable:
- current login visual identity
- core form layout
- overall route structure feel

Recommended Figma-safe approach:
- add auth states as variants of the existing login screen
- only introduce a second auth screen if the product truly requires MFA

### Overall Change Size
If we stay disciplined, the overall change should be:
- visual redesign level: low
- layout change level: moderate
- workflow change level: high
- information architecture change level: moderate to high
- domain model change level: high

In plain terms: the app should look like the same product, but behave like a much more operationally mature admin tool.

### Safe Rules To Avoid Straying From Figma
- Reuse existing component patterns first.
- Prefer adding states over inventing new components.
- Extend existing page templates before introducing new layouts.
- Treat Figma as the visual source of truth and PRD as the workflow source of truth.
- When PRD introduces a missing admin capability and Figma has no exact screen for it, build it as the closest possible extension of an existing Figma-backed screen.
- Keep new status colors, badges, and panel structures aligned with the current design tokens and interaction patterns.

### Recommended Build Strategy Under Figma Constraints
1. Do not start with new visuals. Start with data model and workflow mapping.
2. For each planned phase, identify which current page pattern it is closest to.
3. Expand using existing primitives: cards, tables, tabs, drawers, filters, modals, badges.
4. Only request new Figma designs where a completely new surface is unavoidable, such as a complex disputes workspace or pricing-rule builder.
5. Keep naming and status systems backend-ready even if the visuals remain conservative.

## Conclusion
The current frontend does not yet fully meet the PRD, but it gives us a good starting point. The best path forward is not to polish the existing pages in isolation. Instead, we should reorganize the admin frontend around operations, trust, finance, and marketplace configuration so the backend can later plug into a stable, production-minded UI model.
