# Task Handover - AidSprint Admin App

## Status: In-Progress

## Latest Changes:

- The canonical handover file is now `.trae/Task_handover.md`. This path must be kept because the Trae handover skill is explicitly wired to update `.trae/Task_handover.md`; deleting it would break future automatic handover updates.
- The former root handover file content was merged into this canonical handover so there is one authoritative continuation source.
- The current resume point is `L2` in [Integration-task-readiness-plan.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/Integration-task-readiness-plan.md#L1077-L1092): replace the local-only promos and notification campaign settings flows with live Supabase integration.
- The readiness plan now correctly marks `L1`, `N1`, and `N2` as done in addition to the earlier completed chunks through `K1`.
- `L1` is complete because the backend contract already exists in `supabase/migrations/20260618091058_remote_schema.sql` with `promo_codes`, `promo_code_redemptions`, `notification_templates`, `notification_campaigns`, and `notification_deliveries`, plus constraints, indexes, and admin-facing policies.
- `N1` and `N2` are complete because the users list and user-details surfaces now explicitly disable unsupported live lifecycle/request actions instead of pretending they persist.
- Fixed the contractor onboarding queue visibility bug in `src/components/dashboard/contractors/contractors.tsx` so the "Pending verification" queue includes both `verificationState === "Pending review"` and `lifecycleState === "Pending approval"`.
- Added a focused regression test in `src/components/dashboard/contractors/contractors.test.tsx` proving a contractor can remain visible in the pending queue while still blocked on lifecycle approval.
- Fixed the premature admin `Verified` badge in `src/lib/supabase/mappers.ts` by deriving contractor verification from document review state first:
  - `Rejected` if any KYC document is rejected
  - `Verified` only when required document categories are approved
  - `Pending review` while uploaded documents are still pending
- Added regression coverage in `src/lib/supabase/mappers.test.ts` for the pending, approved, and rejected KYC document scenarios.
- Added manual SQL in `supabase/manual_sql/contractor_verification_promotes_pending_approval.sql` to promote fully verified contractors from `pending_approval` to `offline` where needed in manual integration workflows.
- Documented and pinned an unresolved platform-level KYC blocker in [Test plan of contractor kyc.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/Test%20plan%20of%20contractor%20kyc.md):
  - before upload: contractor row has `is_verified = false` and all three `*_complete` flags are `false`
  - after KYC upload but before admin review: contractor row flips to `is_verified = true` and all three `*_complete` flags become `true`
  - at the same moment, `contractor_documents.status` is still `pending` and `reviewed_at` / `reviewed_by` remain `null`
  - conclusion: the admin UI bug was real and has been mitigated locally, but the upstream mobile/backend flow is still promoting contractor verification too early during upload
- Fixed favicon path in `index.html` from `public/Icon.png` to `/Icon.png` for proper Vite public asset resolution.
- Confirmed earlier integration progress that remains relevant:
  - `D1` contractor KYC approval/rejection writes are implemented
  - `H1` jobs/contractors realtime is done
  - `H2` notifications realtime is done
  - `I1` disputes/support contract shaping is done
  - `I2` live disputes/support reads and writes are done
  - `J1` admin authorization hardening is done

## Current Context:

- The app has moved well beyond mock-only operation in many modules, but `server/index.ts` is still starter-level and most live behavior is currently driven through Supabase client reads/writes rather than custom server APIs.
- The codebase already has strong dashboard/table/sidebar/filter foundations across `Users`, `Contractors`, `Requests`, `Transactions`, `Support`, `Disputes`, and `Settings`.
- The most important active planning file is [Integration-task-readiness-plan.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/Integration-task-readiness-plan.md).
- Current completed integration status is effectively:
  - earlier chunks through `K1`
  - plus `L1`, `N1`, and `N2`
- The next active implementation target is `L2`.
- Important backend contract snapshots:
  - promo/campaign schema target for `L2`: `supabase/migrations/20260618091058_remote_schema.sql`
  - contractor verification trigger snapshot referenced during KYC debugging: `supabase/migrations/20260618135951_remote_schema.sql`
- The mobile/backend KYC issue is intentionally unresolved. Do not "fix" it from the admin repo without confirmation from the mobile/backend side, because the likely root cause is upstream writing of `id_verification_complete`, `police_check_complete`, and `service_licences_complete` during upload rather than after admin approval.
- The admin-side mitigation is already applied: visible verification badges now trust document review states before contractor-level `is_verified`.
- Validation completed in the recent KYC/contractor pass:
  - `corepack pnpm vitest run src/components/dashboard/contractors/contractors.test.tsx src/lib/supabase/mappers.test.ts`
  - `corepack pnpm typecheck`
  - diagnostics were clean for the edited contractor and mapper files

## Next Steps:

- Start at `L2` in [Integration-task-readiness-plan.md](file:///c:/Users/hp/Desktop/Work/Assignment/aidSprint-app/admin-aidSprint-app/Integration-task-readiness-plan.md#L1077-L1092).
- First inspect the current settings/marketplace implementation around:
  - `src/components/dashboard/setting/marketplace-config.tsx`
  - `src/components/dashboard/setting/marketplace-config.data.ts`
  - `src/components/dashboard/setting/marketplace-page.tsx`
  - related Supabase helpers in `src/lib/supabase/data.ts` and mapper utilities
- Preserve the current Settings and Marketplace visual structure while replacing local-only promo/template/campaign flows with real Supabase-backed reads and writes.
- Only remove local-only success behavior when the corresponding live mutation path is actually implemented.
- Add focused tests only for the newly live promo/template/campaign mutation paths.
- Keep the pinned contractor/mobile KYC blocker untouched for now except for documentation follow-up if the mobile developer replies.
