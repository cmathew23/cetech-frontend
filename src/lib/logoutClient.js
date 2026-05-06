import { API_BASE, paths } from "@/config/endpoints";
import { removeToken } from "@/lib/auth";

export const AUTH_STATE_CHANGE_EVENT = "peakflow:auth-state-changed";

let _loggingOut = false;

/** Synchronous flag — readable in the same render cycle it was set. */
export function isLoggingOut() {
  return _loggingOut;
}

export function markLoggingOut() {
  _loggingOut = true;
}

const LOGOUT_LOCAL_STORAGE_KEYS = [
  "token",
  "refreshToken",
  "user",
  "userProfile",
  "roles",
  "appContext",
  "accessContext",
  "auth",
  "authState",
  "athleteInvitationAcceptedMock",
  "returnUrl",
  "lastPath",
  "redirectTo",
];
const LOGOUT_SESSION_STORAGE_KEYS = [
  "token",
  "refreshToken",
  "user",
  "userProfile",
  "roles",
  "appContext",
  "accessContext",
  "auth",
  "authState",
  "returnUrl",
  "lastPath",
  "redirectTo",
  "peakflow-athlete-onboarding-hard-exit",
  "peakflow-coach-onboarding-hard-exit",
];

function clearAppScopedStorage(storage, explicitKeys) {
  const keysToRemove = new Set(explicitKeys);
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) continue;
    if (key.startsWith("peakflow-")) {
      keysToRemove.add(key);
    }
  }
  for (const key of keysToRemove) {
    storage.removeItem(key);
  }
}

function notifyAuthStateChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

export function clearClientLogoutState() {
  if (typeof window === "undefined") return;
  removeToken();
  clearAppScopedStorage(window.localStorage, LOGOUT_LOCAL_STORAGE_KEYS);
  clearAppScopedStorage(window.sessionStorage, LOGOUT_SESSION_STORAGE_KEYS);
  notifyAuthStateChanged();
}

/**
 * Best-effort backend logout request. Client state cleanup and navigation are handled separately.
 */
export async function requestClientLogout() {
  let timeout = null;
  try {
    const controller = new AbortController();
    timeout = window.setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE}${paths.auth.logout}`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn("Logout API status:", res.status);
    }
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    if (timeout !== null) window.clearTimeout(timeout);
  }
}
