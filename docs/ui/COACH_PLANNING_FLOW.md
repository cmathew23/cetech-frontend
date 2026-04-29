# Coach planning flow (current UI)

This document describes **coach-facing user flows and on-screen behavior** in the CETECH frontend as implemented today. It does not describe backend rules beyond what the UI reflects.

---

## 1. Coach dashboard flow

### Coach login

- Coach signs in at **`/login`** (see root `README.md` and `docs/srs/README.md` for password reset routes).
- Post-login routing is driven by **`GET /me/app-context`**, **`GET /onboarding/status`**, and guard logic in `src/middleware/authGuard.ts` (summarized in `docs/srs/IMPLEMENTATION_STATUS.md`).

### Dashboard routing

- When access is allowed for a coach, the default coach destination is **`/coach/dashboard`** (`CoachDashboardView`).
- The planning profile for a specific athlete is **`/coach/athletes/[athleteId]/planning-profile`** (`CoachAthletePlanningProfileView`).
- Level validation for an athlete is **`/coach/athletes/[athleteId]/level-validation`** (`CoachAthleteLevelValidationView`).

### Invitation gating (surface in UI)

- The coach dashboard shows a prominent **Invitations** entry that links to **`/coach/dashboard/invitations`** (accept/decline workspace).
- Broader invitation-phase routing and guard exceptions are documented in `docs/srs/03-ux/onboarding.md` and `docs/srs/phase-2-gaps.md` (coach invitation visibility is a known gap).

### Athlete selection

- **Assigned athletes** table on `/coach/dashboard` is loaded via **`GET /coach/me/assigned-athletes`** (`src/lib/api/coachMe.ts`).
- Per row:
  - If the athlete **does not** have a planning profile (`hasPlanningProfile === false`), the UI shows **Planning Profile Pending** and explains the athlete must complete APP first.
  - If **`hasPlanningProfile === true`**, the UI offers **View Planning Profile** → `/coach/athletes/{athleteId}/planning-profile`.
  - Coaches authorized for level validation also see **Validate Level** → `/coach/athletes/{athleteId}/level-validation` (`canCoachValidateLevel` in `src/lib/coachAuthority.ts`).

---

## 2. Athlete planning profile (coach read-only + generation workspace)

**Route:** `/coach/athletes/[athleteId]/planning-profile`  
**Component:** `src/components/dashboard/coach/CoachAthletePlanningProfileView.tsx`

### Open athlete

- From the dashboard, **View Planning Profile** opens the athlete’s coach planning workspace (not the athlete’s editable APP page).

### Planning profile summary

- Read-only planning profile data is loaded with **`GET /entities/{entityId}/athletes/{athleteId}/planning-profile`** (`src/lib/api/coachAthletePlanningProfile.ts`).  
- `entityId` comes from app context (`academy.trainingEntityId`) via `useAuth`.

### Level validation (readiness inputs)

- The page surfaces **training plan readiness** inputs used to unlock **Step 6 - Ready to Generate**:
  - **APP complete** (`appCompleteness === "COMPLETE"`)
  - **Level validation confirmed** (`validationStatus === "CONFIRMED"`)
  - **Planning eligibility** for workload assessment (`planningEligibility === "ELIGIBLE_FOR_WORKLOAD_ASSESSMENT"`)
- Coaches who can validate level see **Continue to Level Validation**, which navigates to the level-validation route.

### Workload assessment

- When eligibility allows, the UI can run workload assessment via **`GET /entities/.../training-plan-generation/workload-assessment`** (helper in `src/lib/api/coachAthletePlanningReadiness.ts`).
- **Step 6** shows **Workload assessment complete** as Yes/No based on whether a workload classification object is present in the result.

### Goal setup (phase-aware)

- Season, phases, and goals are managed in-card using APIs from `src/lib/api/coachAthleteGoalsSeasonSetup.ts` (season cycles, phases, goals).
- The UI detects the **current phase** from phase date ranges and shows **Current Phase … Goals** sections whose copy depends on the coach’s **current generation domain** (Skills vs S&C vs Nutrition labels).
- **Goals** are filtered so only goals whose **domain** matches the coach’s current generation domain appear in the checklist used for generation (see `docs/ui/GOALS_UI.md`).
- **Selected goal IDs** are shown; generation uses the checked active goals for the current phase.

### Plan window

- **Duration**, **plan start date**, and **computed end date** are shown.
- For **S&C**, the duration control is **disabled** and the effective duration is fixed to **7 days** in the UI logic.

### Generate plan (Skills / S&C)

- One or more **Generate … Plan** buttons appear for generation domains derived from the coach’s functions (**Skills**, **S&C**; Nutrition may appear if assigned).
- Buttons stay disabled until **Step 6** checklist passes (APP, level validation, workload assessment, season, current phase, plan window inside phase, and at least one selected goal).
- **Loading:** while generating, the UI shows **Generating plan…** and then **Saving draft…** during persist.
- **Flow:** `POST …/training-plan-generation/execute` then `POST …/training-plan-generation/persist-draft` (helpers in `src/lib/api/coachAthletePlanningReadiness.ts`).
- **Success:** an **Alert** lists persisted draft metadata (training plan id, version id, version number, status, counts). For **Skills** or **S&C**, the UI then refetches the **latest domain draft**.

### Latest draft display

- Loaded with **`GET …/training-plan-generation/domain-drafts/latest?generationDomain=…`**.
- Renders metadata rows, optional **Revision Summary** (see `docs/ui/SNC_UI.md` / shared summary behavior), then **days → sessions → items** detail rows.
- **Item “Summary”** row is shown only when the displayed draft domain is **Skills** (not for S&C items).

### Revision (Skills vs S&C)

- **Revise Skills Plan** block appears only when the latest displayed draft domain is **Skills** (`POST …/training-plan-generation/revise`).
- **Revise S&C Plan** block appears only when the latest displayed draft domain is **S&C** (`POST …/training-plan-generation/sandc/revise`).
- Details: `docs/ui/SNC_UI.md`.

---

## 3. API integration (UI → client → paths)

- **Path strings** are centralized in `src/config/endpoints.ts` (`paths.entities.*`).
- **HTTP** goes through `apiRequest` in `src/lib/apiClient.ts` (JSON, auth header, normalized errors).
- **Training plan** helpers live in `src/lib/api/coachAthletePlanningReadiness.ts` (execute, persist, latest draft, revise Skills, revise S&C).
- **Level validation** UI uses `src/lib/api/coachAthleteLevelValidation.ts`.

---

## 4. Error handling (planning profile page)

- **Generation** surfaces API/message errors in red **Alert** components; some branches use shared copy (e.g. AI output validation failure message). Domain authorization failures can show a dedicated message when the normalized error code is `UNAUTHORIZED_DOMAIN_FOR_COACH_FUNCTION`.
- **Skills revision** errors: validation-style failures use the shared AI validation message; otherwise a generic revise failure message.
- **S&C revision** errors: failure **Alert** shows `Revision failed: <message> (<code>)` when a code is present, and logs the error to the console.

---

## 5. Component responsibilities

| Layer | Responsibility |
|--------|----------------|
| `CoachAthletePlanningProfileView` | End-to-end coach workspace: readiness, season/goals, plan window, generate, latest draft, revision blocks |
| `CoachDashboardView` | Roster, invitations entry, links to planning profile / level validation |
| `GoalDisplayBlock` | Presentation of a goal row (optional checkbox control on planning page) |
| `src/lib/api/*` | Typed request helpers; no React |
| `src/config/endpoints.ts` | Canonical URL path builders |
