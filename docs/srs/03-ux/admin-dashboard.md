# Admin Dashboard — Frontend Source of Truth

This document describes **implemented** behavior for **academy admin** routes under **`/admin/*`** in this repository. It must stay aligned with **`GET /me/app-context`** and **`GET /onboarding/status`** contracts.

---

## 1. Route surface

| Route | Layout / gate | Purpose |
|-------|-----------------|---------|
| `/admin/dashboard` | `src/app/admin/layout.tsx` → `DashboardGate` + `DashboardLayout` + `AdminSidebar` | Primary admin overview |
| `/admin/about-academy`, `/admin/members`, `/admin/invitations`, `/admin/assignments`, `/admin/coaches`, `/admin/athletes`, `/admin/profile-settings` | Same admin layout | Workspace sections (see `src/config/adminNav.ts`, `AcademyAdminWorkspacePage` for embedded sections) |

All **`/admin/*`** pages are **client** components behind **`DashboardGate`**, which uses **`useAuthGuard`** (`src/components/layout/DashboardGate.tsx`, `src/middleware/authGuard.ts`).

---

## 2. Access and onboarding gating (not role-only)

**JWT role `ACADEMY_ADMIN` alone does not grant `/admin/*` access.**

The guard chain requires:

1. Valid session (`useAuth`: `isAuthenticated`, `accessGateReady`)
2. Bootstrap `access.canAccessDashboard` / `dashboardType` / `reasonCode` (see `src/lib/accessContext.ts`: `bootstrapRedirectsToMembershipInactive`, `bootstrapRequiresOnboardingResolution`, `dashboardPathFromAppContextWhenReady`)
3. **`shouldRedirectAcademyAdminFromAdminRoutes`** (`src/lib/academy-admin-dashboard-eligibility.ts`):

   - Redirects to **`/onboarding`** when:
     - `onboardingStatus === "ACADEMY_SETUP_REQUIRED"` (academy admin), or
     - After `COMPLETE`, `!access.canAccessDashboard` with `reasonCode === "PROFILE_REQUIRED"`, or
     - After `COMPLETE`, `academy.trainingEntityId` is missing / empty

4. Onboarding status **`COMPLETE`** for general dashboard access (with coach invitation inbox exception for coach routes — not admin)

**Single source of truth:** Dashboard eligibility is driven by **`accessContext`** + **onboarding status**, not by inferring readiness from role strings alone. See `docs/srs/03-ux/onboarding.md` §3.

---

## 3. Data loading patterns (admin workspace)

Admin workspace sections load entity-scoped data via **`fetchMyAcademy`** (`GET /academies/me`) for `entityId` / academy context, then entity APIs (members, assignments, roster) as implemented in `src/lib/api/academyAdmin.ts` and related modules. **No client-generated academy** replaces server data.

---

## 4. Deprecated assumptions (do not reintroduce)

| Removed / invalid | Replacement |
|-------------------|-------------|
| Auto dashboard for new academy admin without setup | `ACADEMY_SETUP_REQUIRED` → `/onboarding` + `POST /onboarding/academy-setup` |
| Labels like `"<user> Academy"` as stand-in for real academy | Server-created academy from setup + subsequent GETs |
| Using role alone to skip onboarding | `useAuthGuard` + `shouldRedirectAcademyAdminFromAdminRoutes` |

---

## 5. Known frontend issues (admin UI — track & verify)

The following were **reported** during admin UI hardening; some items have **frontend fixes** in `src/lib/api/academyAdmin.ts`, `src/lib/adminPersonLabel.ts`, and admin pages — **QA must confirm** against live API payloads.

| Area | Symptom | Notes |
|------|---------|--------|
| **Members** | Entity admin **Member Name** sometimes showed email or blank | Addressed by expanded user/row name parsing, `/profile/me` enrichment for current user, and **no email-as-name** in the name column (`AcademyAdminWorkspacePage`, `academyAdmin.ts`) |
| **Members** | Role / status filters layout | Addressed with responsive grid + helper text placement |
| **Assignments** | Athlete/coach `<select>` options showed **email only** | Addressed by roster option name resolution + `formatAdminPersonLabel` as `Name (email)` |
| **Coaches admin** | Status / function filters incomplete | Addressed by always showing catalog-backed options where implemented |
| **Athletes admin** | Status / sport / level / coach / athlete filters inconsistent | Addressed by canonical ∪ dataset options and merged coach roster where implemented |

**Root causes (architecture):** Inconsistent **person label** extraction across DTO shapes; **filter options** sometimes derived only from current dataset instead of full enums/catalog; duplicated page logic — **shared helpers** are preferred (`adminPersonLabel`, roster parsers in `academyAdmin.ts`).

---

## 6. Multi-role note

Future **context switching** or multi-role users must rely on **`accessContext`** and **onboarding status**, not on a single static role → route map in isolation. Admin routes already compose JWT roles with server onboarding and access payloads.

---

## 7. Failure UX (admin)

- Guard shows **Loading…** until auth + access gate resolve — avoids dashboard content flash (`DashboardGate`).
- API errors on admin pages use normalized errors from **`apiClient`** and page-level **Alert** components where implemented.

---

## 8. Rationale

Strict **access-context** and **onboarding** alignment prevents **fake** academy context, **early** dashboard entry, and **invalid** assumptions about memberships. The admin dashboard is a **consumer** of server state, not a generator of it.

---

## 9. Related files

| Topic | Location |
|-------|----------|
| Admin layout + gate | `src/app/admin/layout.tsx`, `src/components/layout/DashboardGate.tsx` |
| Guard logic | `src/middleware/authGuard.ts` |
| Academy admin redirect rules | `src/lib/academy-admin-dashboard-eligibility.ts` |
| Admin workspace UI | `src/components/dashboard/admin/AcademyAdminWorkspacePage.tsx` |
| Admin nav | `src/config/adminNav.ts` |
