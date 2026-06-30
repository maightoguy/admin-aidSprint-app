I would **not** ask the agent to implement notifications immediately.

I would ask it to **refactor the notification architecture first, then wire every workflow into it**. This is one of those moments where spending an extra hour now saves days of pain later. You're already planning email notifications, and eventually you'll probably want browser push, mobile push, maybe Slack or SMS for critical operational events. If you build the foundation correctly now, every new channel becomes straightforward.

Here's the prompt I'd use.

---

# AidSprint Notification Architecture Refactor & Full Integration

You are working on the AidSprint Admin Dashboard.

The notification audit has revealed that the current notification implementation is architecturally incomplete.

The goal is **NOT** simply to make the notification bell display data.

The goal is to build a scalable notification architecture that supports:

* In-app notifications (current)
* Realtime updates
* Email notifications (next milestone)
* Browser notifications (future)
* Mobile push notifications (future)
* Additional delivery channels without rewriting business logic

The notification system should become a first-class platform service.

---

# CURRENT STATE

The project currently has two isolated systems.

## System 1

`admin_action_log`

Purpose:

Immutable compliance audit trail.

This is functioning correctly.

Every admin mutation calls:

```
supabaseAuditLog.logAction(...)
```

This table is **NOT** intended for user-facing notifications.

It should remain an immutable historical record.

---

## System 2

`notifications`

Purpose:

Admin notification bell.

Already implemented:

* notifications table
* notification dropdown
* unread badge
* mark read
* realtime subscription

Problem:

Nothing writes meaningful admin notifications into this table.

Therefore the notification bell is effectively dead.

---

# IMPORTANT ARCHITECTURAL CHANGE

DO NOT make the audit log responsible for notifications.

Avoid this architecture:

```
Business Logic
      │
      ▼
admin_action_log
      │
      ▼
notifications
```

This couples two unrelated concerns.

Instead implement:

```
Business Event
      │
      ├────────► Audit Service
      │
      ├────────► Notification Service
      │
      ├────────► Realtime
      │
      ├────────► Email (future)
      │
      └────────► Push (future)
```

Audit logging answers:

"What happened?"

Notifications answer:

"Who should know?"

These are different responsibilities.

They must remain independent.

---

# PRIORITY 1

## Build a centralized Notification/Event Service

Create a single event service responsible for dispatching business events.

Suggested location:

```
src/lib/events/
```

or

```
src/lib/notifications/
```

Suggested API:

```ts
emitEvent({
    type,
    actorId,
    subjectId,
    metadata,
    notify,
    audit
})
```

The API should be extensible.

The implementation should internally dispatch to:

```
Audit Logger

↓

Notification Creator

↓

Realtime

↓

Email (stub)

↓

Push (stub)
```

Future delivery channels should only require adding another dispatcher.

Business logic should never know how notifications are delivered.

---

# PRIORITY 2

## Create Notification Service

Create:

```
NotificationService
```

Responsibilities:

* create notification records

* determine recipients

* notification formatting

* notification severity

* notification type

* notification metadata

Do NOT scatter notification inserts throughout the project.

Everything should go through this service.

---

# PRIORITY 3

## Recipient Routing

Support routing rules.

Some notifications go to:

* acting admin

Some go to:

* all admins

Some go to:

* assigned admin

Design this as a routing layer.

Example:

```
routeNotification(event)
```

Future recipients should be configurable.

---

# PRIORITY 4

## Expand Notification Types

Current types are insufficient.

Add admin-specific types.

Examples:

```
contractor_registered

kyc_submitted

kyc_approved

kyc_rejected

contractor_suspended

contractor_restored

job_created

job_assigned

job_cancelled

job_started

job_completed

dispute_created

dispute_resolved

refund_requested

refund_completed

withdrawal_requested

withdrawal_completed

payment_failed

support_ticket_created

support_ticket_resolved

system_warning

system_error
```

Update database constraints if required.

---

# PRIORITY 5

## Wire Every Business Workflow

Audit the entire codebase.

Every meaningful business event should emit an event.

This includes BOTH:

Admin-generated actions

AND

User-generated actions.

Do NOT limit notifications to admin mutations.

---

## Contractor Events

New registration

KYC uploaded

KYC approved

KYC rejected

Suspended

Restored

Deleted

Availability changes (if operationally important)

---

## Customer Events

New booking

Booking cancelled

Booking rescheduled

Complaint submitted

---

## Job Events

Job created

Contractor assigned

Accepted

Rejected

Started

Arrived

Completed

Cancelled

No-show

Contractor location unavailable

---

## Financial Events

Refund requested

Refund completed

Withdrawal requested

Withdrawal completed

Payment failed

Chargeback

