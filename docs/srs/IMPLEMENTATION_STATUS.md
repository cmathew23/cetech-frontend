# Implementation Status

## Authoritative UX / academy-admin docs (current)

**Source of truth for academy-admin onboarding, access-context gating, and admin dashboard behavior:**

- `docs/srs/03-ux/onboarding.md` — `GET /onboarding/status`, `GET /me/app-context`, `POST /onboarding/academy-setup`, invitation-aware rules, deprecated shortcuts
- `docs/srs/03-ux/admin-dashboard.md` — `/admin/*` guards, eligibility, known admin UI issues
- `docs/srs/phase-2-gaps.md` — open gaps (including coach invitation visibility); **§13** adherence (completed); **§14** metrics dashboards (open)

The sections below retain **auth password-flow** notes; **dashboard/onboarding** summaries in older revisions are superseded by the documents above.

---

## Weekly Adherence Dashboard (Completed)

### Backend

- Weekly adherence aggregation API implemented.
- Supports **SKILL**, **NUTRITION**, and **STRENGTH_CONDITIONING** domains.
- Returns:
  - `plannedSessions`
  - `loggedSessions`
  - `adherencePercent`
  - `weekStart`
  - `weekEnd`

### Frontend

- Athlete Weekly Adherence Overview implemented.
- Coach Weekly Adherence Overview implemented (role-scoped domain visibility).
- Dashboard loads automatically after login and persists after hard refresh.
- KPI cards display domain-level adherence percentages from backend only.
- Frontend renders **only backend-returned domains**; does not calculate adherence percent.
- Frontend does not infer Head Coach / Specialist domain access from labels.
- Plan week/date range comes from backend plan week, not a generic calendar week.
- Athlete notes are **not** rendered on coach dashboard cards.
- Shared identity/access context stabilized (`useAuth`, `AthletePageReadyContext`) to avoid login/hard-refresh loading bugs.
- Weekly adherence context provider added to stabilize state management.
- Manual QA confirmed: athlete login + hard refresh load adherence; Head Coach sees all domains; specialists see only own domain; no endless Loading/Preparing state.

---

## Session Adherence UI (Completed)

### Skills

- Athlete can log completion of prescribed skill drills.
- History displayed to athlete.
- Existing log can be updated.

### S&C

- Athlete can log completion of prescribed S&C exercises.
- History displayed to athlete.
- Existing log can be updated.

---

## Nutrition Adherence UI (Completed)

### Nutrition

- **`NutritionSessionAdherencePanel`** exists separately from Skills/S&C `SessionAdherencePanel`.
- Portion controls: **Not eaten (0)**, **Half (0.5)**, **Full (1)**, **Extra (1.25)**.
- Shows planned item label, serving, timing, calories/macros, and available micronutrients.
- Null micronutrients are not displayed as zero.
- Submit becomes **Update log** after save.
- Future days disabled; past/current days active.
- Selected-day weekly journal layout restored.
- Athlete can log adherence per prescribed nutrition item.
- Item-level adherence supported.
- `occurredAt` captured and persisted.
- Existing adherence records can be updated.
- History displayed to athlete.

---

## Frontend Workflow Stabilization (Completed)

- Weekly journal pagination restored.
- Future-day logging blocked.
- Submit button disabled until history loads.
- Review cards no longer auto-open unexpectedly.
- Dashboard survives login/reload cycles.

---

## Coach ↔ Athlete Chat MVP (Completed — Frontend)

- Minimal text-only chat UI for coach and athlete sidebars (`Chat with Athlete` / `Chat with Coach`).
- Socket.IO realtime messaging integrated via shared `ChatPanel`.
- Message history visible for last **96 hours** in UI; DB retains all messages.
- Unread badge/count in sidebar; unread-count is optional badge data and **must never block** chat or page loading.
- Unread fetches only after page readiness (`AthletePageReadyContext`); fails silently during login/navigation transitions.
- Chat eligibility based on **ACTIVE `AthleteCoachAssignment`**, not plan release or planning context.
- No attachments, images, audio, or video in MVP.

