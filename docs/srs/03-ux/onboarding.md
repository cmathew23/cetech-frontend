# Onboarding — Frontend Source of Truth (Academy Admin & Shared)

This document describes **implemented** frontend behavior aligned with the **cetech-backend onboarding + access-context contract**. It does not define backend rules; it records how this repository consumes them.

---

## 1. Canonical API usage (frontend)

| Concern | Endpoint | Client usage |
|--------|----------|----------------|
| Onboarding phase machine | `GET /onboarding/status` | `useOnboarding` → `fetchStatus` / `getOnboardingStatus` (`src/hooks/useOnboarding.ts`, `src/lib/api/onboarding.ts`) |
| Access and membership routing | `GET /me/app-context` | `fetchAccessContext` in `useAuth` bootstrap and `refreshSession` (`src/hooks/useAuth.ts`, `src/lib/accessContext.ts`) |
| Academy creation (ACADEMY_ADMIN) | `POST /onboarding/academy-setup` | `submitAcademySetup` (`src/lib/api/onboarding.ts`), invoked from `AcademyAdminSetupForm` (`src/components/onboarding/AcademyAdminSetupForm.tsx`) via `src/app/onboarding/page.tsx` |

Parsed onboarding payloads use `parseOnboardingPayload` / `ParsedOnboardingStatus` (`src/lib/onboarding-status.ts`).

**Example — app context `data` shape consumed by the client** (after `adaptBackendSuccess` unwrap; see `AccessContextPayload` in `src/lib/accessContext.ts`):

```json
{
  "user": { "userId": "…", "roles": ["ACADEMY_ADMIN"] },
  "activeRole": "ACADEMY_ADMIN",
  "academy": {
    "hasMembership": true,
    "membershipStatus": "ACTIVE",
    "trainingEntityId": "…",
    "trainingEntityName": "…"
  },
  "invitation": { "hasPendingInvitation": false, "pendingInvitationCount": 0 },
  "access": {
    "canAccessDashboard": true,
    "dashboardType": "ACADEMY_ADMIN",
    "reasonCode": "READY"
  },
  "coachSummary": { "assignedAthleteCount": 0 }
}
```

Gating uses **`access.canAccessDashboard`** and **`access.reasonCode`** (not legacy `accessState` / membership arrays).

---

## 2. Academy Admin onboarding flow (frontend truth)

**Preconditions (registration / auth):** User may register or log in with role **`ACADEMY_ADMIN`** (see `RegistrationRole` and registration UI). Authentication uses `useAuth`; JWT roles are **not** sufficient alone for dashboard access (see §3).

**After login, bootstrap always:**

1. `GET /auth/me` (via `fetchMe` in `bootstrapAuth`)
2. `GET /me/app-context` (via `fetchAccessContext`; failures are caught and stored as `accessContext: null` — see §7)

**Onboarding page** (`/onboarding`, `src/app/onboarding/page.tsx`):

1. `useOnboarding` loads **`GET /onboarding/status`** and derives `onboardingStatus` and `onboardingData`.
2. When `onboardingStatus === "ACADEMY_SETUP_REQUIRED"` **and** `activeOnboardingRole === "ACADEMY_ADMIN"`, the UI renders **`AcademyAdminSetupForm`**.
3. **Academy setup fields** (all required in UI; submitted to `POST /onboarding/academy-setup`):

   | Field | Payload key |
   |-------|----------------|
   | Academy name | `name` |
   | Address | `address` |
   | Email | `email` |
   | Phone | `phone` |

4. **Submit handler** (`handleAcademyAdminSetupSubmit`):

   - Calls `submitAcademySetupApi(payload)` with body `{ name, address, email, phone }` (trimmed strings)
   - Calls `fetchStatus()` to refetch onboarding
   - Calls `refreshSession()` so `GET /auth/me` and **`GET /me/app-context`** run again
   - If `bootstrapRedirectsToMembershipInactive(accessContext)` (coach/non-admin membership denial), returns **without** navigating to dashboard
   - Otherwise resolves dashboard path via `dashboardPathForComplete` and `router.replace(path)` (typically `/admin/dashboard` when roles and server `activeOnboardingRole` allow)

5. **Dashboard navigation** for academy admins is **blocked** until onboarding and access context satisfy guards (see §3 and `shouldRedirectAcademyAdminFromAdminRoutes` in `src/lib/academy-admin-dashboard-eligibility.ts`).

**No client-side invented academy:** The form explicitly states the academy is created on the server on submit; there is **no** `"{user} Academy"` or similar generated label in this flow.

---

## 3. Source-of-truth routing rule (access context + onboarding)

**Contract (frontend must follow):**

- **`GET /me/app-context`** provides `user`, `activeRole`, `academy`, `invitation`, `access`, and `coachSummary` (`AccessContextPayload` in `src/lib/accessContext.ts`).
- **Dashboard eligibility** for protected app surfaces is enforced by **`useAuthGuard`** (`src/middleware/authGuard.ts`) together with onboarding completion and, for academy admins, **`shouldRedirectAcademyAdminFromAdminRoutes`**.

**Explicit rules implemented in code:**

- The frontend **must not** treat JWT **`ACADEMY_ADMIN`** alone as proof of dashboard readiness.
- **`resolveAuthGuard`** uses `bootstrapRedirectsToMembershipInactive`, `bootstrapRequiresOnboardingResolution` (driven by **`access.canAccessDashboard`**, **`access.dashboardType`**, **`access.reasonCode`**).
- For **`/admin/*`**, academy admins with incomplete setup or missing entity context are redirected to **`/onboarding`** when `shouldRedirectAcademyAdminFromAdminRoutes` returns true (e.g. `ACADEMY_SETUP_REQUIRED`, onboarding denial from bootstrap, or empty `academy.trainingEntityId` after `COMPLETE`).