Payout failure

---

## Support Events

Ticket opened

Ticket escalated

Ticket resolved

---

## Promotion Events

Promotion created

Promotion expired

Promotion deleted

---

## System Events

Realtime disconnected

Realtime restored

Queue failures

Scheduled task failures

Critical errors

---

# PRIORITY 6

## Notification Content

Notifications should include:

Title

Body

Type

Severity

Timestamp

Metadata

Target entity

Navigation target

Example:

```
Title

Contractor Approved

Body

John Doe has been approved and is ready to receive jobs.

Action

View Contractor
```

---

# PRIORITY 7

## Navigation

Clicking a notification should:

Navigate directly to the relevant page.

Examples:

Contractor notification

↓

Contractor details

Job notification

↓

Job details

Dispute notification

↓

Dispute page

Support notification

↓

Support ticket

Mark notification as read automatically.

---

# PRIORITY 8

## Email-Ready Architecture

DO NOT implement email sending yet.

Instead create a clean abstraction.

Example:

```
EmailDispatcher
```

Stub implementation only.

The notification service should already know how to call it.

When email is implemented later we should only replace the stub.

No business logic should change.

---

# PRIORITY 9

## Future Push Architecture

Create placeholder dispatcher:

```
PushDispatcher
```

No implementation required.

Just prepare the architecture.

---

# PRIORITY 10

## Browser Notifications

Do NOT implement.

Design so it can plug into NotificationService later.

---

# PRIORITY 11

## Improve Notification UI

Keep existing UI.

Enhance with:

Icons by notification type

Severity coloring

Unread indicator

Relative timestamps

Grouping of identical notifications

Examples:

Instead of:

```
5 contractor registrations
```

display:

```
5 new contractors awaiting approval
```

---

# PRIORITY 12

## Performance

Avoid duplicate notifications.

Prevent notification storms.

Support batching.

Maintain realtime responsiveness.

Ensure subscriptions are cleaned up correctly.

---

# PRIORITY 13

## Database Review

Review:

notifications table

Indexes

Constraints

RLS policies

Recipient lookup strategy

Ensure scalability.

---

# DELIVERABLES

Provide:

1. Notification architecture diagram (before vs after).

2. New event architecture.

3. Files created.

4. Files modified.

5. Database changes.

6. Routing strategy.

7. Workflow coverage matrix.

8. Remaining TODOs for Email implementation.

9. Remaining TODOs for Browser Push.

10. Remaining TODOs for Mobile Push.

---

# NON-NEGOTIABLE REQUIREMENTS

* Do NOT use `admin_action_log` as the source of notifications.
* Audit logging and notifications must remain independent.
* All business logic must emit through a centralized event layer.
* Notifications must be extensible to Email, Push, Browser Notifications, and future channels without modifying existing business workflows.
* Preserve all existing UI unless a small enhancement is required.
* Do not introduce duplicate event emissions or notification loops.
* Ensure the implementation remains compatible with the existing Supabase Realtime subscription model.

This approach gives you a clean event-driven foundation. When you later decide to add email notifications, the work should largely consist of implementing the `EmailDispatcher` rather than touching dozens of business workflows again. That's the kind of architectural decision that pays dividends instead of collecting interest in technical debt.





I would **absolutely break it up**.

Not because DeepSeek can't code it, but because this is a classic case where large agents start "helping" by refactoring unrelated parts of the codebase. You've already seen this happen with the Live Tracker. It solved the problem, then wandered off into package changes and React compatibility land. Imagine that, but across your entire notification system.

For a project that's **93-95% complete**, your priority is **controlled integration**, not massive rewrites.

## I'd split it into four phases.

### Phase 1 (Highest Priority): Build the Foundation ⭐⭐⭐⭐⭐

This is the most important prompt.

Have the agent:

* Build `EventService`
* Build `NotificationService`
* Build recipient routing
* Build notification type definitions
* Build EmailDispatcher stub
* Build PushDispatcher stub
* Do **not** wire business workflows yet.
* Do **not** modify UI.

Goal:

```text
Business Event
     ↓
EventService
     ├── Audit
     ├── Notification
     ├── Email (stub)
     └── Push (stub)
```

This is only about architecture.

Estimated changes:

* 6-10 files

Very safe.

---

### Phase 2: Wire Every Workflow ⭐⭐⭐⭐⭐

Now that the foundation exists:

Go through:

* contractors
* jobs
* disputes
* payments
* support
* promotions

and replace direct notification logic with:

```ts
EventService.emit(...)
```

This is mostly replacing calls, not inventing architecture.

Estimated:

20-40 files.

Still manageable.

---

### Phase 3: UI Improvements ⭐⭐⭐⭐☆