---

## Fyn Assistant History UI (Completed — Frontend)

- Athlete Fyn page loads last **72 hours** of own Fyn history.
- Coach Fyn page loads last **72 hours** of own Fyn history scoped to selected athlete.
- History refetches after successful send; duplicate messages avoided.
- Date/time displayed per message.
- No `localStorage`; no frontend-side 72-hour filtering; no `conversationId`; no pagination.
- Privacy rule: frontend must not assume visibility; backend actor-scoped history is source of truth.

---

## Sport Metrics v2 Frontend (Completed)

- Sport Metrics UI upgraded from random logging to structured result capture.
- Improved log-result modal; drill classification display; inline post-save summary.
- Evidence cards and goal/progress summary improved.
- Coach sidebar includes **Athlete Performance** page; main coach dashboard kept lighter.

---

## Fyn Future UI Direction (Deferred)

- Fyn should become a governed coach revision assistant (not implemented).
- Future: explain plan rationale, show valid database-backed options, help coach-selected revisions.
- Fyn must **not** freely mutate plans, bypass approval, ignore role gates, invent unavailable items, or change locked context.

---

## Completed: Session Adherence + Nutrition Adherence + Adherence State Hardening

**Merged work:** Backend PR **#46** (`feature/nutrition-adherence`); frontend PR **#10** (`feature/nutrition-adherence-ui`).

**Code references (frontend):** `src/app/athlete/weekly-plan/page.tsx`, `src/components/dashboard/athlete/AthleteWeeklyPlanJournalPageContent.tsx`, `src/lib/api/athleteSessionAdherence.ts`, `src/lib/apiClient.ts`, `paths.trainingSessions.plannedSessionAdherenceEvents(plannedSessionId)`.

### Backend completed

- Skills/S&C session adherence history is available through **`AthleteSessionAdherenceEvent`**.
- Added **`AthleteNutritionItemAdherence`** table for item-level Nutrition adherence history (Prisma migration — apply with `npx prisma migrate deploy`; see `docs/srs/DB_SAFETY_RULES.md`).
- Nutrition adherence uses the existing **planned-session adherence-events** endpoint (`GET`/`POST` `.../planned-sessions/:plannedSessionId/adherence-events`).
- Nutrition **POST** creates one **`AthleteSessionAdherenceEvent`** plus item-level **`AthleteNutritionItemAdherence`** rows.
- Nutrition **GET** returns **`items[]`** for Nutrition adherence events.
- Nutrition planned/consumed snapshots include **calories, protein, carbs, fat, fiber, calcium, magnesium, potassium, and sodium**.
- Nutrition **`completionPercent`** and **`adherenceOutcome`** are **backend-derived** from `consumedPortionFactor`.
- Added backend **future-day adherence guard** using **`TrainingDay.date`**.
- Future-day adherence **writes** are blocked for **SKILL**, **STRENGTH_CONDITIONING**, and **NUTRITION**.
- **GET** adherence history remains allowed for future planned days.

### Frontend completed

- Added Nutrition adherence API client/types (`athleteSessionAdherence.ts`).
- Added **`NutritionSessionAdherencePanel`** in athlete weekly journal.
- Nutrition portion controls: **Not eaten**, **Half**, **Full**, **Extra**.
- Restored **selected-day** weekly journal layout (Plan by day).
- Fixed **Submit / Update log** button state after save.
- Fixed frontend API error extraction for backend `{ "error": "..." }` responses (`apiClient.ts`).
- Added **`occurredAt`** to Nutrition adherence POST.
- Disabled **future-day** logging in UI while keeping future plans visible.
- Fixed **past/current-day** logging so history loading does **not** disable Submit.

### Validation

