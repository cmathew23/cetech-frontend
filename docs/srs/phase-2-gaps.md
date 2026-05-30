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
| `docs/srs/IMPLEMENTATION_STATUS.md` | Shipped features including adherence (§ Completed: Session Adherence + Nutrition Adherence) |
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
- Coach **`/coach/athletes/:athleteId/planning-profile`**: read-only **planning profile** via **`GET .../entities/:entityId/athletes/:athleteId/planning-profile`**, plus coach **training plan draft** workspace (execute + persist, latest domain draft, Skills/S&C revision, revision summary when parsed `revision` is present). User-flow documentation: **`docs/ui/COACH_PLANNING_FLOW.md`**, **`docs/ui/SNC_UI.md`**, **`docs/ui/GOALS_UI.md`**.
- Coach dashboard: **`hasPlanningProfile`** on assigned-athlete rows drives **View** vs **Not Available** (no extra list fetch per row).

**Still deferred or unverified:**

- **`POST .../athlete-planning-profile/me/confirm`** — path in `endpoints.ts`; **not** invoked from athlete UI.
- **`GET .../athlete-planning-profile/me/readiness`** — path in `endpoints.ts`; **not** used by current athlete page.
- **Coach-side write/update** to an athlete’s planning profile — **not** implemented.
- **Coach planning-profile JSON parsing** (`coachAthletePlanningProfile.ts`) tolerates multiple nested shapes; **tighten to the canonical backend contract** when finalized (reduces ambiguity vs “defensive” parsing).

---

## 10. APP deferred enhancements (explicitly deferred)

- **Wearable ingestion (OpenWearables):** deferred. Current APP keeps wearables as MVP locked state (`Wearable Status: No`) with no ingestion pipeline.
- **Nutrition intelligence using cuisine preference:** deferred. `regionalCuisinePreference` persistence exists, but deeper nutrition logic/personalization based on that field is not yet implemented.
- **Blood marker utilization:** deferred. Blood report parameters are captured as optional Stage 2 inputs; downstream scoring/recommendation/enforcement logic is not implemented in current frontend flow.

---

## 11. Centralized workflow action state gap

**Current problem:**

- Frontend workflow decision logic remains **scattered** across:
  - `src/components/dashboard/coach/CoachAthletePlanningProfileView.tsx`
  - `src/components/dashboard/coach/CoachTrainingPlansPageContent.tsx`
  - `src/lib/coachTrainingPlanActions.ts`
  - `src/lib/api/coachAthletePlanningReadiness.ts`

**Future improvement:**

- Backend should expose **domain-specific action state**, for example:

```json
{
  "domain": "NUTRITION",
  "canCreate": true,
  "canSubmit": false,
  "canApprove": false,
  "canRelease": false,
  "disabledReason": null,
  "buttonLabel": "Create Nutrition Plan",
  "planningContextLocked": true,
  "lockedContextSummary": { }
}
```

- Frontend should **render backend action state** instead of recalculating workflow policy in multiple places.

---

## 12. Nutrition catalog data quality gap

The Nutrition revision system worked **functionally**, but one Rice catalog item had **suspicious macros**:

| Field | Value |
|-------|--------|
| Label | Rice, 1 bowl |
| Calories | 148 kcal |
| Protein | 2.9 g |
| Carbs | 4.6 g |
| Fat | 13.1 g |

**Future task:** Review **NutritionCatalogItem** ID `8533d846-25c7-48a4-a7c1-5fc450a5e80a`.

**Check:** label, serving, calories, protein, carbs, fat, source dataset.

---

## 13. Session Adherence + Nutrition Adherence + Adherence State Hardening (COMPLETED)

**Status:** **Closed.** Merged backend **#46** (`feature/nutrition-adherence`) and frontend **#10** (`feature/nutrition-adherence-ui`). Do **not** track the items below as active gaps.

**Completed (removed from active gaps):**

