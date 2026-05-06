import { getToken } from "@/lib/auth";
import type { AccessContextPayload } from "@/lib/accessContext";

function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLen);
    return atob(padded);
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readString(
  source: Record<string, unknown>,
  key: string,
): string {
  const value = source[key];
  if (typeof value !== "string") return "";
  return value.trim();
}

export function getCurrentUserDisplayNameFromToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = getToken();
  if (!token) return null;
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const direct =
    readString(payload, "name") ||
    readString(payload, "displayName") ||
    readString(payload, "fullName") ||
    readString(payload, "preferred_username");
  if (direct !== "") return direct;

  const first =
    readString(payload, "firstName") || readString(payload, "given_name");
  const last =
    readString(payload, "lastName") || readString(payload, "family_name");
  const combined = [first, last].filter((p) => p !== "").join(" ").trim();
  if (combined !== "") return combined;

  const email = readString(payload, "email");
  if (email !== "") return email;

  return null;
}

/**
 * Display name from GET /me/app-context `user` (see `parseUser` in `accessContext.ts`).
 */
export function getDisplayNameFromAccessContextPayload(
  payload: AccessContextPayload | null | undefined,
): string | null {
  if (!payload) return null;
  const user = payload.user;
  const direct =
    user.name?.trim() ||
    user.fullName?.trim() ||
    user.displayName?.trim() ||
    user.email?.trim() ||
    "";
  if (direct !== "") return direct;
  const combined = [user.firstName?.trim(), user.lastName?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim();
  if (combined !== "") return combined;
  return null;
}

export function getCurrentUserDisplayNameFromCachedAccessContext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem("accessContext");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessContextPayload | null;
    return getDisplayNameFromAccessContextPayload(parsed);
  } catch {
    return null;
  }
}
