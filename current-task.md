## AidSprint Admin Roadmap (Figma-Safe Execution Board)

### Core Rule

Keep visuals aligned to the current Figma-backed dashboard shell. Treat Figma as the visual source of truth and the PRD as the workflow source of truth.

### Best-Practice Direction (Summary)

- Use explicit lifecycle states for jobs, payouts, disputes, and contractor trust/risk (avoid generic status buckets).
- Put urgent operational queues first: delayed jobs, disputed jobs, failed payouts, low-rated contractors, KYC blockers.
- Require confirmation + reason capture for destructive admin actions (suspension, cancellation, rejection, refund, payout reversal).
- Model frontend types so they map directly to future backend contracts (fix naming/status enums now).

### UI Impact (Planning Summary)

- Phase 1: moderate UI change, high workflow change.
- Phase 2: moderate to high UI change (settings expansion + disputes).
- Phase 3: low to moderate UI change (finance workflow depth, exports, reconciliation).
- Phase 4: low UI change (auth + route protection states).

### Prompt Index (Sorted)

#### Phase 1 (Operations Surfaces)

- Prompt 1: Overview operations control center (overview.tsx)
- Prompt 2: Requests dispatch + live monitoring workflow (requests.tsx + sidebar + overlay) — Done
- Prompt 3: Contractor operations surface (contractors area)
- Prompt 4: Contractor KYC read-only review + approve/reject (contractor-kyc-tab.tsx) — Done

#### Phase 2 (Marketplace + Disputes)

- Prompt 5: Settings marketplace configuration (settings.tsx)
- Prompt 6: Dedicated disputes surface (new route or support-branch section)

#### Phase 3 (Finance Ops)

- Prompt 7: Transactions finance operations (transactions.tsx)

#### Phase 4 (Auth + Routes)

- Prompt 8: Auth-ready login and protected states (login.tsx + route guards) — Done
- Prompt 9: Admin route architecture cleanup (routes + navigation normalization) — Done

**Planning Read**


- Planning conclusion stays the same: this is a low-redesign, high-workflow roadmap if we keep extending existing Figma-backed cards, tables, sidebars, filters, badges, drawers, and responsive breakpoints.

**UI Impact**

- Phase 1: moderate UI change, high workflow change.
- Phase 2: moderate to high UI change, mostly because `settings.tsx` and disputes add genuinely broader admin surfaces.
- Phase 3: low to moderate UI change.
- Phase 4: low UI change.
- Highest risk for needing fresh Figma decisions: disputes workspace, pricing/promo management, and deep finance reporting.
- Safest rule: reuse the current layout language first, only ask for new Figma where the workflow truly cannot fit the existing shell.

**Trae Prompts**

**Phase 1**

- Prompt 1: Overview operations control center

```text
Planning and implementation task: Refactor `src/components/overview/overview.tsx` into an operations-first control center without changing the current dashboard shell or visual language. Reuse the existing summary-card, chart, table, badge, filter, and responsive mobile-card patterns already present in `overview.tsx`, `requests.tsx`, `transactions.tsx`, and the shared dashboard primitives. Keep the page recognizably aligned to current Figma styling, but reorganize the information hierarchy so urgent operational queues appear first. Add cards and sections for delayed jobs, disputed jobs, failed payouts, KYC blockers, low-rated contractors, and live operational KPIs. Use explicit lifecycle labels and backend-ready naming. Do not invent a new design language; extend the current one. Add focused tests only where interaction logic changes materially.
```

- Prompt 2: Requests dispatch workflow

```text
Planning and implementation task: Upgrade `src/components/dashboard/requests/requests.tsx`, `requests-sidebar.tsx`, and `requests-overlay.tsx` into a dispatch and live-monitoring workflow while preserving the current table, sidebar, and overlay styling patterns. Reuse the working status-menu, drawer, badge, filter, pagination, and responsive mobile-card behavior already established across requests, support, transactions, overview, and contractor tabs. Add explicit request lifecycle states, urgent queue visibility, intervention actions, and better operational grouping, but keep the visual styling within the current Figma-backed component system. Ensure mobile and tablet layouts continue following the same breakpoints and stacking patterns as overview/users/contractors. ---DONE
```

- Prompt 3: Contractor operations surface