- Skills/S&C session adherence history (`AthleteSessionAdherenceEvent`).
- Nutrition adherence DB history (`AthleteSessionAdherenceEvent` + `AthleteNutritionItemAdherence`).
- Nutrition item-level adherence persistence (planned-vs-consumed nutrient snapshots).
- Nutrition adherence POST support (session event + item rows; `occurredAt` required).
- Nutrition adherence GET `items[]` support.
- Nutrition adherence UI in athlete weekly journal (`NutritionSessionAdherencePanel`).
- Submit / Update log state hardening (post-save label; history must not block past/current submit).
- Future-day adherence backend guard (`TrainingDay.date`; SKILL / STRENGTH_CONDITIONING / NUTRITION writes blocked).
- Future-day frontend disable state (plans visible; submit disabled).
- Selected-day weekly journal layout restored.

**Validation reference:** Backend `sessionAdherenceHistory` suite (23 tests); frontend `athleteSessionAdherence.test.ts` (14 tests); manual QA athlete501.

---

## 14. Adherence metrics and analytics

**Weekly Adherence Dashboard:** **Completed** (see `docs/srs/IMPLEMENTATION_STATUS.md` — *Weekly Adherence Dashboard (Completed)*). Athlete and coach weekly adherence overview cards, domain KPI percentages, and weekly adherence context provider are implemented.

**Remaining future gaps:**

- Nutrition nutrient drilldown dashboard.
- Nutrition catalog QA / unit normalization (see note below).
- Wearables integration.
- Daily/weekly adherence trend charts.
- AI adherence feedback (later).
- Meal replacement / custom food logging (later).

**Catalog QA note (not adherence logic):** Some nutrition catalog values may need QA/unit normalization — e.g. unusually high sodium values on specific items. This is **catalog data quality**, not a defect in adherence POST/GET or journal UI. Example tracked item: Rice catalog entry in §12.

---

## Open Wearables Integration

Planned after adherence stabilization.

### Objectives

- Import wearable metrics into CETECH.
- Use Open Wearables as normalization layer.
- Avoid direct vendor-specific integrations inside planning engine.

### Initial Sources

- Garmin
- Suunto
- Oura
- Polar
- Coros
- Apple Health
- Google Health Connect

### Phase 2 Capabilities

- Sleep metrics
- Recovery metrics
- HRV
- Resting heart rate
- Training load metrics
- Energy expenditure
- Activity sessions
- Daily readiness indicators

### Future AI Usage

Wearable data may be consumed by:

- Athlete Planning Profile
- Workload Assessment
- Sports Intelligence
- Future Metrics Dashboard
- Future Readiness Engine

**No wearable data currently influences plan generation.**

---

## 15. DB history / versioning gap (parallel / supporting)

**Priority:** Required **before** coach/metrics **dashboards** and **longitudinal analytics** that compare non-adherence state over time.

**Clarification:** Athlete **adherence event logging** (§13) is **done**. **Weekly adherence metrics dashboards** (§14) are the next product slice. This audit targets **other** tables that may still overwrite state needed for broader past-vs-current comparison.

**Problem:**

- Several current tables may **overwrite** state outside the adherence-event tables.
- Future dashboard / metrics work still requires **past-vs-current** comparison on planning profile, workload, assignments, etc.

**Audit scope (initial):**

- `AthletePlanningProfile` / `AthletePlanningProfileHistory`
- `WorkloadAssessment` / `TrainingPlanWorkloadAssessment`
- Planning context lock snapshots
- Goals / seasons / season phases
- `AthleteCoachAssignment`
- `TrainingPlan` / `TrainingPlanVersion`
- Metrics / performance tables (if present)
- **Adherence tables (verify append-only semantics, do not re-build logging):** `AthleteSessionAdherenceEvent`, `AthleteNutritionItemAdherence`

**Process:** Inspect/report only first — **no migration** until audit is reviewed. See `docs/srs/DB_SAFETY_RULES.md`.

---

## 16. Revision hardening gap

**Current:**

- Nutrition add-item / date revision integrity is now guarded (backend `f94d39b`; frontend submit/version alignment).

**Future hardening:**

- Broader deterministic revision intent matching
- Per-day revision UI
- Case-insensitive / simple-punctuation item matching across domains
- Avoid fake revision success messages when backend did not apply changes
