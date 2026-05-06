"use client";

import {
  clearClientLogoutState,
  markLoggingOut,
  requestClientLogout,
} from "@/lib/logoutClient";
import { useCallback } from "react";

/**
 * Single hard-logout path for authenticated UI surfaces.
 *
 * Sequence is critical:
 * 1. Set synchronous logging-out flag (guards read this immediately).
 * 2. Clear all auth/storage state.
 * 3. Fire best-effort backend logout (non-blocking).
 * 4. Hard navigate — destroys entire React tree.
 */
export function useSharedLogout() {
  return useCallback(async () => {
    markLoggingOut();
    clearClientLogoutState();
    void requestClientLogout();
    window.location.replace("/login");
  }, []);
}
