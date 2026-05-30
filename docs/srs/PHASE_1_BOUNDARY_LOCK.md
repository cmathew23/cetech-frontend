# Phase 1 — Boundary Lock

> **Superseded detail:** For **academy admin** onboarding, **`GET /me/app-context`**, and **dashboard eligibility**, use **`docs/srs/03-ux/onboarding.md`** and **`docs/srs/03-ux/admin-dashboard.md`**. The list below is a **high-level** snapshot only.

## App Context (PARTIALLY LOCKED)

- **Backend:** role priority and response structure for `GET /me/app-context` are fixed contract inputs for the frontend.
- **IMPORTANT:** App-context is **not** the sole routing authority. It **must** be used together with **`GET /onboarding/status`** and guard logic.
- **Frontend must not assume** app-context alone controls all routing outcomes.

## Routing Boundary (LOCKED)

- **Final dashboard access** requires **`onboardingStatus === COMPLETE`** for the general case (see `resolveAuthGuard` in `src/middleware/authGuard.ts`; exceptions for specific routes such as coach invitation inbox).
- **Routing decisions** depend on:
  - app-context (`access.canAccessDashboard`, `reasonCode`, `dashboardType`, `academy.trainingEntityId`)
  - onboarding status and parsed onboarding data
  - guard logic and pathname rules

## Assignment Contract (LOCKED)

- **`GET /entities/:entityId/assignment-candidates`** is the **only** valid source for **assignment dropdown** options in the implemented admin workspace.
- Assignment submission uses **profile IDs** (`coachId` / `athleteId` in the candidates response) as wired in `src/lib/api/academyAdmin.ts`.
- **Response shape** for assignment candidates is treated as stable for integration; coordinate changes with frontend mapping.

---

## Academy Admin + Onboarding Boundary (Locked)

- Onboarding states are **backend-driven** (`GET /onboarding/status`). Examples:
  - `COMPLETE` → may redirect to role dashboard **after** `refreshSession` / access context checks (see onboarding page)
  - `ROLE_SELECTION_REQUIRED` → `/onboarding` role selection UI
  - `ACADEMY_SETUP_REQUIRED` → academy setup form (`POST /onboarding/academy-setup`); **not** automatic `/admin/dashboard`
- Dashboard routing **by role alone is insufficient**; **`GET /me/app-context`** + onboarding completion matter (see guardrails docs).
- Typical **default** dashboard paths when allowed: `ACADEMY_ADMIN` → `/admin/dashboard`, `COACH` → `/coach/dashboard`, `ATHLETE` → `/athlete/dashboard` (see `dashboardPathForComplete` / `resolvePostLoginDestination`).
- Invitations: athlete inbox redirect is implemented; **coach invitation list visibility** has **known gaps** — see `docs/srs/phase-2-gaps.md`.
- Assignment visibility is derived from accepted relationships, not invitation state

---

## Athlete Planning Profile — Frontend boundaries (confirmed)

- **Athlete working page** is **`/athlete/profile-planning`** (sidebar: **Athlete Profile Planning**). Single page for ongoing data entry and read-only backend status — not a separate “report only” route.
- **Athlete writes** are self-only against **`/entities/:entityId/athlete-planning-profile/me`**: `GET` bootstrap, `POST` create, `PATCH` update. After a successful write, the UI re-anchors from the **response body** (no requirement in code to call readiness GET for refresh). **`PATCH` must send only changed editable fields**; the frontend builds the body from a baseline vs draft diff and omits unchanged keys (backend infers change severity from payload keys).
- **Coach read** uses **`GET /entities/:entityId/athletes/:athleteId/planning-profile`** on route **`/coach/athletes/:athleteId/planning-profile`**. **No** coach-side edit/update for the athlete planning profile record exists in the frontend; the same route hosts a **coach workspace** for seasons/goals and **training plan draft generation** (see **`docs/ui/COACH_PLANNING_FLOW.md`**).
- **Coach dashboard** uses backend **`hasPlanningProfile`** on each assigned-athlete row to show **View** vs **Not Available**; the table does not prefetch planning profiles per row.
- **`entityId`** for these calls is **`academy.trainingEntityId`** from app-context (`GET /me/app-context`), same as other entity-scoped dashboard features.
- **Still deferred (not boundary changes — intentionally unbuilt):** athlete **confirm** UI, **readiness** GET usage in athlete APP UI. Coach-side **training plan draft** UI (execute, persist, latest draft, Skills/S&C revision) is implemented on the coach planning profile page — **`docs/ui/COACH_PLANNING_FLOW.md`**, **`docs/ui/SNC_UI.md`**.

### APP contract and ownership locks (Phase 1)

- **Grouped APP structure is locked** for frontend integration (`athleteContext` … `bodyCompositionParameters`); do not revert to flat-form payload assumptions.
- **`validatedLevel` ownership is locked** to coach/backend flow; athlete APP must keep it read-only.
- **Derived planning status fields are locked read-only** in athlete APP (`planningEligibilityStatus`, `planningInputCompleteness`, `missingRequiredFields`).
- **Wearables lock (MVP):** athlete APP remains `Wearable Status: No`; no wearable ingestion workflow in Phase 1.
- **Scope-creep prevention (deferred):**
  - no OpenWearables or device ingestion implementation in Phase 1
  - no medical/blood marker enforcement logic in athlete APP submission gates

