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

---

## Training plan workflow — agent rules (validated slice)

### 1. Workflow source-of-truth rule

- **`AthleteCoachAssignment.canGeneratePlan`** is the source of truth for **athlete-specific** plan generation ownership.
- Frontend must **not** infer generation rights from role/function labels alone (e.g. “Skills Coach”, “Head Coach + Skills”).
- Correct workflow-debug trace (in order):
  1. Backend assignment table
  2. Backend API response
  3. Frontend API mapping
  4. UI button/action condition
- Do **not** jump directly to code changes without proving this chain.

### 2. Head Coach vs no-Head-Coach planning context rule

**If Head Coach exists:**

- Head Coach owns planning context.
- Assistant Skills / Nutrition / S&C coaches require **locked Head Coach planning context** before generation.
- Domain coaches **submit** to Head Coach.
- Head Coach **approves / releases**.

**If no Head Coach exists:**

- Assigned **Skills Coach** is fallback planning authority.
- Nutrition / S&C require **locked Skills planning context**.
- Domain coaches use **direct release**.

### 3. Assignment ownership examples

**Athlete 601 (Howard Golf Academy — Sunny Menon):**

- coach601 = Head Coach + Skills
- `canGeneratePlan` = **Yes**
- **Head Coach** generates Skills.

**Athlete 604 (Howard Golf Academy — Mason McDermott):**

- coach601 = Head Coach + Skills, `canGeneratePlan` = **No**
- coach602 = Skills Coach, `canGeneratePlan` = **Yes**
- **coach602** generates Skills; **coach601** only locks / reviews / releases.

### 4. No-overengineering workflow-debug rule

- Do **not** redesign workflow architecture when a workflow bug appears.
- **Inspect / report first.**
- Fix only the **smallest proven source**.
- Do **not** touch nutrition display, athlete weekly journal, date helpers, release logic, or backend policy unless **directly proven relevant**.

### 5. Nutrition revision integrity rule

- Nutrition revision must **not** persist a new version unless the requested coach change is **actually applied**.
- Example: “add 1 bowl of rice to Friday 22/05/2026” must either add rice on **2026-05-22** or return a controlled **422**.
- Backend error code: **`NUTRITION_REVISION_REQUEST_NOT_APPLIED`**.
- Frontend must **not** show fake success if backend rejects the revision.

### 6. Next-priority rule

- **Next major work:** DB history / versioning audit.
- **No** dashboard / metrics / adherence work should begin before auditing **overwritten vs historical** data storage.
- **First step:** inspect / report only — **no migrations**, **no code changes** (see `docs/srs/DB_SAFETY_RULES.md`, `docs/srs/phase-2-gaps.md` §13).