```text
Planning and implementation task: Refactor the contractor area in `src/components/dashboard/contractors/` into an operations-first contractor management surface without redesigning the existing Figma language. Extend the current contractor list, contractor details page, summary cards, request-history tab, and transaction-history tab with trust/risk indicators, low-rating watchlists, suspension and restore actions, performance metrics, and clearer contractor lifecycle states. Reuse existing card, tab, table, badge, menu, sidebar, and modal patterns before introducing any new layout structure. Keep the visual system consistent with current dashboard styling.
```

- Prompt 4: Contractor KYC read-only review

```text
Planning and implementation task: Remove the testing-only admin upload behavior from `src/components/dashboard/contractors/contractor-kyc-tab.tsx` and convert the KYC tab into a read-only review plus approve/reject workflow. Preserve the current tab structure and detail-card styling. Add confirmation and reason-capture UX for rejection decisions using existing modal/drawer patterns where possible. Keep naming and state models backend-ready and aligned with explicit approval states. --- DONE
```

**Phase 2**

- Prompt 5: Settings marketplace configuration

```text
Planning and implementation task: Expand `src/components/dashboard/setting/settings.tsx` into a marketplace-configuration workspace for service categories, pricing tiers, promos, and notification management. Preserve the current settings route and visual language, but reorganize the page into clearly separated configuration sections using existing cards, forms, toggles, tabs, and panel patterns. Treat this as an extension of the existing design system, not a new admin theme. If a workflow becomes too complex for the current page pattern, structure it as clearly separated internal sections before proposing brand-new surfaces.
```

- Prompt 6: Dedicated disputes surface

```text
Planning and implementation task: Create a dedicated disputes surface, either as a new route or a clearly separated operational section branching from the support workflow, while staying visually aligned with `support.tsx`, `support-sidebar.tsx`, `requests-sidebar.tsx`, and the existing table/detail-sheet system. Prioritize evidence review, linked job context, refund/reversal readiness, actor/reason auditability, and explicit dispute lifecycle states. Reuse existing list, badge, drawer, and filter patterns first. Only introduce a new page-level layout if the workflow cannot fit cleanly inside current support patterns.
```

**Phase 3**

- Prompt 7: Transactions finance operations

```text
Planning and implementation task: Upgrade `src/components/dashboard/transactions/transactions.tsx` into a finance-operations workspace for payouts, exports, reporting, failures, and reconciliation while preserving the current transaction page structure, summary cards, table styling, filters, dropdowns, and right-side detail panel patterns. Expand the workflow with explicit payout states, failure buckets, export actions, and reconciliation-focused views, but keep the UI visually consistent with existing Figma-backed pages. Use backend-ready finance naming and avoid generic statuses.
```

**Phase 4**

- Prompt 8: Auth-ready login and protected states

```text
Planning and implementation task: Make `src/login/login.tsx` and the app route structure auth-ready before backend integration starts. Keep the current visual language intact and limit UI changes to the states needed for real auth behavior: validation, loading, locked/unauthorized access, session expiry, and protected-route handling. Reuse existing feedback patterns such as toasts, inline messages, dialogs, and loading indicators. Focus on route guards, naming, and auth-state architecture more than visual redesign. ---- DONE
```

- Prompt 9: Admin route architecture cleanup

```text
Planning and implementation task: Refactor route structure and navigation so current and planned admin modules map cleanly to future backend contracts. Keep the existing sidebar and dashboard shell styling, but normalize route naming, module grouping, and protected navigation flow for overview, requests, contractors, transactions, support, disputes, settings, and future marketplace operations. Preserve the visual shell while improving information architecture. --- DONE
```

**Handover Updated**

- I updated [Task_handover.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/Task_handover.md) with the phase-by-phase UI impact assessment and the Trae prompt bank.
- I updated [.trae/Task_handover.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/.trae/Task_handover.md) with the concise continuation summary and prompt chunking plan.
- No feature code was changed in this planning pass beyond the handover summaries.

**Recommendation**

- Start with Phase 1 Prompt 2 or Prompt 4 first if you want the fastest operational payoff with the lowest Figma risk.
- Start with Phase 2 only after Phase 1 stabilizes the status models and admin action patterns.
- If you want, next I can turn this into a stricter execution board: one matrix with `file`, `goal`, `risk`, `Figma risk`, and `prompt order`.

