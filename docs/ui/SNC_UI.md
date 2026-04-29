# Strength & conditioning (S&C) plan UI (current)

This document describes **S&C-specific UI behavior** on the coach athlete planning workspace. It applies to the same route as Skills generation: **`/coach/athletes/[athleteId]/planning-profile`** (`CoachAthletePlanningProfileView`).

---

## 1. Generation

### Generate button

- When the coach’s derived generation domains include **S_AND_C**, a **Generate S&C Plan** button appears alongside **Generate Skills Plan** (if Skills is also allowed).
- The button uses the same **Step 6 - Ready to Generate** gate as Skills (APP complete, level validation confirmed, workload assessment complete, season + phase + plan window + selected goals).

### Loading states

- While the two-step **execute → persist** flow runs, the button area shows **Generating plan…** then **Saving draft…** (shared with Skills).

### Plan window (S&C-specific)

- **Duration** selector is **disabled** when the coach’s current generation domain is **S&C**; the effective window is **7 days** (start date + 6 days).

### Response rendering

- After success, a green **Alert** shows persist result fields (training plan id, version id, version number, status, days/sessions/items counts).
- The UI refreshes the **latest S&C draft** via `GET …/domain-drafts/latest?generationDomain=S_AND_C`.

### How the plan is displayed

- Title: **Latest Generated S&C Draft**.
- Metadata: training plan id, version id, version number, status, source, duration, creation counts (when present).
- **Revision Summary** (if parsed draft has revision content): see §3.
- **Structure:** nested **Day** blocks → **Session** blocks → **Item** blocks with detail rows (label, sets, duration, reps, intensity, notes, etc.).
- **Note:** the **Summary** field on line items is shown only for **Skills** drafts, not for S&C (conditional in the same component).

---

## 2. Revision flow

### When the revise block appears

- **Revise S&C Plan** is shown only when the **latest displayed draft domain** is **S_AND_C** (same draft card as the latest draft fetch).

### Input

- **Coach Feedback** textarea (required non-empty to submit).

### API call

- **`POST /entities/{entityId}/athletes/{athleteId}/training-plan-generation/sandc/revise`**
- Request body (from UI): `trainingPlanId`, `versionId`, `coachFeedback` (via `reviseCoachAthleteSandCTrainingPlan` in `src/lib/api/coachAthletePlanningReadiness.ts`; path in `src/config/endpoints.ts`).

### Success handling

- Clears the feedback field.
- Shows success **Alert**: revised S&C plan version generated.
- Refetches latest **S_AND_C** draft (with short retry behavior on 404).

### Failure handling

- Logs full error to the console (`console.error`).
- **Alert** text: `Revision failed: <message>` or `Revision failed: <message> (<errorCode>)` using normalized error fields when present.

---

## 3. Revision summary UI (shared with Skills)

The **same** revision summary block is used for both **Skills** and **S&C** latest drafts.

### Display

When there is revision content to show:

1. **Revision Summary** (heading)
2. **Coach Feedback:** body text from the parsed draft
3. **Changes Applied:** bulleted list

### Data source (frontend)

- The UI **does not compute** summary text or diffs.
- It renders what arrives on the **latest domain draft** response after parsing:
  - **`draft.revision.feedback`** (string; may be sourced from backend `revision.feedback` or `revision.coachFeedback` during parse — both map into this single display field)
  - **`draft.revision.changeSummary`** (string array)

If **`revision` is missing or empty** after parsing, the summary block is not shown. In **development**, the raw adapted latest-draft payload is logged from `fetchLatestCoachAthleteDomainDraft` as **`[latest-domain-draft raw]`** in the browser console to verify backend fields.

---

## 4. References

- Shared coach flow: `docs/ui/COACH_PLANNING_FLOW.md`
- Goal domain filtering: `docs/ui/GOALS_UI.md`
- Endpoint list: `src/config/endpoints.ts`
- Client helpers: `src/lib/api/coachAthletePlanningReadiness.ts`
