# DB_SAFETY_RULES.md

## Related documentation

Product and UI behavior docs (including coach planning flows) live under **`docs/ui/`** and **`docs/srs/`**. They describe application behavior only and **do not** authorize or require any database mutation.

## Purpose

Protect all CETECH databases (development, test, and production-like environments) from unintended data loss or mutation during development, testing, or AI-assisted workflows.

This file defines **non-negotiable rules** that must be followed by all developers, tools, and AI agents (including Codex and Cursor).

---

## Core Principle

> **All databases are persistent and protected by default.**

No operation should modify database state unless it is:

1. Explicitly required
2. Clearly understood
3. Manually approved in the current session

---

## ABSOLUTE PROHIBITIONS

The following actions are **strictly forbidden** unless explicitly approved:

* Resetting the database
* Dropping schemas or tables
* Truncating tables
* Deleting records (bulk or targeted)
* Running seed scripts
* Running destructive migrations
* Overwriting or recreating demo/test users
* Running test scripts that mutate database state
* Executing any script that writes to `DATABASE_URL` or `DATABASE_URL_TEST`

---

## Forbidden Commands (Examples)

These must **never be executed without explicit approval**:

```bash
npx prisma migrate reset
npx prisma db push --force-reset
npx prisma db seed
```

```sql
DELETE FROM ...
TRUNCATE TABLE ...
DROP TABLE ...
DROP SCHEMA ...
```

Also includes:

* custom reset/bootstrap scripts
* test utilities that seed or wipe data
* any script with unclear DB impact

---

## DEFAULT OPERATING MODE

All contributors (human or AI) must operate in **DATA SAFETY MODE**:

* Assume all DBs are live and valuable
* Prefer **read-only investigation**
* Prefer **code fixes over data changes**
* Prefer **mocking/stubbing for tests**
* Do not rely on reseeding as a solution

---

## REQUIRED BEHAVIOR BEFORE ANY DB ACTION

Before running any command that could affect data:

1. Classify the command:

   * Read-only ✅
   * Mutating ❌
   * Unclear → treat as mutating ❌

2. If mutating or unclear:

   * DO NOT execute
   * Explain the risk
   * Ask for explicit approval

---

## AI AGENT RULES (CRITICAL)

All AI agents (Codex, Cursor, etc.) must:

* Never execute DB-mutating commands autonomously
* Never "fix" issues by altering DB data
* Never run seed/reset scripts during debugging
* Never assume test DB is safe to wipe
* Always ask before performing any data mutation

At the start of execution, AI agents must assume:

> **DATA SAFETY MODE ACTIVE**

---

## TESTING POLICY

* Tests must not mutate the runtime database (`DATABASE_URL`)
* Tests must isolate or mock DB interactions where possible
* If test data is required:

  * use controlled test DB (`DATABASE_URL_TEST`)
  * do not reset or wipe without approval
* Avoid shared-state dependency between tests

---

## DEMO / TEST USERS POLICY

* Demo users must be treated as persistent fixtures
* They must NOT be deleted, replaced, or overwritten
* If missing:

  * recreate via approved flow
  * do not mass reset DB

---

## ENVIRONMENT SAFETY

* Always verify active DB before running commands
* Confirm:

  * `DATABASE_URL`
  * `DATABASE_URL_TEST`
* Never assume environment is safe

---

## ENFORCEMENT

If any rule is violated:

* Stop execution immediately
* Do not attempt silent recovery
* Report the action and impact clearly

---

## SUMMARY

* No DB mutation without approval
* No reset, seed, or delete operations
* Always treat DB as critical asset
* Prefer investigation over destruction

---

## FINAL RULE

> **If you are not 100% sure a command is safe, DO NOT RUN IT.**

---

## DB reset prohibition (reinforced)

- Do **not** run `prisma migrate reset`.
- Do **not** run destructive reset commands.
- Do **not** wipe dev/test data unless **explicitly approved** in the current session.
- Use **`migrate deploy`** / **`db push`** only where appropriate and safe — never as a substitute for understanding impact.

---

## Nutrition Adherence migration (`AthleteNutritionItemAdherence`)

