# Goals UI on coach athlete planning workspace (current)

This document describes how **goals** appear and how **domain** affects what the coach sees when preparing to generate **Skills** or **S&C** plans.

**Component:** `src/components/dashboard/coach/CoachAthletePlanningProfileView.tsx`  
**Goal row UI:** `src/components/goals/GoalDisplayBlock.tsx`  
**Goal APIs:** `src/lib/api/coachAthleteGoalsSeasonSetup.ts`

---

## 1. Coach “current generation domain”

- The coach’s allowed generation domains are derived from **coach functions** (academy roster functions preferred over dashboard functions when both define domains).
- Domains are ordered **Skills → Nutrition → S&C**; the **first** domain in that order that the coach has becomes **`currentCoachGenerationDomain`** for labels and goal filtering.

---

## 2. Goal filtering by domain

- Active goals for the selected season are filtered to **`domainVisibleActiveGoals`**: only goals whose **`goal.domain`** equals **`currentCoachGenerationDomain`**.
- Goals without a domain in the payload are treated as **Skills** (`goal.domain ?? "SKILLS"`).
- **Effect:** When the coach is in **Skills** mode, only Skills-domain goals appear in the “current phase” checklist. In **S&C** mode, only S&C-domain goals appear. This prevents **cross-domain leakage** in the generation selection.

---

## 3. Phase-aware goals

- The UI determines the **detected current phase** from the selected season’s phase date ranges.
- **Current Phase … Goals** (title text depends on domain: Skills vs S&C vs Nutrition) lists only goals that match:
  - selected season,
  - **ACTIVE**,
  - current coach generation domain,
  - current phase association (implementation uses `goalMatchesCurrentPhase`).

---

## 4. Selection for plan generation

- Goals are shown with a **checkbox** control in `GoalDisplayBlock`.
- **Selected Goal IDs** reads out which goals will be passed as `goalIds` in the **persist draft** payload after generation.

---

## 5. Creating goals

- The coach can create **current phase** goals from the form in the same card (name, priority, success criteria, optional numeric target, target date).
- Creating a goal uses the goals API helpers; creation path is disabled when season, phase id, or coach user id is missing (UI disables the button).

---

## 6. Display-only domain badge

- `GoalDisplayBlock` can show a domain label when `showDomain` is true; on this page it is typically used with **`domain={goal.domain}`** so the coach can see which domain a goal belongs to.

---

## 7. Competition goals

- A separate **Competition goals** subsection lists competition-type goals for the season (display-focused; not the same checklist as current-phase generation goals).
