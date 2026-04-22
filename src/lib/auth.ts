/**
 * Canonical token storage for the browser session.
 * Single source: localStorage key `token` (Bearer value only, no "Bearer " prefix).
 */

const TOKEN_KEY = "token";

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Clear stored credentials (safe to call from any context). */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export const authStorageKey = TOKEN_KEY;
