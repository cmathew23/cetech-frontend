# RESPONSIVE DESIGN RULES — CETECH FRONTEND

Status: MANDATORY ENFORCEMENT  
Scope: ALL frontend pages (coach, athlete, admin, APP)

---

## 1. Core Principle

Responsive design is NOT optional.

Every page MUST:
- work across desktop, tablet, and mobile
- avoid layout breakage
- avoid horizontal overflow (except controlled table scroll)

If a page breaks at any breakpoint → it is NOT complete.

---

## 2. Breakpoints (Standard)

Use Tailwind breakpoints consistently:

- sm → mobile
- md → tablet
- lg → small desktop
- xl → large desktop

Never hardcode custom breakpoints unless approved.

---

## 3. Layout Rules (MANDATORY)

### Page Container

All pages MUST use:

- `mx-auto`
- `max-w-screen-2xl`
- `px-4 sm:px-6 lg:px-8`

Never use full-width uncontrolled layouts.

---

### Main Layout

- Use `min-w-0` to prevent overflow
- Avoid `overflow-x-hidden` hacks
- Content must shrink properly inside flex/grid

---

### Sidebar

- Desktop → fixed/sticky sidebar
- Mobile/tablet → drawer (toggleable)
- Must not cause layout overflow

---

## 4. Grid & Form Rules

### Forms (APP page critical)

Use:


grid grid-cols-1 md:grid-cols-2


Rules:
- Inputs must be `w-full`
- No fixed widths
- Fields stack on mobile
- Sections must not overflow

---

### Checkbox Groups (Cuisine, Allergies)

- Must wrap:
  `flex flex-wrap gap-2`
- Must not overflow horizontally
- “Others” input must stay within layout

---

## 5. Table Rules

Tables MUST:

- Be wrapped in:
  `overflow-x-auto`
- Use:
  `min-w-[Xpx]` ONLY when necessary
- Never break page layout

Horizontal scroll is allowed ONLY inside table container.

---

## 6. Action Bars (Filters / Buttons)

- Must wrap on smaller screens:
  `flex flex-wrap gap-2`
- Never use `flex-nowrap` unless justified
- Buttons must not overflow container

---

## 7. Anti-Patterns (STRICTLY FORBIDDEN)

Do NOT use:

- fixed widths (`w-[500px]`, etc.)
- fixed min-widths that break mobile
- `overflow-x-hidden` to hide bugs
- absolute positioning for layout
- inline styles overriding responsiveness

---

## 8. APP Page Requirements (HIGH PRIORITY)

APP page MUST:

- render all sections responsively
- stack sections vertically on mobile
- ensure no horizontal scroll
- ensure checkbox groups wrap properly
- ensure “Others” input does not break layout

---

## 9. Required Verification (MANDATORY)

Every implementation MUST be tested at:

- 1440px (desktop)
- 1024px (laptop/tablet)
- 768px (tablet)
- 375px (mobile)

For each role:

- Coach
- Athlete
- Admin

Check:

- no layout breakage
- no overlapping elements
- no clipped text
- no unexpected scroll

---

## 10. Completion Criteria

A page is considered COMPLETE only if:

- responsive at all breakpoints
- no overflow issues
- consistent spacing
- usable on mobile

If ANY breakpoint fails → NOT complete.

---

## 11. Enforcement Rule

Before implementing ANY UI change:

Cursor MUST:
1. Read this file
2. Follow all rules
3. Validate responsiveness before marking complete

Failure to follow this = invalid implementation