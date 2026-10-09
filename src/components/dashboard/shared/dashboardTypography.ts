/** Major dashboard card section titles (athlete + coach). */
export const DASHBOARD_CARD_TITLE_CLASS =
  "!text-[15px] !font-medium leading-snug text-textPrimary";

/** Planning / APP workflow card section titles. */
export const DASHBOARD_PLANNING_CARD_TITLE_CLASS =
  "!text-[17px] !font-normal leading-snug text-textPrimary";

/** Planning form field labels / in-card header rows. */
export const DASHBOARD_PLANNING_FIELD_LABEL_CLASS =
  "!text-[15px] !font-normal text-textPrimary";

/** Nested planning group labels (e.g. Allergies / Intolerances). */
export const DASHBOARD_PLANNING_GROUP_HEADER_CLASS =
  "text-sm font-normal tracking-wide text-textSecondary";

/** Page section labels (Summary, Details, Workspaces). */
export const DASHBOARD_SECTION_HEADING_CLASS =
  "text-sm font-normal tracking-wide text-textSecondary";

/** Detail row / metadata labels inside cards. */
export const DASHBOARD_DETAIL_LABEL_CLASS =
  "text-sm font-normal text-textMuted";

/** Emphasis body text in dashboard cards (workspace links, KPI values). */
export const DASHBOARD_BODY_EMPHASIS_CLASS = "font-normal text-textPrimary";

/** Athlete + coach button label weight (overrides design-system semibold). */
export const DASHBOARD_BUTTON_TEXT_CLASS = "!font-normal";

/** Inner dashboard metric tile (Exercise Performance visual reference). */
export const DASHBOARD_METRIC_TILE_CLASS =
  "flex min-h-[11rem] flex-col rounded-md border border-border bg-card p-4";

export const DASHBOARD_METRIC_TITLE_CLASS =
  "text-sm font-medium leading-snug text-textPrimary";

export const DASHBOARD_METRIC_VALUE_CLASS =
  "mt-4 text-3xl font-bold leading-none tracking-tight text-textPrimary tabular-nums sm:text-4xl";

export const DASHBOARD_METRIC_STATUS_CLASS =
  "mt-2 text-[11px] font-semibold uppercase tracking-wide text-textSecondary";

export const DASHBOARD_METRIC_SUPPORTING_CLASS =
  "mt-auto space-y-1 pt-4 text-xs leading-snug text-textSecondary";

export function dashboardMetricGridClass(count: number): string {
  if (count <= 1) return "grid grid-cols-1 gap-3";
  return "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3";
}
