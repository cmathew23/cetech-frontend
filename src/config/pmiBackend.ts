/**
 * PeakFlow Movement Intelligence backend.
 * Not the CETECH API. Override with NEXT_PUBLIC_PMI_API_BASE_URL (no trailing slash).
 */

function readPmiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PMI_API_BASE_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim().replace(/\/+$/, "");
  }
  return "http://localhost:8000";
}

export const PMI_API_BASE = readPmiBaseUrl();

export function pmiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${PMI_API_BASE}${suffix}`;
}

export function resolvePmiUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return pmiUrl(path);
}