**Direct navigation:** Hitting `/admin/dashboard` while onboarding is incomplete or access state requires onboarding triggers **`router.replace("/onboarding")`** from the guard when `redirect` is enabled (default).

**No fake academy context:** Admin dashboard and onboarding UIs do not synthesize academy names from the client; academy data comes from server responses after setup and subsequent fetches.

---

## 4. Invitation-aware onboarding contract

**Server field:** `pendingInvitationCount` on parsed onboarding status (`ParsedOnboardingStatus`, `src/lib/onboarding-status.ts`).

**Athlete (implemented path):** When `activeOnboardingRole === "ATHLETE"` and status is `INVITE_PENDING_ACTION` or `WAITING_FOR_INVITE`, the onboarding page **`router.replace("/athlete/invitations")`** so the user sees the **invitation inbox** instead of a passive-only panel.

**Coach (implemented redirect + known issue):** `coachInInviteOnboardingPhase` (`src/lib/coach-invitation-gate.ts`) returns true when:

- `pendingInvitationCount > 0`, **or**
- status is `INVITE_PENDING_ACTION` / `WAITING_FOR_INVITE`, **or**
- `nextStep === "WAIT_FOR_INVITE"`

When true, onboarding redirects to **`/coach/invitations`**. The guard allows `/coach/invitations` during invite phases via `allowCoachInvitationInboxRoute`.

**Known issue (not fixed in docs):** There are **reported cases** where a coach invitation exists in the backend but **does not appear** in the inbox / user remains in a **waiting-for-invite** style state. This is treated as a **role-specific invitation handling / API visibility mismatch** and remains **under investigation**. **Do not document coach invitation visibility as fully resolved.**

**Passive waiting:** Acceptable only when there are **zero** actionable invitations per server status and the UI honestly reflects that (no substitute for inbox when `pendingInvitationCount > 0`).

---

## 5. Deprecated / removed frontend assumptions

The following are **not** valid for current implementation:

| Deprecated assumption | Current behavior |
|----------------------|----------------|
| Auto-redirect new academy admin straight to `/admin/dashboard` without setup | Blocked until `ACADEMY_SETUP_REQUIRED` is cleared via `POST /onboarding/academy-setup` and status/access context allow navigation |
| Generated academy labels (e.g. `"<user> Academy"`) | Not used in academy setup or dashboard bootstrap for this flow |
| Role alone (`ACADEMY_ADMIN`) as dashboard pass | Guard + `accessContext` + onboarding status required |
| Shortcuts that skip academy setup for new academy admins | `ACADEMY_SETUP_REQUIRED` forces setup UI |

---

## 6. Failure-state and loading UX (implemented)

**Academy setup submit:**

- **Client validation:** Required-field messages are **inline** on `AcademyAdminSetupForm` (`fieldErrors`).
- **Server errors:** Exceptions are surfaced as a **page-level** `Alert` via `actionError` and `getErrMessage(e)` — **not** per-field server validation maps in the current form. Rely on backend **`message`** (and normalized error shape from `apiClient`) for user-visible text.
- **Specific HTTP codes** (`400` BAD_REQUEST vs `409` CONFLICT): the onboarding page does **not** branch into separate UI flows per status code; improvement would be explicit code handling if product requires it.

**App context (`/me/app-context`):**

- **`PROFILE_REQUIRED`** or **`INVITATION_ACTION_REQUIRED`** (with `!canAccessDashboard`) → guard redirects non-onboarding routes to `/onboarding` (with coach invite inbox exception per §4).
- **`MEMBERSHIP_REQUIRED`** (with `!canAccessDashboard`) → redirect to `/membership-inactive` from `useAuth` after bootstrap (and similar checks after login/onboarding actions).

**Dashboard flicker:** `DashboardGate` shows **Loading…** until `useAuthGuard` resolves (`allowed` false while `loading` true). `/onboarding` uses `ProtectedLayout mode="auth-only"` and does not use the full COMPLETE gate.

---

## 7. Multi-role forward compatibility

- Users may hold **multiple** roles over time; JWT `roles` and `activeOnboardingRole` from **`GET /onboarding/status`** can diverge.
- **`dashboardPathForComplete`** prefers server `activeOnboardingRole`, then JWT roles (`src/app/onboarding/page.tsx`).
- Routing and gating should continue to prefer **`accessContext`** + **onboarding status** over static “one role → one URL” heuristics alone.

---

## 8. Rationale (why this model)

The prior pattern of **inferring** dashboard access from role or **fabricating** academy context led to **premature dashboard entry**, **invalid ownership assumptions**, and **broken guard alignment** with the backend. The current model ties UI progression to **`GET /onboarding/status`**, explicit **`POST /onboarding/academy-setup`** for academy admins, and **`GET /me/app-context`** for membership and access state — producing **deterministic** onboarding and **correct** gating when APIs succeed.

---

## 9. Related files (implementation index)

| Area | Files |
|------|--------|
| Onboarding page | `src/app/onboarding/page.tsx` |
| Academy setup form | `src/components/onboarding/AcademyAdminSetupForm.tsx` |
| Onboarding API | `src/lib/api/onboarding.ts` |
| Access context | `src/lib/accessContext.ts`, `src/hooks/useAuth.ts` |
| Admin route gating | `src/lib/academy-admin-dashboard-eligibility.ts`, `src/middleware/authGuard.ts` |
| Coach invite phase | `src/lib/coach-invitation-gate.ts` |
| Login post-auth | `src/app/login/page.tsx` |
