/**
 * Display-only date/time helpers (DD/MM/YYYY product standard).
 * Parses API strings without mutating stored values.
 * Date-only `YYYY-MM-DD` is interpreted as a local calendar date (not UTC midnight).
 * Strings with time / Z are parsed as instants and formatted in the browser/local timezone.
 */

export const DATE_DISPLAY_UNAVAILABLE = "Unavailable";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Parse API/user-facing date strings into a Date in local context.
 * - `YYYY-MM-DD` → local calendar date at 00:00 local (avoids UTC off-by-one for plain dates).
 * - ISO-8601 with time / Z → instant via Date.parse.
 */
export function parseToLocalDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const m = DATE_ONLY.exec(trimmed);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== mo - 1 ||
      dt.getDate() !== d
    ) {
      return null;
    }
    return dt;
  }

  const t = Date.parse(trimmed);
  if (Number.isNaN(t)) return null;
  return new Date(t);
}

function toLocalDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  return parseToLocalDate(String(value));
}

/** Core DD/MM/YYYY from a resolved local calendar date. */
function formatDdMmYyyyFromDate(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Any ISO date string or timestamp (including UTC/Zulu): local calendar date as DD/MM/YYYY, no time.
 */
export function formatDateOnly(
  value: string | Date | null | undefined,
  fallback: string = DATE_DISPLAY_UNAVAILABLE,
): string {
  const d = toLocalDate(value);
  if (!d) return fallback;
  return formatDdMmYyyyFromDate(d);
}

/**
 * Example: Thursday, 30/04/2026
 */
export function formatDateWithWeekday(
  value: string | Date | null | undefined,
  fallback: string = DATE_DISPLAY_UNAVAILABLE,
): string {
  const d = toLocalDate(value);
  if (!d) return fallback;
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  return `${weekday}, ${formatDdMmYyyyFromDate(d)}`;
}

/** Audit / event-style timestamps: DD/MM/YYYY, hh:mm AM/PM (local). */
export function formatDateTime(
  value: string | Date | null | undefined,
  fallback: string = DATE_DISPLAY_UNAVAILABLE,
): string {
  const d = toLocalDate(value);
  if (!d) return fallback;
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatDdMmYyyyFromDate(d)}, ${timePart}`;
}

/** DD/MM/YYYY to DD/MM/YYYY */
export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
  fallback: string = DATE_DISPLAY_UNAVAILABLE,
): string {
  return `${formatDateOnly(start, fallback)} to ${formatDateOnly(end, fallback)}`;
}

/** Weekday name from local date (English). */
export function getLocalWeekday(
  value: string | Date | null | undefined,
  fallback: string = DATE_DISPLAY_UNAVAILABLE,
): string {
  const d = toLocalDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}

/**
 * Planning profile readonly fields: DD/MM/YYYY only, never time.
 */
export function formatPlanningProfileDateDisplay(
  value: string | null | undefined,
  emptyFallback: string = DATE_DISPLAY_UNAVAILABLE,
): string {
  if (value === null || value === undefined) {
    return emptyFallback;
  }
  if (String(value).trim() === "") {
    return emptyFallback;
  }
  return formatDateOnly(String(value).trim(), emptyFallback);
}

/** Invitation `createdAt`: DD/MM/YYYY local; raw string if unparseable. */
export function formatInviteDateDisplay(
  createdAt: string,
  emptyMark = "—",
): string {
  const t = createdAt.trim();
  if (t === "") return emptyMark;
  const formatted = formatDateOnly(t);
  return formatted === DATE_DISPLAY_UNAVAILABLE ? t : formatted;
}
