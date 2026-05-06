"use client";

import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth.types";
import { paths } from "@/config/endpoints";
import { clearAthleteOnboardingHardExit } from "@/lib/athleteOnboardingHardExit";
import { clearCoachOnboardingHardExit } from "@/lib/coachOnboardingHardExit";
import {
  fetchAccessContext,
  type AccessContextPayload,
} from "@/lib/accessContext";
import { getToken, removeToken, setToken } from "@/lib/auth";
import {
  AUTH_STATE_CHANGE_EVENT,
  clearClientLogoutState,
  markLoggingOut,
  requestClientLogout,
} from "@/lib/logoutClient";
import { apiRequest } from "@/lib/apiClient";
import {
  isNormalizedApiError,
  type NormalizedApiError,
} from "@/lib/apiClient";
import { useCallback, useEffect, useRef, useState } from "react";

type AuthUser = {
  id: string;
};

type LoginLikePayload = {
  accessToken?: string;
  data?: {
    accessToken?: string;
  };
};

const ACCESS_CONTEXT_STORAGE_KEY = "accessContext";

function persistAccessContext(payload: AccessContextPayload | null) {
  if (typeof window === "undefined") return;
  try {
    if (payload === null) {
      window.sessionStorage.removeItem(ACCESS_CONTEXT_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      ACCESS_CONTEXT_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Best-effort cache only.
  }
}

function toNormalizedError(e: unknown): NormalizedApiError {
  if (isNormalizedApiError(e)) {
    return e;
  }
  return {
    message: e instanceof Error ? e.message : "Authentication error",
    status: 0,
  };
}

function extractTokenFromLoginResponse(body: LoginResponse): string | null {
  const rootToken =
    "accessToken" in body && typeof body.accessToken === "string"
      ? body.accessToken
      : null;
  if (rootToken) return rootToken;

  if (!("data" in body)) return null;
  const data = body.data as LoginLikePayload | undefined;
  if (!data || typeof data !== "object") return null;
  if (typeof data.accessToken === "string" && data.accessToken) {
    return data.accessToken;
  }
  const nested = data.data;
  if (nested && typeof nested === "object") {
    if (typeof nested.accessToken === "string" && nested.accessToken) {
      return nested.accessToken;
    }
  }
  return null;
}

function parseMePayload(payload: MeResponse): { user: AuthUser; roles: string[] } {
  const user = { id: payload.data.userId };
  const roles = Array.isArray(payload.data.roles) ? payload.data.roles : [];
  return { user, roles };
}

export type AuthSessionResult = {
  user: AuthUser;
  roles: string[];
  accessContext: AccessContextPayload | null;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [accessContext, setAccessContext] = useState<AccessContextPayload | null>(
    null,
  );
  /** False until GET /me/app-context completes (or is skipped when logged out). */
  const [accessGateReady, setAccessGateReady] = useState(false);
  const hasBootstrapped = useRef(false);

  const isAuthenticated = user !== null;

  const resetAuthState = useCallback(() => {
    clearAthleteOnboardingHardExit();
    clearCoachOnboardingHardExit();
    setUser(null);
    setRoles([]);
    setAccessContext(null);
    persistAccessContext(null);
  }, []);

  const applyLoggedOutState = useCallback(() => {
    resetAuthState();
    setError(null);
    setAccessGateReady(true);
    setLoading(false);
  }, [resetAuthState]);

  const fetchMe = useCallback(async () => {
    const me = await apiRequest<MeResponse>(paths.auth.me, { method: "GET" });
    const parsed = parseMePayload(me);
    setUser(parsed.user);
    setRoles(parsed.roles);
    return parsed;
  }, []);

  const bootstrapAuth = useCallback(async (): Promise<AuthSessionResult | null> => {
    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      resetAuthState();
      setAccessGateReady(true);
      setLoading(false);
      return null;
    }

    setAccessGateReady(false);
    try {
      const me = await fetchMe();
      let ctx: AccessContextPayload | null = null;
      try {
        ctx = await fetchAccessContext();
      } catch {
        ctx = null;
      }
      setAccessContext(ctx);
      persistAccessContext(ctx);
      setAccessGateReady(true);
      return { ...me, accessContext: ctx };
    } catch (e) {
      removeToken();
      resetAuthState();
      setAccessGateReady(true);
      setError(toNormalizedError(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchMe, resetAuthState]);

  /**
   * Refetch GET /auth/me + GET /me/app-context after backend-side changes (e.g. onboarding completion
   * provisioning memberships) so guards and dashboards see current access / roles.
   */
  const refreshSession = useCallback(async (): Promise<AuthSessionResult | null> => {
    const token = getToken();
    if (!token) {
      setAccessGateReady(true);
      return null;
    }
    setAccessGateReady(false);
    setAccessContext(null);
    setError(null);
    try {
      const me = await fetchMe();
      let ctx: AccessContextPayload | null = null;
      try {
        ctx = await fetchAccessContext();
      } catch {
        ctx = null;
      }
      setAccessContext(ctx);
      persistAccessContext(ctx);
      setAccessGateReady(true);
      return { ...me, accessContext: ctx };
    } catch (e) {
      setError(toNormalizedError(e));
      setAccessGateReady(true);
      return null;
    }
  }, [fetchMe]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthSessionResult> => {
      setLoading(true);
      setError(null);
      setAccessGateReady(false);

      try {
        const loginBody = await apiRequest<LoginResponse>(paths.auth.login, {
          method: "POST",
          body: JSON.stringify(credentials),
          omitAuth: true,
        });

        if ("success" in loginBody && loginBody.success === false) {
          const err: NormalizedApiError = {
            message: loginBody.message || "Login failed",
            status: 401,
            code: loginBody.errorCode || loginBody.code || loginBody.error?.code,
            details: loginBody,
          };
          setError(err);
          throw err;
        }

        const token = extractTokenFromLoginResponse(loginBody);
        if (!token) {
          const err: NormalizedApiError = {
            message: "Login succeeded but no access token was returned",
            status: 500,
            code: "TOKEN_MISSING",
            details: loginBody,
          };
          setError(err);
          throw err;
        }

        setToken(token);
        const me = await fetchMe();
        let ctx: AccessContextPayload | null = null;
        try {
          ctx = await fetchAccessContext();
        } catch {
          ctx = null;
        }
        setAccessContext(ctx);
        persistAccessContext(ctx);
        setAccessGateReady(true);
        return { ...me, accessContext: ctx };
      } catch (e) {
        const normalized = toNormalizedError(e);
        setError(normalized);
        setAccessGateReady(true);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [fetchMe],
  );

  const register = useCallback(async (payload: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      return await apiRequest<RegisterResponse>(paths.auth.register, {
        method: "POST",
        body: JSON.stringify(payload),
        omitAuth: true,
      });
    } catch (e) {
      const normalized = toNormalizedError(e);
      setError(normalized);
      throw normalized;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    markLoggingOut();
    setLoading(true);
    setError(null);
    clearClientLogoutState();
    applyLoggedOutState();
    void requestClientLogout();
    window.location.replace("/login");
  }, [applyLoggedOutState]);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }
    hasBootstrapped.current = true;

    void bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAuthState = () => {
      if (!getToken()) {
        applyLoggedOutState();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncAuthState();
      }
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("pageshow", syncAuthState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("pageshow", syncAuthState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyLoggedOutState]);

  return {
    user,
    roles,
    isAuthenticated,
    loading,
    error,
    accessContext,
    accessGateReady,
    login,
    register,
    logout,
    bootstrapAuth,
    fetchMe,
    refreshSession,
  };
}