| Check | Result |
|-------|--------|
| Backend `sessionAdherenceHistory` targeted suite | **23 tests passed** |
| Frontend `athleteSessionAdherence.test.ts` | **14 tests passed** |
| Manual QA | **athlete501** across all available journal days |

### Still future (not in this slice)

- Nutrition nutrient drilldown / analytics dashboards.
- Wearables, AI adherence feedback, meal replacement/custom food, scoring/leaderboards, charts-heavy analytics.
- See `docs/srs/phase-2-gaps.md` for remaining gaps; **next planned work:** **Open Wearables Integration** and metrics dashboard expansion.

---

## Workflow Stabilization Completed

**Status:** Core Head Coach and no-Head-Coach generation/release workflows are functionally validated. **Stop workflow testing** unless new code changes touch workflow logic. **Next planned product slice:** Open Wearables Integration (`docs/srs/phase-2-gaps.md`). Athlete adherence logging and **Weekly Adherence Dashboard** are **completed** in this file.

### Backend commits (workflow slice)

| Commit | Summary |
|--------|---------|
| `f94d39b` | `fix(nutrition): reject unapplied revision requests` |
| `ddae1f7` | `test(workflow): align release fixtures with generation ownership` |
| `f67d77d` | `fix: require locked planning context for downstream generation` |

### Frontend commits (workflow slice)

| Commit | Summary |
|--------|---------|
| `0dab1ff` | `fix(coach): enable downstream generation after locked context` |
| `bda4d29` | `fix(coach): stabilize planning workflow gating` |

### Backend test results (verified)

| Suite / file | Result |
|--------------|--------|
| `tests/aiGenerationOrchestrator` | 15 suites passed, 262 tests passed |
| `tests/aiGenerationOrchestrator/orchestrator.api.test.js` | 98 tests passed |
| `tests/trainingPlanManagement/trainingPlanWorkflowRelease.api.test.js` | 60 tests passed |
| `tests/trainingPlanGeneration` | 9 suites passed, 123 tests passed |

### Frontend test / lint notes

| Check | Result |
|-------|--------|
| `src/lib/coachTrainingPlanActions.test.ts` | 45 tests passed |
| Targeted ESLint on touched workflow files | Passed before commit |
| Global lint | Unrelated pre-existing issues remain outside this workflow slice; **do not** treat those as workflow blockers |

### Verified workflow matrix

#### 1. Head Coach no function + Skills / Nutrition / S&C — **PASSED**

- **Academy:** Taylor Golf Academy  
- **Athlete:** athlete501 / Ranjit Sharma  
- **Coaches:** coach501 = Head Coach (no function); coach502 = Skills; coach503 = Nutrition; coach504 = S&C  
- **Result:** Head Coach locked planning context; Skills / Nutrition / S&C generated and submitted; Head Coach approved/released; athlete weekly journal showed all three released; Head Coach → Nutrition revision worked; Nutrition internal revision worked; S&C internal revision worked.

#### 2. Head Coach with Skills + Nutrition / S&C — **PASSED**

- **Academy:** Howard Golf Academy  
- **Athlete:** athlete601 / Sunny Menon  
- **Coaches:** coach601 = Head Coach + Skills (`canGeneratePlan` Yes); coach603 = Nutrition; coach604 = S&C  
- **Result:** Head Coach locked planning context; Head Coach generated/released Skills; Nutrition / S&C submitted; Head Coach released all domains; athlete weekly journal showed all three released.

#### 3. Head Coach with Skills + separate Skills + Nutrition / S&C — **PASSED**

- **Academy:** Howard Golf Academy  
- **Athlete:** athlete604 / Mason McDermott  
- **Coaches:** coach601 = Head Coach + Skills (`canGeneratePlan` No); coach602 = separate Skills Coach (`canGeneratePlan` Yes); coach603 = Nutrition; coach604 = S&C  
- **Result:** coach601 locked planning context and reviewed/released; coach602 generated/released Skills; coach603 generated/released Nutrition; coach604 generated/released S&C; athlete weekly journal showed all three released; user explicitly confirmed Skills plan was released by coach602.

