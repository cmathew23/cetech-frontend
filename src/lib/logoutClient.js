import { API_BASE, paths } from "@/config/endpoints";
import { removeToken } from "@/lib/auth";

/**
 * Shared client logout: optional API call, clear local token, hard-navigate to login.
 * Used by dashboard and onboarding waiting screens.
 */
export async function performClientLogout() {
  if (typeof window === "undefined") return;

  try {
    const res = await fetch(`${API_BASE}${paths.auth.logout}`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      console.warn("Logout API status:", res.status);
    }
  } catch (err) {
    console.error("Logout request failed:", err);
  }

  removeToken();
  window.localStorage.removeItem("athleteInvitationAcceptedMock");
  window.location.href = "/login";
}