---

## Phase 1 — Training plan workflow boundaries (validated)

### A. Validated workflow boundaries

- **Head Coach no function** workflow is supported.
- **Head Coach with Skills** workflow is supported.
- **Head Coach with Skills plus separate Skills Coach** workflow is supported.
- **No-Head-Coach Skills fallback** workflow is supported.
- **Direct release** applies only when **no Head Coach** exists.
- **Head Coach review/release** applies when a **Head Coach** exists.

### B. Training plan generation ownership boundary

- Generation ownership is **athlete-specific**.
- **`AthleteCoachAssignment.canGeneratePlan`** controls generation ownership (backend assignment table).
- **Role/function alone is insufficient** for Create / Generate enablement.
- If a **separate Skills Coach** owns Skills for an athlete, a Head Coach with Skills must **not** generate Skills for that athlete unless backend assignment says **`canGeneratePlan=true`**.
- **Frontend must not override** backend assignment ownership (`mergePlanGenerationOwnershipForDomain`, `coachTrainingPlanActions.ts`).

**Examples:**

| Athlete | Head Coach | Skills generator | `canGeneratePlan` (Skills) | Who generates Skills |
|---------|------------|------------------|----------------------------|----------------------|
| athlete601 | coach601 (HC + Skills) | coach601 | Yes | Head Coach generates Skills |
| athlete604 | coach601 (HC + Skills) | coach602 (Skills Coach) | No (coach601) / Yes (coach602) | coach602 generates; coach601 locks / reviews / releases |

### C. Planning context lock boundary

**If Head Coach exists:**

- Head Coach owns planning context.
- Assistant Skills / Nutrition / S&C coaches require **locked Head Coach planning context** before generation.
- Domain coaches **submit** to Head Coach.
- Head Coach **approves / releases**.

**If no Head Coach exists:**

- Assigned **Skills Coach** is fallback planning authority.
- Nutrition / S&C require **locked Skills planning context**.
- Domain coaches use **direct release** (no Head Coach review path).

### D. Session Adherence and Nutrition Adherence — Phase 1 adherence baseline (COMPLETED)

**Session Adherence and Nutrition Adherence are now part of the completed Phase 1 adherence baseline.** Merged backend **#46** (`feature/nutrition-adherence`); frontend **#10** (`feature/nutrition-adherence-ui`).

**Completed adherence baseline:**

- Skills adherence history via **`AthleteSessionAdherenceEvent`**.
- S&C adherence history via **`AthleteSessionAdherenceEvent`**.
- Nutrition adherence history via **`AthleteSessionAdherenceEvent`** + **`AthleteNutritionItemAdherence`**.
- Nutrition adherence captures **item-level planned-vs-consumed nutrient snapshots** (calories, macros, fiber, calcium, magnesium, potassium, sodium).
- Athlete weekly journal (`/athlete/weekly-plan`) supports **selected-day** adherence logging for Skills, S&C, and Nutrition.
- **Future-day adherence write protection** is **backend-enforced** (`TrainingDay.date`; blocks SKILL, STRENGTH_CONDITIONING, NUTRITION writes; GET history still allowed).
- **Frontend future-day disable** is **UX only**; backend remains source of truth.
- **History GET** must not permanently disable past/current submit; Submit becomes **Update log** after a saved athlete event exists.

**Still outside this completed slice:**

- Wearables integration (Phase 2 — see `docs/srs/phase-2-gaps.md` Open Wearables Integration).
- Nutrition nutrient analytics dashboard.
- AI adherence feedback.
- Meal replacement / custom food logging.
- Scoring / leaderboards.
- Charts-heavy analytics.
- Coach recommendations based on adherence.

**Weekly Adherence Dashboard:** **Completed** (see `docs/srs/IMPLEMENTATION_STATUS.md`).

---

## Adherence Scope Locked For Phase 1

Phase 1 adherence consists of:

### Skills

- Completion tracking
- Duration tracking
- Notes
- History

### S&C

- Completion tracking
- Duration tracking
- Notes
- History

### Nutrition

- Prescribed item adherence
- Actual consumption tracking
- Calorie tracking support
- History

### Explicitly Deferred

The following are **NOT** part of Phase 1:

- Wearables ingestion
- Recovery scoring
- Readiness scoring
- HRV analytics
- Sleep analytics
- Automatic adherence from wearable data
- AI adherence recommendations
- Cross-domain athlete performance analytics

These remain **Phase 2** items.

---

### E. Explicit non-goals (current phase)

- Do **not** implement a backend centralized action-state endpoint yet.
- Do **not** refactor workflow UI architecture yet.
- Do **not** conflate **completed athlete adherence logging** (§D) with **metrics dashboards**, wearables, or charts-heavy analytics (those remain future slices).
- Do **not** redesign nutrition catalog during workflow stabilization (catalog QA is a separate gap — see `docs/srs/phase-2-gaps.md`).
