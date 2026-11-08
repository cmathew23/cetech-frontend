/**
 * PeakFlow Movement Intelligence backend.
 * Not the CETECH API. Override with NEXT_PUBLIC_PMI_API_BASE_URL (no trailing slash).
 * When unset, PeakFlow Swing uses the deployed Railway PMI service.
 */
const DEPLOYED_PMI_API_BASE = "https://pmi-production-0234.up.railway.app";

function readPmiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PMI_API_BASE_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim().replace(/\/+$/, "");
  }
  return DEPLOYED_PMI_API_BASE;
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
