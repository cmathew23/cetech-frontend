# Implementation Status

## Authoritative UX / academy-admin docs (current)

**Source of truth for academy-admin onboarding, access-context gating, and admin dashboard behavior:**

- `docs/srs/03-ux/onboarding.md` — `GET /onboarding/status`, `GET /me/app-context`, `POST /onboarding/academy-setup`, invitation-aware rules, deprecated shortcuts
- `docs/srs/03-ux/admin-dashboard.md` — `/admin/*` guards, eligibility, known admin UI issues
- `docs/srs/phase-2-gaps.md` — open gaps (including coach invitation visibility), integration risks

The sections below retain **auth password-flow** notes; **dashboard/onboarding** summaries in older revisions are superseded by the documents above.

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

### Coach (read-only) — **implemented**

- **API:** `GET` `paths.entities.athletePlanningProfileByAthlete(entityId, athleteId)` → `/entities/:entityId/athletes/:athleteId/planning-profile` (`coachAthletePlanningProfile.ts`).
- **Route:** `/coach/athletes/[athleteId]/planning-profile` (`CoachAthletePlanningProfileView`) — read-only cards, **no** edit actions.
- **Coach dashboard table:** Assigned athletes from `GET /coach/me/assigned-athletes` (`coachMe.ts`). Rows include **`hasPlanningProfile: boolean`** (parsed as `true` only when JSON boolean `true`). **Planning profile** column: **`View`** link only when `hasPlanningProfile === true` **and** `athleteId` is non-empty; otherwise **`Not Available`** (non-interactive text). **No** per-row planning-profile fetch for the table.

### Deferred (not implemented in frontend)

- **Coach write/update** to athlete planning profile.
- **Training-plan generation / AI** integration (planning profile is input-only for future work).
- **Confirm** and **readiness** flows for the athlete planning profile (paths exist; UI not wired).

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
