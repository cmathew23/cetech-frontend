# CETECH Frontend Guardrails (MVP Lock)

This document defines the **non-negotiable frontend architecture and flow rules**.
All future development MUST follow this.

---

# 1. CANONICAL FLOWS

## 1.1 Authentication (SOURCE OF TRUTH)

Hook: `src/hooks/useAuth.ts`

Responsibilities:
- login
- register
- logout
- bootstrapAuth (/auth/me)
- exposes:
  - user
  - roles
  - isAuthenticated
  - loading
  - error

Rules:
- NEVER call auth APIs directly in pages
- ALWAYS use `useAuth`
- Token storage handled only via `src/lib/auth.ts`
- Note: logout UI currently uses shared helper `src/lib/logoutClient.js` (see MVP exceptions).

---

## 1.2 Onboarding (BACKEND-DRIVEN)

Hook: `src/hooks/useOnboarding.ts`

Responsibilities:
- fetchStatus
- selectRole
- submitAthleteProfile
- submitCoachProfile
- exposes:
  - onboardingStatus
  - nextStep
  - onboardingData
  - loading
  - error

Rules:
- onboarding flow is 100% backend-driven
- DO NOT invent frontend onboarding states
- ALWAYS use backend:
  - onboardingStatus
  - nextStep

**Academy admin + access context (mandatory reading):**

- Documented in **`docs/srs/03-ux/onboarding.md`** and **`docs/srs/03-ux/admin-dashboard.md`**.
- **`GET /me/app-context`** (via `useAuth` / `fetchAccessContext`) is the **primary** signal for `access.canAccessDashboard`, `access.reasonCode`, `academy.trainingEntityId`, and invitation fields together with **`GET /onboarding/status`**.
- Do **not** infer dashboard readiness from **JWT role alone**; use **`useAuthGuard`** + `shouldRedirectAcademyAdminFromAdminRoutes` for `/admin/*`.

---

## 1.3 Route Protection

Primary guard:
- `src/middleware/authGuard.ts` → `useAuthGuard`

Route wrappers:
- `src/components/layout/DashboardGate.tsx` (canonical for COMPLETE protection)
- `src/components/layout/ProtectedLayout.jsx` (auth-only usage)

Modes:
- `DashboardGate`
  → requires auth + onboarding COMPLETE (via `useRequireCompleteOnboarding` -> `useAuthGuard`)
- `mode="auth-only"`
  → `ProtectedLayout` requires only authentication

Rules:
- Dashboard/app pages MUST use `DashboardGate` (or `useAuthGuard` directly)
- `/onboarding` MUST use `mode="auth-only"`
- NEVER implement custom auth checks in pages

---

# 2. API LAYER RULES

Canonical transport:
- `src/lib/apiClient.ts`

Rules:
- NO direct `fetch` in pages or hooks
- ALL API calls go through:
  - `src/lib/api/*.ts`
- ALL endpoints must come from:
  - `src/config/endpoints.ts`

Error handling:
- MUST use normalized error shape from `apiClient`
- Exception: `src/lib/logoutClient.js` uses direct `fetch` intentionally for MVP logout hard-navigation flow.

---

# 3. TYPE SYSTEM

Location:
- `src/types/*`

Rules:
- Types MUST match backend DTOs
- NO inline types in pages/hooks if reusable
- NO `any` or `unknown` for known contracts

---

# 4. CURRENT INTENTIONAL MVP EXCEPTIONS

These are allowed (DO NOT "fix" unless necessary):

## 4.1 Onboarding Page-Level Actions

Still handled in:
- `src/app/onboarding/page.tsx`

Includes:
- createEntity
- acceptInvitation
- logout

Reason:
- tightly coupled to UI branching
- abstraction not worth complexity yet

---

## 4.2 Hook State Scope

- `useAuth` and `useOnboarding` use local state
- NOT global context yet

Reason:
- sufficient for current app size
- optimization deferred

---

## 4.3 Logout Path Exception

Current behavior:
- Dashboard and onboarding waiting-state logout use:
  - `src/lib/logoutClient.js` (`performClientLogout`)

Reason:
- keeps a single hard-navigation logout path across current screens
- avoids widening refactor scope before MVP validation

---

## 4.4 Training Sandbox Route (Exercise Retrieval Proof)

Route:
- `/sandbox/training`

Current behavior:
- authenticated sandbox route (usable after login)
- calls real backend endpoint:
  - `GET /exercise-catalog` (via API layer + `apiClient`)
- supports category and search-driven fetch
- supports local selected-exercise state:
  - add
  - remove
  - duration edit per selected exercise
- prevents duplicate add by exercise id

Boundary:
- sandbox-only integration proof
- selected exercises are frontend local state only
- no persistence to backend training domain
- not the final production exercise assignment workflow

---

# 5. WHAT NOT TO DO

❌ DO NOT:
- call API directly in pages
- duplicate auth logic
- duplicate onboarding logic
- invent new onboarding states
- bypass `useAuthGuard`
- hardcode API URLs
- introduce new state libraries (Redux/Zustand/etc.) without need
- remove `DashboardGate` from protected app/dashboard pages

---

# 6. SAFE FUTURE IMPROVEMENTS (POST-MVP)

These are allowed later:

- move onboarding entity/invite actions into hook layer
- introduce shared auth/onboarding context
- remove compatibility wrapper (`useRequireCompleteOnboarding`)
- unify layout-level protection fully
- migrate logout flow from `logoutClient` to `useAuth().logout` if behavior parity is confirmed

---

# 7. DEVELOPMENT CHECKLIST (MANDATORY)

Before merging any frontend change:

- [ ] Uses `useAuth` for auth
- [ ] Uses `useOnboarding` for onboarding
- [ ] Uses `useAuthGuard`/`DashboardGate` for COMPLETE-protected routes
- [ ] Uses `ProtectedLayout mode="auth-only"` only for auth-only routes (e.g. `/onboarding`)
- [ ] No direct fetch calls
- [ ] No duplicated logic
- [ ] Types align with backend

---

# 8. FINAL RULE

If unsure:
→ follow existing hook + guard pattern
→ do NOT invent new flow

This system is intentionally minimal and stable.
Do not overengineer.