#### 4. No Head Coach + Skills / Nutrition / S&C — **PASSED** (Athlete 701)

- **Academy:** Harding Golf Academy  
- **Athlete:** athlete701 / Sandeep Kumar  
- **Coaches:** coach701 = Skills Coach / planning authority; coach703 = Nutrition; coach704 = S&C  
- **Result:** Skills Coach locked planning context and released Skills; Nutrition / S&C generated after locked context; athlete weekly journal showed all three released.

#### 5. No Head Coach + second Skills Coach path — **PASSED** (Athlete 702)

- **Academy:** Harding Golf Academy  
- **Athlete:** athlete702 / Ritesh Reddy  
- **Coaches:** coach702 = Skills Coach / planning authority; coach703 = Nutrition; coach704 = S&C  
- **Result:** Second Skills Coach path passed; academy-level season/phase data was reused; athlete-specific planning context lock worked; athlete weekly journal showed all three released.

### Conclusion

- Core Head Coach and no-Head-Coach generation/release workflows are **functionally validated**.
- **Stop workflow testing** unless new code changes touch workflow logic.
- **Next planned work:** Open Wearables Integration. Athlete adherence event logging and **Weekly Adherence Dashboard** are **completed** (see sections above).

---

## App Context + Assignment Pipeline Stabilization (COMPLETED)

Documented below: **backend contract** and **frontend behavior** as implemented (see `src/lib/accessContext.ts`, `src/hooks/useAuth.ts`, `src/middleware/authGuard.ts`, `src/app/login/page.tsx`, `src/components/dashboard/admin/AcademyAdminWorkspacePage.tsx`, `src/lib/api/academyAdmin.ts`).

### App-context support (backend)

- **Endpoint:** `GET /me/app-context`
- **Supports:** `ACADEMY_ADMIN`, `COACH`, `ATHLETE` (via `access.dashboardType` and related fields in the bootstrap payload).
- **Role priority:** `ACADEMY_ADMIN` > `COACH` > `ATHLETE` > fallback (backend ordering of effective access).
- **Response shape:** `user`, `activeRole`, `academy`, `invitation`, `access`, `coachSummary`

### App-context usage (frontend reality)

- **`/me/app-context` is not the only source of truth** for routing.
- It is **combined with:**
  - onboarding status (`GET /onboarding/status` via `useOnboarding`)
  - auth guard logic (`resolveAuthGuard` / `useAuthGuard` in `src/middleware/authGuard.ts`)
- **Key fields used** from app-context:
  - `access.canAccessDashboard`
  - `access.reasonCode`
  - `access.dashboardType`
  - `academy.trainingEntityId`

### Routing behavior (actual)

**When READY** (`canAccessDashboard` and `reasonCode === "READY"` per `dashboardPathFromAppContextWhenReady`):

- `ACADEMY_ADMIN` → `/admin/dashboard`
- `COACH` → `/coach/dashboard`
- `ATHLETE` → `/athlete/dashboard`

**When not READY** (representative paths enforced by helpers + guard):

- `INVITATION_ACTION_REQUIRED` **(athlete)** → `/athlete/invitations`
- `MEMBERSHIP_REQUIRED` **(coach; not ACADEMY_ADMIN/ATHLETE for inactive redirect)** → `/membership-inactive`
- `PROFILE_REQUIRED` and other **onboarding resolution** states → `/onboarding`
- `ACADEMY_ADMIN` + `MEMBERSHIP_REQUIRED` → `/onboarding` (not `/membership-inactive`)

**Important:**