Once notifications actually flow.

Improve:

* unread badge
* icons
* grouping
* click-to-open
* mark-as-read
* navigation

This is isolated to dashboard UI.

Very low risk.

---

### Phase 4: Email Readiness ⭐⭐⭐☆☆

Implement:

```text
EmailDispatcher
```

using your chosen provider later.

Because you built the abstraction already:

Only one file changes.

No business logic changes.

---

# Why this order?

Imagine starting with the giant prompt.

DeepSeek might decide:

> "Since we're building an Event Service, I'll also rewrite the audit system..."

Then:

> "I'll normalize notification types..."

Then:

> "I'll migrate the database..."

Then:

> "I'll improve the dropdown..."

Then:

> "I'll optimize the subscriptions..."

Now you're debugging 70 modified files.

That is not where you want to be at 95% completion.

---

# Even better, I'd make Phase 1 smaller still.

## Prompt 1A

Create only:

* EventService
* NotificationService
* EmailDispatcher stub
* PushDispatcher stub
* Routing layer

No business logic.

No UI.

No SQL.

No workflow wiring.

Probably:

6 files.

Review.

Commit.

---

## Prompt 1B

Hook:

```
EventService
      ↓
Audit
Notification
```

into one workflow only.

For example:

```
Contractor Approval
```

Verify:

* audit still works
* notification appears
* realtime works

Commit.

---

## Prompt 2

Now wire:

* contractors
* jobs
* payments
* disputes
* support

Commit.

---

## Prompt 3

Improve notification UI.

Commit.

---

## Prompt 4

Add email implementation.

Commit.

---

# This is exactly how I'd manage the project

| Phase  | Scope                    | Risk        |
| ------ | ------------------------ | ----------- |
| **1A** | Event architecture only  | 🟢 Very Low |
| **1B** | One workflow integration | 🟢 Very Low |
| **2**  | Wire all workflows       | 🟡 Medium   |
| **3**  | Notification UI polish   | 🟢 Low      |
| **4**  | Email provider           | 🟢 Low      |

By the end of **Phase 2**, I would expect your admin panel to be **97-98% production-ready**, with the remaining work being testing, resilience, and operational polish rather than core feature development. At this stage of a project, keeping each change set small and reviewable is worth far more than squeezing everything into a single impressive-looking prompt.





I actually think this is worth doing properly. Based on everything I've seen from the AidSprint codebase and how DeepSeek V4 Pro behaves, I'd split this into **5 execution prompts**, not 4. Each prompt stays under roughly 10-20 files of change, has clear boundaries, and gives you a clean checkpoint before moving on.

At ~95% project completion, the biggest risk isn't missing features. It's accidentally destabilizing what already works.

I'd structure the work like this:

| Prompt | Goal                                        | Estimated Files | Risk |
| ------ | ------------------------------------------- | --------------: | ---- |
| **1**  | Build Notification/Event Architecture       |            8-12 | 🟢   |
| **2**  | Integrate All Business Workflows            |           20-40 | 🟡   |
| **3**  | Realtime, Recipient Routing & Reliability   |            8-15 | 🟢   |
| **4**  | Notification UX & Admin Experience          |            8-15 | 🟢   |
| **5**  | Email-Ready Architecture & Final Validation |            5-10 | 🟢   |

That order ensures the foundation exists before anything depends on it.

---

# PROMPT 1 — Build the Notification Architecture (Foundation)

---

You are working on the AidSprint Admin Dashboard.

The project is approximately **95% complete**.

This task is an **integration task**, not a redesign.

The objective is to build the notification architecture that every future notification will use.

DO NOT wire existing business workflows yet.

DO NOT redesign the notification UI.

DO NOT modify existing dashboard pages.

DO NOT remove existing audit logging.

Extend the current architecture only.

---

## Current Situation

The project currently contains:

### Audit

```
admin_action_log
```

used for compliance.

### Notifications

```
notifications
```

used for the notification bell.

The problem is these systems are independent.

The notification bell works.

Realtime works.

The database works.

Nothing generates notifications for administrators.

---

## Goal

Create a centralized event-driven notification architecture.

Business code should eventually emit business events.

Those events should fan out into:

```
Business Event
        │
        ▼
EventService
        │
        ├── Audit
        ├── Notification
        ├── Realtime
        ├── Email (stub)
        └── Push (stub)
```

Audit logging and notifications must remain independent.

Do NOT make the audit log responsible for notifications.

---

## Required Components

Create:

```
EventService
```

Responsibilities:

* receive business events
* dispatch internally
* no UI

---

Create:

```
NotificationService
```

Responsibilities:

* create notification records
* format notifications
* assign notification type
* assign severity
* attach metadata