Nutrition Adherence added the **`AthleteNutritionItemAdherence`** table through a **Prisma migration** on the backend.

**Rules:**

- Apply the migration with **`npx prisma migrate deploy`** against the **correct** target database.
- Do **not** use `prisma migrate reset`.
- Do **not** use `prisma db push --force-reset`.
- Do **not** run `npm`/DB **reset** commands to fix missing-table errors.

**Adherence history tables:**

| Table | Role |
|-------|------|
| `AthleteSessionAdherenceEvent` | Session-level adherence history for **Skills**, **S&C**, and **Nutrition** |
| `AthleteNutritionItemAdherence` | Item-level **Nutrition** adherence snapshots (planned vs consumed nutrients) |

**Operational guidance** — if runtime error says **`AthleteNutritionItemAdherence` table does not exist**:

1. Confirm backend **main** contains the migration.
2. Confirm the **target DB** is correct (`DATABASE_URL` / environment).
3. Run **non-destructive** `npx prisma migrate deploy` against that DB.
4. Restart the backend service.
5. Do **not** install `pg` or add packages just to inspect migration state.
6. Do **not** expose DB credentials in logs.

---

## History / versioning next-slice safety

**Before** implementing DB history or versioning:

1. **First** audit current schema and services (inspect/report only).
2. **No migration** until the audit is reviewed.
3. **No broad redesign** of existing tables.
4. **No destructive alteration** of existing tables.
5. **Prefer append-only** history / snapshot patterns.
6. **Preserve** current source-of-truth records while adding history.

---

## History design principles

- Do **not** overwrite data needed for comparison.
- Use **append-only history records** or **versioned records**.
- Keep **current** tables where needed for fast current-state reads.
- Store **immutable snapshots** for planning context locks and important athlete state changes.
- **`TrainingPlanVersion`** already provides versioning for plans — **do not mutate** old versions.
- **Athlete adherence logs (shipped):** `AthleteSessionAdherenceEvent` and `AthleteNutritionItemAdherence` are **append-oriented** event history — treat as immutable once written; do not overwrite or bulk-delete during investigation.

---

## Tables to audit next

| Area | Tables / entities (representative) |
|------|-----------------------------------|
| Planning profile | `AthletePlanningProfile`, `AthletePlanningProfileHistory` |
| Workload | `TrainingPlanWorkloadAssessment`, workload assessment variants |
| Planning context | Planning context lock tables / snapshots |
| Plans | `TrainingPlan`, `TrainingPlanVersion`, `TrainingDay`, `PlannedSession` |
| Season / goals | Goal, Season, SeasonPhase tables |
| Assignment | `AthleteCoachAssignment` |
| Audit | Workflow / audit logs |
| Adherence (shipped — verify only) | `AthleteSessionAdherenceEvent`, `AthleteNutritionItemAdherence` |
| Metrics / completion | Performance, completion, and other metric tables (if present) |

---

## Required Cursor / Codex behavior for next DB history task

When starting the **DB History / Versioning Audit** slice:

1. **First response** must be **inspect / report only**.
2. **No code edits** in the first pass.
3. **No migrations**.
4. **No Prisma schema changes**.
5. Report: what already has history, what **overwrites**, and a **recommended minimal first slice**.

**Goal of audit:**

- Identify overwrite risks.
- Preserve historical snapshots.
- Enable past-vs-current comparisons.
- Support future dashboards, metrics, and analytics (adherence **logging** is already live; audit confirms append-only semantics and what remains overwrite-prone elsewhere).

---

## Wearables Integration Safety Requirements

**Before** Open Wearables implementation:

- No existing adherence tables may be modified destructively.
- No existing APP tables may be modified destructively.
- No existing planning-context tables may be modified destructively.
- Wearable data must be stored in **new isolated tables**.
- Historical wearable records must be **append-only**.
- Wearable imports must **never overwrite** previously collected source data.

---

## Metrics History Rule

All future metrics systems must preserve historical records.

**Examples:**

- Wearable metrics
- Recovery metrics
- Readiness metrics
- Golf metrics
- Future athlete performance metrics

Historical values must be queryable for trend analysis and AI evaluation.