- Routing is controlled by **both** app-context **and** onboarding status.
- **`onboardingStatus === COMPLETE`** is required for **general** dashboard access via `resolveAuthGuard` (exceptions exist for e.g. coach invitation inbox routes per `allowCoachInvitationInboxRoute`).

### Onboarding interaction

- App-context drives **early** routing decisions (login, athlete gate, onboarding effects).
- Onboarding status is still required for **final** dashboard access in the guard.
- App-context does **not** fully override onboarding.
- The system uses **combined** decision logic (documented in `authGuard.ts` rule ordering).

### Athlete flow

- **Pending invitation (app-context):** → `/athlete/invitations`
- **No membership / membership resolution (athlete):** → `/onboarding` (via `bootstrapAthleteMembershipResolutionRequired` / onboarding resolution)
- **Dashboard shell:** may **mount** before redirect — `AthleteRouteGate` renders children and redirects in `useEffect` (`src/components/dashboard/athlete/AthleteRouteGate.tsx`).
- **Invitations:** handled under **`/athlete/invitations`** (athlete dashboard route tree), not as the sole long-term destination of standalone onboarding for invite action when app-context is available.

### Coach flow

- **Coach dashboard access** (via `DashboardGate`): requires passing **`useAuthGuard`** / `resolveAuthGuard`, including valid app-context when loaded and **`onboardingStatus === COMPLETE`** unless an allowed exception (e.g. `/coach/invitations` during invite phase).
- **Pending invitation:** `/coach/invitations` may be allowed before `COMPLETE` when `allowCoachInvitationInboxRoute` is true.
- **No membership (coach `MEMBERSHIP_REQUIRED` path):** → `/membership-inactive` (via `bootstrapRedirectsToMembershipInactive`).
- **No profile (`PROFILE_REQUIRED`):** → `/onboarding`

### Admin flow

- **Admin routes** are wrapped with **`DashboardGate`** (`src/app/admin/layout.tsx`).
- **Missing academy setup:** → `/onboarding` (e.g. `ACADEMY_SETUP_REQUIRED` per `shouldRedirectAcademyAdminFromAdminRoutes`).
- **Missing membership (academy admin):** → `/onboarding` (not `/membership-inactive`) via `bootstrapAcademyAdminMembershipSetupRequired` / onboarding resolution.
- **`trainingEntityId`:** required after `COMPLETE` for full admin access checks in `shouldRedirectAcademyAdminFromAdminRoutes` (empty → redirect to `/onboarding`).

### Assignment UI contract

- **Assignment dropdowns** use: **`GET /entities/:entityId/assignment-candidates`** (`fetchEntityAssignmentCandidates` in `src/lib/api/academyAdmin.ts`).
- **Not used for assignment dropdown population:** **`GET /entities/:entityId/members`** (members list is used elsewhere in the admin workspace, not for these dropdowns).
- **IDs:** mapping uses **`coachId`** and **`athleteId`** from the candidates payload as profile identifiers for options (`CoachProfile.id` / `AthleteProfile.id` semantics in the API).

### Stabilization behavior (IMPORTANT)

**TEMPORARY STABILIZATION BEHAVIOR** (lifecycle — not final design):

- **CoachProfile** auto-creation / materialization may occur:
  - during **invitation acceptance** (backend), and
  - during **assignment-candidates** fetch (backend self-heal / stabilization).
- This is **not** documented as final lifecycle design; centralize earlier in a future phase.

---

## Athlete Planning Profile — Athlete + coach (implemented)

**Code references:** `src/app/athlete/profile-planning/page.tsx`, `src/components/dashboard/athlete/AthleteProfilePlanningPageContent.tsx`, `src/lib/api/athletePlanningProfile.ts`, `src/lib/api/athleteMe.ts`, `src/components/dashboard/athlete/AthleteSidebar.tsx`, `src/app/coach/athletes/[athleteId]/planning-profile/page.tsx`, `src/components/dashboard/coach/CoachAthletePlanningProfileView.tsx`, `src/lib/api/coachAthletePlanningProfile.ts`, `src/components/dashboard/coach/CoachDashboardView.tsx`, `src/lib/api/coachMe.ts`, `src/config/endpoints.ts`.

