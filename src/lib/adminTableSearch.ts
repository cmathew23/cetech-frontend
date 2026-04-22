/**
 * Client-side admin table search: AND match on whitespace-separated tokens against
 * a combined haystack of field values (case-insensitive). No API calls.
 */
export function adminTableSearchMatches(
  queryRaw: string,
  fieldValues: Array<string | number | null | undefined>,
): boolean {
  const q = queryRaw.trim().toLowerCase();
  if (q === "") return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = fieldValues
    .map((v) => (v == null ? "" : String(v)))
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}
