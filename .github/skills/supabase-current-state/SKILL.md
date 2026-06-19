---
name: "supabase-current-state"
description: "Finds the current Supabase schema snapshot and SQL workflow rules. Invoke when user mentions schema/state updates or before writing integration SQL/mappers."
---

# Supabase Current State

## When to Invoke

Invoke this skill whenever:

- The user says they updated Supabase (ran SQL, changed policies, edited tables), or asks to “check the current Supabase state”.
- You are about to implement integration code that depends on tables/columns/enums/RLS behavior.
- You are about to propose SQL changes or rely on schema assumptions.

## Source of Truth (Local Workspace)

1. Read the newest schema snapshot first:
   - `supabase/migrations/*_remote_schema.sql` (pick the highest timestamp / most recently modified file).
2. If a change requires manual SQL scripts:
   - Store them under `supabase/manual_sql/` with descriptive filenames.
   - Do not add ad-hoc SQL files to `supabase/migrations/` (it can break `supabase db pull` due to migration-history mismatches).

## How to Use the Snapshot

- Treat the newest `*_remote_schema.sql` as the authoritative view of the current schema.
- Validate any table/column names, constraints, and functions against that file before writing frontend queries/mappers.
- If the user says they ran manual SQL, assume the snapshot was updated accordingly and re-check the newest snapshot.

## Integration Guardrails

- Prefer frontend-only Supabase calls unless logic must be server-side.
- Enforce least privilege; for admin authorization checks, only query what is required (e.g., `profiles.role` for the signed-in user).
