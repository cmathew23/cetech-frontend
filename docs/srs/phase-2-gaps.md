# Phase 2 — Gaps, Risks, and Verification Tracker (Frontend)

This document lists **known gaps**, **open issues**, and **integration risks** for the CETECH frontend, with emphasis on **academy-admin onboarding**, **access-context gating**, and **admin dashboard** validation. It is intended to stay **honest**: items are **not** marked resolved unless product and QA agree.

---

## 1. Coach invitation visibility (open — under investigation)

**Symptoms (reported):**

- Invitation sent to a **coach** exists in the backend, but the coach UI does **not** list it.
- Coach remains in a **waiting-for-invite** style state despite an outstanding invitation.

**Hypothesis (frontend architecture):** Role-specific invitation listing or status transitions may not align with **`GET /onboarding/status`** / invitation list endpoints for **COACH** vs **ATHLETE**.

**Frontend behavior today:**

- Redirects to **`/coach/invitations`** when `coachInInviteOnboardingPhase` is true (`src/lib/coach-invitation-gate.ts`).
- Guard allows **`/coach/invitations`** during invite phases (`allowCoachInvitationInboxRoute`).

**Status:** **Not closed.** Do not treat coach invitation visibility as fixed in release notes until backend + frontend contract is verified end-to-end.

---

## 2. Athlete invitation path (reference — working)

**Athlete** invitation inbox redirect (`/athlete/invitations`) for `INVITE_PENDING_ACTION` / `WAITING_FOR_INVITE` is **implemented** in `src/app/onboarding/page.tsx`. Listed here as **contrast** to §1, not as guarantee against all backend edge cases.

---

## 3. Admin UI data consistency (verify after API changes)

The following were **tracking items** for Members, Assignments, Coaches, and Athletes admin surfaces:

| Surface | Issue | Mitigation direction (frontend) |
|---------|--------|--------------------------------|
| Members | Member Name column blank or email for admins | Parse nested `user` / `targetUser`; optional `GET /profile/me` enrichment for current user; do not use email as name |
| Members | Filter alignment | Layout grid / full-width notes |
| Assignments | Dropdowns email-only | Roster row + user name resolution before label; `formatAdminPersonLabel` → `Name (email)` |
| Coaches | Partial filter option sets | Full status/role options; function catalog from `GET /academies/me/coach-functions` |
| Athletes | Filter loading / labels | Canonical sport/level ∪ dataset; merge coach roster for filters; shared person labels |

**Root themes:** Inconsistent **person label mapping**, **filter option** construction, and occasional **page-specific** duplication.

**Verification:** Re-test whenever **`GET /entities/:id/members`**, **`GET /academies/:id/athletes`**, **`GET /academies/:id/coaches`**, or assignment roster payloads change shape.

---

## 4. Access-context fetch failure (integration risk)

In **`useAuth` bootstrap** (`src/hooks/useAuth.ts`), if **`GET /me/app-context`** throws, the catch sets **`accessContext` to `null`** and still sets **`accessGateReady`** to true.

**Implication:** Guards use `accessContext?.access` (`canAccessDashboard` / `reasonCode`); a **`null`** context may **not** trigger the same redirects as a populated bootstrap payload. This is a **known integration edge**: dashboard behavior should be validated when `/me/app-context` intermittently fails (network, 5xx).

**Documentation rule:** **`GET /me/app-context`** remains the **intended** source of truth; **`null`** context is a **degraded** state, not a substitute contract.

---

## 5. Onboarding error handling granularity

**Academy setup** (`POST /onboarding/academy-setup`) surfaces failures via **page-level** `Alert` and **`getErrMessage`**. There is **no** dedicated UI branch per **`400`** vs **`409`** in `src/app/onboarding/page.tsx` at time of writing.

**Gap vs ideal UX:** Per-status-code copy (validation vs conflict) may require explicit **`code`** handling from normalized API errors.

---

## 6. Multi-role and routing

Future **multi-role** users require routing that defers to **`accessContext`** and **`activeOnboardingRole`**, not a single JWT role heuristic. See `docs/srs/03-ux/onboarding.md` §7.

---

## 7. References

| Document | Purpose |
|----------|---------|
| `docs/srs/03-ux/onboarding.md` | Academy admin onboarding + invitation-aware rules |
| `docs/srs/03-ux/admin-dashboard.md` | Admin dashboard gating and known UI issues |
| `docs/frontend/FRONTEND_GUARDRAILS.md` | Hooks, guards, API layer rules (`GET /me/app-context`) |

---

## 8. Architecture and lifecycle gaps (post stabilization)

### Routing architecture gap

- App-context and onboarding logic are **split** across `useAuth`, `useOnboarding`, and `resolveAuthGuard`.
- The system does **not** have a **single** routing authority module.
- **Future:** unify routing decision input(s) behind one explicit policy layer (product/eng decision).

### Profile lifecycle gap

- **CoachProfile** creation / materialization can occur in more than one backend path (e.g. invitation acceptance, assignment-candidates stabilization). **Future:** centralize earlier in a single lifecycle step.

### Assignment robustness gap

- Duplicate assignment handling and **idempotency** need hardening (frontend + API contract).

### Dashboard gating gap

- **Athlete** (and similar) route gates may **render** dashboard subtree before **`useEffect`** redirect completes — gating is not fully blocking first paint.

### Admin lifecycle gap

- Admin invitation logic is **hardcoded** (limited / no dedicated **pending** state surface in UI vs full backend lifecycle).

---

## 9. Athlete Planning Profile — remaining / verification

**What exists today (frontend):**

- Athlete **`/athlete/profile-planning`**: create (`POST .../me`), update (`PATCH .../me` with changed-fields-only payload), read-only backend status block; DOB **`dd/mm/yyyy`** in UI, ISO datetime on submit.
- Coach **`/coach/athletes/:athleteId/planning-profile`**: read-only view via **`GET .../entities/:entityId/athletes/:athleteId/planning-profile`**.
- Coach dashboard: **`hasPlanningProfile`** on assigned-athlete rows drives **View** vs **Not Available** (no extra list fetch per row).

**Still deferred or unverified:**

- **`POST .../athlete-planning-profile/me/confirm`** — path in `endpoints.ts`; **not** invoked from athlete UI.
- **`GET .../athlete-planning-profile/me/readiness`** — path in `endpoints.ts`; **not** used by current athlete page.
- **Coach-side write/update** to an athlete’s planning profile — **not** implemented.
- **Training-plan generation / AI** — **not** implemented; planning profile is prerequisite data only from a product standpoint.
- **Coach planning-profile JSON parsing** (`coachAthletePlanningProfile.ts`) tolerates multiple nested shapes; **tighten to the canonical backend contract** when finalized (reduces ambiguity vs “defensive” parsing).

---

## 10. APP deferred enhancements (explicitly deferred)

- **Wearable ingestion (OpenWearables):** deferred. Current APP keeps wearables as MVP locked state (`Wearable Status: No`) with no ingestion pipeline.
- **Nutrition intelligence using cuisine preference:** deferred. `regionalCuisinePreference` persistence exists, but deeper nutrition logic/personalization based on that field is not yet implemented.
- **Blood marker utilization:** deferred. Blood report parameters are captured as optional Stage 2 inputs; downstream scoring/recommendation/enforcement logic is not implemented in current frontend flow.
