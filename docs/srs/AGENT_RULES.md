## DATABASE SAFETY (CRITICAL — NON-NEGOTIABLE)

All database-related actions must comply with DB_SAFETY_RULES.md.
Do not run any DB-mutating commands. Follow DB_SAFETY_RULES.md.

All database operations across CETECH must comply with:

> docs/srs/DB_SAFETY_RULES.md

This is a **hard enforcement rule**.

### Mandatory Behavior

- Treat all databases (`DATABASE_URL`, `DATABASE_URL_TEST`) as **persistent and protected**
- Do NOT perform any database mutation unless explicitly approved in the current session
- Always assume data is valuable and must not be altered during debugging or testing

### Strictly Forbidden Without Explicit Approval

- Running destructive Prisma commands:
  - `npx prisma migrate reset`
  - `npx prisma db push --force-reset`
  - `npx prisma db seed`
- Executing SQL operations:
  - `DELETE`, `TRUNCATE`, `DROP`
- Running any script that modifies DB state
- Deleting or recreating demo/test users
- Running test utilities that mutate database state
- Modifying data in `DATABASE_URL` or `DATABASE_URL_TEST` environments

### AI Agent Enforcement (Codex, Cursor, etc.)

AI agents MUST:

- Read and follow `DB_SAFETY_RULES.md` before executing any task
- Never run DB-mutating commands autonomously
- Never “fix” issues by altering data
- Always ask for explicit approval before any operation that could affect DB state

At the start of any task involving backend or testing:

> **DATA SAFETY MODE ACTIVE**

### Failure Handling

If any DB safety rule is violated:

- Stop execution immediately
- Do not attempt silent fixes
- Report the action and impact

### Final Rule

> If there is ANY uncertainty about whether a command mutates the database, DO NOT RUN IT.

---

## Athlete Profile Planning (APP) — Implementation Guardrails (Current)

- Treat the **grouped APP contract** as the frontend source of truth:
  - `athleteContext`
  - `sportContext`
  - `sportPerformance`
  - `trainingExposure`
  - `healthStatus`
  - `nutritionContext`
  - `wearables`
  - `derivedPlanningInputs`
  - `bloodReportParameters`
  - `bodyCompositionParameters`
- In APP, **`validatedLevel` is not editable** (coach-owned / backend-owned output in athlete UI context).
- Derived status fields are **read-only** in APP (`planningEligibilityStatus`, `planningInputCompleteness`, `missingRequiredFields`).
- APP updates must remain **PATCH partial-safe**:
  - send only changed editable fields
  - preserve grouped payload shape
  - avoid full-record overwrite behavior
- For flexible APP fields (including `regionalCuisinePreference`), use the backend-supported **extension JSON model** as canonical; do not force schema churn from frontend assumptions.