I need you to read our entire codebase especially the taks handover summary files (both of them) to get an idea of where we are and what we are doing -- then i need you to take a look at this  -- Planning only DO NOT CHANGE ANYTHING YET but do update the taskhandover--- How much of a ui change will these need because we cant stray from current figma designs ---- Phase 1: Rebuild overview.tsx , requests.tsx , and the contractor area into an operations-first control center.

- Phase 1: Remove the testing-only KYC upload behavior from contractor-kyc-tab.tsx and convert it to read-only review + approve/reject UX.
- Phase 2: Expand settings.tsx into marketplace configuration for service categories, pricing tiers, promos, and notification management.
- Phase 2: Add a dedicated disputes surface, either as a new route or a clearly separated section from support.tsx .
- Phase 3: Upgrade transactions.tsx into finance operations with payouts, reporting, export, failures, and reconciliation.
- Phase 4: Make login.tsx and route structure auth-ready before backend integration starts.
Best-Practice Direction

- Use explicit lifecycle states for jobs, payouts, disputes, and contractor trust/risk, instead of broad generic statuses.
- Put urgent operational queues first: delayed jobs, disputed jobs, failed payouts, low-rated contractors, and KYC blockers should always be highly visible.
- Require confirmation + reason capture for destructive admin actions such as suspension, cancellation, rejection, refund, and payout reversal.
- Design all new frontend models so they map directly to future backend contracts; this is the right time to fix naming, status enums, and domain types.

**Short Answer**

- If we stay disciplined, this should be a **low redesign / high workflow** change.
- In other words: the app should still **look like the same Figma-based product**, but it will need to **behave like a more operational admin system**.

**Phase Impact**

- **Phase 1: `overview.tsx`, `requests.tsx`, contractor area, KYC**: **Moderate UI change**. This is the biggest visible shift, but it can still stay inside the current card, table, sidebar, badge, and filter patterns.
- **Phase 2: `settings.tsx` + disputes surface**: **Moderate to high UI change**. This adds the most new product area, so it likely needs the most new screens, but those screens can still be built as extensions of current `Settings` and `Support` patterns.
- **Phase 3: `transactions.tsx` finance operations**: **Low to moderate UI change**. Mostly more filters, summary cards, payout states, exports, and reconciliation views, not a new design language.
- **Phase 4: `login.tsx` + route/auth readiness**: **Low UI change**. Mostly error/loading/session/MFA states, not visual redesign.

**What Should Not Change**

- The current dashboard shell
- The current visual language from Figma
- Card styling
- Table styling
- Sidebar/detail sheet pattern
- Filter/modal behavior
- Button hierarchy
- Icon style
- Typography scale
- Overall spacing rhythm

**What Can Change Safely**

- Information hierarchy
- Data density
- Status badges and status taxonomy
- Admin actions and confirmation flows
- Tabs/sections within existing pages
- Route structure for new modules
- More operational widgets inside existing layouts

**Best Way To Stay Inside Figma**

- Treat **Figma as the visual source of truth** and the **PRD as the workflow source of truth**.
- Reuse current primitives first: cards, tables, filters, tabs, drawers, modals, badges.
- Prefer adding **new states and sections** over inventing new component styles.
- If a PRD feature has no exact Figma screen yet, build it as the **closest extension of an existing Figma-backed page**, not as a brand-new visual concept.
- Only request brand-new Figma surfaces where the workflow is genuinely new and cannot fit current page patterns, like a complex disputes workspace or pricing-rule builder.

**My Recommendation**

- **Phase 1** is safe to do without straying from Figma if we treat it as a **content and workflow upgrade**, not a redesign.
- **Phase 2** is the area most likely to need fresh Figma coverage, especially for disputes, pricing, promos, and notification management.
- **Phase 3 and 4** can almost certainly stay very close to the current UI language.

**Overall Estimate**

- **Visual redesign level**: Low
- **Layout change level**: Moderate
- **Workflow change level**: High
- **Information architecture change level**: Moderate to high
- **Domain model change level**: High

**Handover Updated**

- I updated the main planning document in [Task_handover.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/Task_handover.md).
- I also updated the lightweight continuation summary in [.trae/Task_handover.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/.trae/Task_handover.md).

**Task Summary**

- Kept this as planning-only, added a Figma-safe UI impact assessment to both handover files, and mapped each phase by how much visible UI change it should require while preserving the current design language.


Weve done Phase 1 Prompt 2 and Prompt 4, Phase 4/prompt 8 -- 