### Athlete (self-service) — **implemented**

- **Route:** `/athlete/profile-planning` with sidebar item **Athlete Profile Planning** (`AthleteSidebar`).
- **Page shape:** Single working page: editable **Planning Profile Form** above a read-only **planning status / summary** (`DashboardCardShell` patterns). No separate report route.
- **Entity scope:** `entityId` = `accessContext.academy.trainingEntityId` from `useAuth` / `GET /me/app-context`.
- **Planning profile API:** `GET`, `POST`, `PATCH` on `paths.entities.athletePlanningProfileMe(entityId)` (`/entities/:entityId/athlete-planning-profile/me`). Helpers in `src/lib/api/athletePlanningProfile.ts`.
- **Bootstrap:** `GET .../me` handled as found / not_found / empty_record; create vs existing mode follows that result.
- **Primary Sport / Validated Level:** `primarySport` is shown as locked when sourced from **`GET /athletes/me`** (`fetchAthleteMeProfile` in `athleteMe.ts`); `validatedLevel` is read-only backend output in APP. The profile-default fetch runs **before** the `entityId` guard so it is not blocked when entity id is missing. Non-fatal **warnings** are shown if defaults fetch fails or `sport` is missing (diagnostic `Alert`s).
- **Create:** `POST .../me` when no profile; on success, local state is re-anchored from the returned record.
- **Update:** **Edit Profile** → editable fields; **Save Changes** sends **`PATCH .../me`** with **only keys whose draft values differ from baseline** (`buildPlanningProfilePatchBody` + `patchPlanningProfileMe`). If nothing changed, the UI shows a no-op success message and **does not** call PATCH (avoids empty body).
- **Date of birth:** UI input/display uses **`dd/mm/yyyy`** (`formatDateOfBirthForUi`); create/PATCH sends ISO datetime (`toIsoFromUiDob`). Summary rows use the same date-only display helper where applicable.
- **Read-only from backend:** e.g. `derivedAge`, `derivedBmi`, `completenessStatus`, `freshnessStatus`, `planningEligibilityStatus`, `stage`, `lastConfirmedAt` — displayed from the record only; **not** client-derived.
- **Endpoints present but not used by athlete UI today:** `paths.entities.athletePlanningProfileReadiness` and `paths.entities.athletePlanningProfileConfirm` are defined in `endpoints.ts` only — **no** readiness GET or confirm POST wiring in `AthleteProfilePlanningPageContent`.

### Coach (planning profile route) — **implemented**

- **Planning profile API (read-only record):** `GET` `paths.entities.athletePlanningProfileByAthlete(entityId, athleteId)` → `/entities/:entityId/athletes/:athleteId/planning-profile` (`coachAthletePlanningProfile.ts`). The athlete planning profile form is **not** editable by the coach in the UI.
- **Route:** `/coach/athletes/[athleteId]/planning-profile` (`CoachAthletePlanningProfileView`).
- **In-page coach workspace (same route):** season / phase / **domain-filtered** goals, plan window, **Step 6** readiness checklist, **Skills** and **S&C** (and Nutrition when assigned) **Generate … Plan** actions, **execute + persist draft** integration, **latest domain draft** fetch and rendering, **Skills** vs **S&C** revision blocks, and **Revision Summary** when parsed `revision` is present on the latest draft. **User-flow documentation:** `docs/ui/COACH_PLANNING_FLOW.md`, `docs/ui/SNC_UI.md`, `docs/ui/GOALS_UI.md`.
- **Coach dashboard table:** Assigned athletes from `GET /coach/me/assigned-athletes` (`coachMe.ts`). Rows include **`hasPlanningProfile: boolean`** (parsed as `true` only when JSON boolean `true`). **Planning profile** column: **`View`** link only when `hasPlanningProfile === true` **and** `athleteId` is non-empty; otherwise **`Not Available`** (non-interactive text). **No** per-row planning-profile fetch for the table.

