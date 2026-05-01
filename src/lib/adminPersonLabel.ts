import { formatPersonNameForDisplay } from "@/lib/textFormat";

/**
 * Shared person label for admin UI (members table, assignments dropdowns, athlete/coach filters).
 *
 * Priority for the visible **name** slot: display/full name → composed first+last (caller-supplied)
 * → email → stable id → em dash.
 *
 * When both a non-empty name and email exist, dropdowns use `Name (email)` so the primary
 * identifier is always the person, with email as secondary context.
 */

/**
 * Name slot for `GET /entities/:entityId/members`-style rows: `displayName`, else
 * `firstName` + `lastName`, else empty (caller falls back to email via {@link formatAdminPersonLabel}).
 */
export function primaryPersonNameFromMemberFields(input: {
  displayName?: string;
  firstName?: string;
  lastName?: string;
}): string {
  const d = (input.displayName ?? "").trim();
  if (d !== "") return d;
  const fn = (input.firstName ?? "").trim();
  const ln = (input.lastName ?? "").trim();
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  if (combined !== "") return combined;
  return "";
}

export function formatAdminPersonLabel(
  displayName: string,
  email: string,
  fallbackId: string,
): string {
  const n = displayName.trim();
  const e = email.trim();
  const f = fallbackId.trim();
  const formattedName = n !== "" ? formatPersonNameForDisplay(n) : "";
  if (formattedName !== "" && e !== "") return `${formattedName} (${e})`;
  if (formattedName !== "") return formattedName;
  if (e !== "") return e;
  if (f !== "") return f;
  return "—";
}
