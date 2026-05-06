/**
 * Display-only text normalization. Never mutate API payloads, form state, or backend data.
 */

const DISPLAY_UNAVAILABLE = "Unavailable";

const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function titleCaseToken(token: string): string {
  if (token === "") return "";
  if (/^\d+(\.\d+)?$/.test(token)) return token;
  const lower = token.toLowerCase();
  const letterIdx = lower.search(/[a-z]/);
  if (letterIdx === -1) return token;
  return (
    lower.slice(0, letterIdx) +
    lower.charAt(letterIdx).toUpperCase() +
    lower.slice(letterIdx + 1)
  );
}

/**
 * Title case for defined strings only (empty → ""). Underscores → spaces.
 */
export function toTitleCaseInput(value: string): string {
  const raw = String(value);
  if (raw.trim() === "") return "";

  const withSpaces = raw.replace(/_/g, " ");
  const segments = withSpaces.split(/(\s+)/);
  return segments
    .map((segment) =>
      /^\s+$/.test(segment) ? segment : titleCaseToken(segment),
    )
    .join("");
}

/**
 * Human-readable title case for nullable labels. Null/undefined → "Unavailable".
 * Empty string → "".
 */
export function toTitleCase(value: string | null | undefined): string {
  if (value === null || value === undefined) return DISPLAY_UNAVAILABLE;
  return toTitleCaseInput(value);
}

/** Alias for optional semantic clarity at call sites. */
export function formatDisplayText(value: string | null | undefined): string {
  return toTitleCase(value);
}

export function isLikelyEmail(s: string): boolean {
  const t = s.trim();
  if (!t.includes("@")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * Names shown in dashboards (not emails or UUID-like IDs).
 */
export function formatPersonNameForDisplay(name: string): string {
  const t = name.trim();
  if (t === "" || t === "—") return t === "—" ? "—" : "";
  if (isLikelyEmail(t)) return t;
  if (UUID_LIKE.test(t)) return t;
  return toTitleCaseInput(t);
}

/** Status codes, sport, level: empty/null → "—". */
export function formatEnumeratedLabel(value: string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const t = String(value).trim();
  if (t === "") return "—";
  return toTitleCaseInput(t);
}

/** Coach function tokens from API — empty → "None". */
export function formatFunctionTokensForDisplay(functions: string[]): string {
  const cleaned = functions.map((f) => f.trim()).filter((f) => f !== "");
  if (cleaned.length === 0) return "None";
  return cleaned.map((f) => toTitleCaseInput(f)).join(", ");
}

/**
 * Title case when non-empty; otherwise a fixed empty label (e.g. settings read-only rows).
 */
export function formatHumanReadableOrCopy(
  value: string | null | undefined,
  whenEmpty: string,
): string {
  if (value === null || value === undefined) return whenEmpty;
  const t = value.trim();
  if (t === "") return whenEmpty;
  if (/^https?:\/\//i.test(t)) return t;
  return toTitleCaseInput(t);
}
