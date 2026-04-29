# SRS Notes

**Repository setup, dev server, E2E tests, sandbox, and testing notes:** see the root [`README.md`](../../README.md).

**Coach planning workspace UI (user flows only):** [`docs/ui/COACH_PLANNING_FLOW.md`](../ui/COACH_PLANNING_FLOW.md), [`docs/ui/SNC_UI.md`](../ui/SNC_UI.md), [`docs/ui/GOALS_UI.md`](../ui/GOALS_UI.md).

Latest milestone: App Context + Assignment Pipeline Stabilization completed and documented. **Athlete Planning Profile** (athlete working page at `/athlete/profile-planning`, coach read-only planning profile view, coach dashboard `hasPlanningProfile` column) is implemented — see **`docs/srs/IMPLEMENTATION_STATUS.md`** (section *Athlete Planning Profile — Athlete + coach*).

## Academy admin, onboarding, and gaps (source of truth)

- **`docs/srs/IMPLEMENTATION_STATUS.md`** — System state including athlete + coach **Athlete Planning Profile** routes, APIs, coach **training plan draft** UI on planning profile, and deferred items (confirm/readiness UI on athlete APP)
- **`docs/srs/03-ux/onboarding.md`** — Academy admin onboarding flow, access-context routing rules, invitation-aware behavior, deprecated shortcuts, failure UX, multi-role note  
- **`docs/srs/03-ux/admin-dashboard.md`** — Admin dashboard gating, admin route behavior, known admin UI issues  
- **`docs/srs/phase-2-gaps.md`** — Open issues (e.g. coach invitation visibility), access-context `null` risk, verification notes; **§9** Athlete Planning Profile remainder  

Legacy one-line routing notes in older files are superseded by these documents.

---

## APP (Athlete Profile Planning) - Current State

- **Contract shape:** frontend is aligned to grouped APP contract (`athleteContext`, `sportContext`, `sportPerformance`, `trainingExposure`, `healthStatus`, `nutritionContext`, `wearables`, `derivedPlanningInputs`, `bloodReportParameters`, `bodyCompositionParameters`).
- **Editable vs read-only:**
  - Editable: Stage 1 input groups (athlete/sport/performance/training/health/nutrition) plus optional Stage 2 groups.
  - Read-only: `validatedLevel` and derived status fields (`planningEligibilityStatus`, `planningInputCompleteness`, `missingRequiredFields`).
  - Wearables (MVP): fixed UI state `Wearable Status: No`.
- **Save behavior:** grouped create/PATCH is wired; PATCH remains changed-fields-only (partial-safe, no full record overwrite).
- **Stage summary:**
  - Stage 1 = active input capture used by current APP workflow.
  - Stage 2 = Blood + Body Composition shown as optional/non-blocking inputs (present, not enforced).
- **Nutrition note:** `regionalCuisinePreference` is implemented as multi-select `string[]`, persisted and rehydrated from backend.

---

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

- Must reuse existing `AuthLayout`
- No UI redesign; same style as login/register

### Integration Rules

- No auth header required
- Use existing `apiClient`
- Use `omitAuth: true`

### Important Notes

- Token comes from URL query param, not local client storage
- No pre-validation API exists for reset token
- Backend does not expose token expiry
- Invalid/expired token handling is performed by reset flow states
