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
