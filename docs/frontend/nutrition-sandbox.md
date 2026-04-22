# Nutrition Sandbox (Temporary Integration)

## Purpose

This TEMP sandbox exists to validate the nutrition integration path before building the final coach workflow.

Validated scope:
- frontend -> backend -> USDA search flow
- normalized food model usage in UI/state
- serving adjustment and nutrition scaling
- local draft list + totals interaction

This is **NOT** the final nutrition coach feature.

## Current Flow (Validated)

The sandbox currently validates this end-to-end interaction:
- search food
- select food
- fetch normalized nutrition details
- adjust serving
- add to local draft list
- compute totals (macros, fiber, minerals)

## Backend Contract

- Frontend calls CETECH backend only.
- Frontend does **not** call USDA directly.
- Current provider is USDA, exposed via backend endpoint(s).

## Normalized Food Model

Frontend UI operates on a source-agnostic normalized model.

Core fields:
- `source`
- `sourceFoodId`
- `name`
- `baseServing`
- `macros` (calories, protein, carbs, fat)
- `fiber` (optional)
- `minerals` (optional: iron, calcium, sodium, potassium, magnesium)

## Data Rendering Rules

- Render nutrient values only when they exist.
- Do **not** substitute missing nutrients with `0`.
- UI should adapt dynamically to available nutrient data.

## Sandbox Limitations (Important)

- no persistence
- no athlete assignment
- no publish/send workflow
- no nutrition plan structure yet
- no AI-assisted revision yet

## Architectural Decisions (LOCKED)

- UI/state logic is source-agnostic.
- Provider-specific parsing/mapping is isolated in API/data layer.
- Normalized model is the frontend contract.
- Serving scaling and totals logic are generic and provider-independent.
- Future providers (e.g. INDB) must plug into the same normalized contract without UI redesign.

## Future Work (When revisiting)

- backend normalized nutrition DTO
- INDB integration
- persistence layer (nutrition plan, draft entries)
- coach workflow integration
- AI-assisted plan revision (coach-triggered)