### Deferred (not implemented in frontend)

- **Coach write/update** to athlete planning profile record (APP remains athlete-owned for edits).
- **Confirm** and **readiness** flows for the athlete planning profile **on the athlete APP page** (paths exist; athlete UI not wired).

### APP grouped-contract status snapshot (current)

- **Grouped APP refactor:** **COMPLETE** (runtime wired on athlete APP page).
- **PATCH behavior:** remains **changed-fields-only** (partial-safe grouped PATCH; no full overwrite semantics).
- **Read-only in APP:** `validatedLevel`, `planningEligibilityStatus`, `planningInputCompleteness`, `missingRequiredFields`.
- **Wearables (MVP):** locked UI state `Wearable Status: No` (no ingestion flow).
- **Regional cuisine preference:** **IMPLEMENTED** as multi-select `string[]` under `nutritionContext.regionalCuisinePreference`; persisted and rehydrated via backend-backed extension JSON + mirrored row behavior.
- **Stage 1 vs Stage 2:**
  - **Stage 1 active inputs:** athlete/sport/performance/training/health/nutrition groups.
  - **Stage 2 optional inputs:** blood report + body composition sections are visible and non-blocking; not currently enforced for submission readiness.

---

## Academy Admin Module — Historical note

Backend integration (TrainingEntity, invitations, assignments) remains product-dependent. **Frontend dashboard access** is **not** “role-only”: it requires alignment of **`GET /onboarding/status`** and **`GET /me/app-context`** with guards in `src/middleware/authGuard.ts` and `src/lib/academy-admin-dashboard-eligibility.ts`. See the **03-ux** docs for the accurate contract.

### Frontend (verified routes; behavior per guard docs)

- Routes include: `/login`, `/onboarding`, `/admin/dashboard`, `/coach/dashboard`, `/athlete/dashboard`
- Post-login routing uses onboarding + access context (not JWT role alone) per `src/app/login/page.tsx` and guards
- Athlete invite inbox: redirect to `/athlete/invitations` when onboarding status is invite-pending / waiting (see `src/app/onboarding/page.tsx`)
- Coach invite inbox: redirect and guard exceptions per `src/lib/coach-invitation-gate.ts` — **coach invitation list visibility has known gaps** (`docs/srs/phase-2-gaps.md`)

### Integration

- End-to-end verification is **environment-specific**; seed user lists are not asserted here as permanently valid.

## Auth Flow (Frontend)

### Routes

- `/login`
- `/forgot-password`
- `/reset-password?token=...`

### Forgot Password

- **UI**
  - Email input
  - `Send reset link`
- **API**
  - `POST /auth/forgot-password`
  - Body: `{ email }`
- **Behavior**
  - Always shows: `If an account exists, a reset link has been sent`
  - No email existence exposure
- **States**
  - Success
  - Validation error
  - Rate limit
  - Server error

### Reset Password

- **UI**
  - New password
  - Confirm password
- **Token**
  - Read from query param (`?token=...`)
- **API**
  - `POST /auth/reset-password`
  - Body: `{ token, newPassword }`
- **States**
  - Missing token
  - Invalid/expired token
  - Validation error
  - Success
- **Success**
  - Shows confirmation
  - Redirects to `/login`

### Design Constraint

- Reuses existing `AuthLayout`
- No UI redesign; same style as login/register

### Integration Rules

- No auth header required
- Uses existing `apiClient`
- Uses `omitAuth: true`

### Important Notes

- Token is read from URL query param and sent as request payload
- No pre-validation API exists for reset tokens
- Backend does not expose token expiry in frontend contract
- Invalid/expired token states are handled in reset UI