No business logic should insert directly into the notifications table.

---

Create:

```
RecipientRouter
```

Responsibilities:

Determine recipients.

Support:

* acting admin
* all admins
* assigned admin

Design for future extensibility.

---

Create:

```
EmailDispatcher
```

Stub only.

No implementation.

---

Create:

```
PushDispatcher
```

Stub only.

No implementation.

---

Create notification type definitions.

Include at minimum:

* contractor_registered
* kyc_submitted
* kyc_approved
* kyc_rejected
* contractor_suspended
* contractor_restored
* job_created
* job_assigned
* job_started
* job_completed
* job_cancelled
* dispute_created
* dispute_resolved
* payment_failed
* refund_requested
* refund_completed
* withdrawal_requested
* withdrawal_completed
* support_ticket_created
* support_ticket_resolved
* promotion_created
* promotion_deleted
* system_warning
* system_error

---

Review the notifications table.

Only modify schema if absolutely required.

---

### DO NOT

* Wire workflows.
* Modify notification UI.
* Modify dashboard pages.
* Remove existing APIs.
* Rewrite audit logging.

---

Deliver:

* Architecture diagram
* Files created
* Files modified
* How future workflows should emit events

---

# PROMPT 2 — Integrate Every Business Workflow

---

The notification architecture now exists.

Do not redesign it.

Do not create new architecture.

Use the EventService already implemented.

---

Your task is to wire every important workflow into the EventService.

This is an integration task only.

---

Every meaningful business event should emit an event.

Both:

Admin-generated

and

User-generated.

---

## Contractor

* Registration
* KYC upload
* KYC approval
* KYC rejection
* Suspension
* Restoration

---

## Jobs

* Created
* Assigned
* Accepted
* Rejected
* Started
* Arrived
* Completed
* Cancelled
* No-show

---

## Payments

* Refund requested
* Refund completed
* Withdrawal requested
* Withdrawal completed
* Payment failed
* Chargeback

---

## Support

* Ticket created
* Escalated
* Resolved

---

## Promotions

* Created
* Deleted
* Expired

---

## System

* Critical failures
* Realtime disconnect
* Queue failures

---

For every workflow:

Replace direct notification logic.

Keep audit logging.

Call:

```
EventService.emit(...)
```

The EventService should internally handle:

* Audit
* Notification
* Realtime

---

Deliver:

* Workflow coverage matrix
* Files modified
* Remaining uncovered workflows

---

# PROMPT 3 — Realtime & Notification Reliability

---

Do not redesign UI.

Do not modify workflow logic.

Improve reliability only.

---

Verify every notification created for an administrator appears immediately.

Audit:

* realtime subscriptions
* unread badge
* mark read
* mark all read
* reconnect handling
* duplicate notification prevention

---

Implement recipient routing.

Support:

* all admins
* acting admin
* assigned admin

Future routing should be easy to extend.

---

Prevent:

* duplicate events
* duplicate notifications
* notification storms

---

Review:

Indexes

RLS

Queries

Subscription cleanup

Performance.

---

Deliver:

* reliability improvements
* routing strategy
* performance changes

---

# PROMPT 4 — Notification Experience

---

Backend already works.

Improve only the admin notification experience.

---

Preserve current AidSprint design.

Do not redesign.

Enhance.

---

Improve:

Unread badge

Icons

Severity

Relative timestamps

Notification grouping

Empty state

Loading state

Error state

Hover state

Click animation

Mark-as-read

Navigation.

---

Clicking a notification should navigate directly to the relevant resource.

Examples:

Contractor

↓

Contractor Details

Job

↓

Job Details

Dispute

↓

Dispute

Support

↓

Support Ticket

Mark notification as read automatically.

---

Deliver:

Files modified.

UX improvements.

Accessibility improvements.

---

# PROMPT 5 — Email Readiness & Final Audit

---

Do NOT implement email sending.

Prepare the architecture.

---

Connect:

```
EventService
```

to

```
EmailDispatcher
```

through an abstraction only.

The dispatcher should receive all required data but perform no delivery.

---

Review the entire notification architecture.

Verify:

* scalability
* separation of concerns
* future extensibility
* no duplicated business logic
* no notification loops

---

Produce a final report.

Include:

* architecture diagram
* notification flow
* workflow coverage
* missing events
* email readiness
* browser notification readiness
* mobile push readiness

---

## One additional recommendation

Before running **Prompt 2**, commit the code after Prompt 1 if you're using Git (or at least make a backup of the project). Prompt 2 is where the majority of files will change because it's wiring dozens of workflows into the new architecture. Having a clean rollback point there is far more valuable than discovering later that a regression slipped into a business flow.
