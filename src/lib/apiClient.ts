/**
 * Canonical HTTP client for the backend API.
 * — Injects Bearer token when present
 * — On 401: clears token; redirects to /login except on public auth pages
 * — Throws a single NormalizedApiError shape for all failures
 */

import { API_BASE } from "@/config/endpoints";
import { getToken, removeToken } from "@/lib/auth";

const DEFAULT_TIMEOUT_MS = 10_000;

const PUBLIC_AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

/** Entity membership deactivated — user is logged in but must leave entity dashboards. */
export const MEMBERSHIP_INACTIVE_ROUTE = "/membership-inactive";

const ENTITY_MEMBERSHIP_INACTIVE_CODE = "ENTITY_MEMBERSHIP_INACTIVE";

function redirectToMembershipInactiveIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith(MEMBERSHIP_INACTIVE_ROUTE)) return;
  window.location.replace(MEMBERSHIP_INACTIVE_ROUTE);
}

/** Single frontend-safe error shape for API and auth failures. */
export type NormalizedApiError = {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
};

export function isNormalizedApiError(e: unknown): e is NormalizedApiError {
  return (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string" &&
    "status" in e &&
    typeof (e as { status: unknown }).status === "number"
  );
}

/**
 * Message extraction from JSON error bodies (explicit order):
 * 1. payload.message
 * 2. payload.error?.message (when `error` is an object)
 */
function extractMessageFromPayload(
  data: unknown,
  fallback: string,
): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }
  const o = data as Record<string, unknown>;

  if (typeof o.message === "string" && o.message.trim() !== "") {
    return o.message.trim();
  }

  const err = o.error;
  if (err && typeof err === "object") {
    const em = (err as { message?: unknown }).message;
    if (typeof em === "string" && em.trim() !== "") {
      return em.trim();
    }
  }

  return fallback;
}

/**
 * Code extraction from JSON error bodies (explicit order):
 * 1. payload.errorCode
 * 2. payload.code
 * 3. payload.error?.code (when `error` is an object)
 */
function extractCodeFromPayload(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const o = data as Record<string, unknown>;

  if (typeof o.errorCode === "string" && o.errorCode.trim() !== "") {
    return o.errorCode.trim();
  }

  if (typeof o.code === "string" && o.code.trim() !== "") {
    return o.code.trim();
  }

  const err = o.error;
  if (err && typeof err === "object") {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string" && c.trim() !== "") {
      return c.trim();
    }
  }

  return undefined;
}

function normalizeFailure(
  status: number,
  data: unknown,
  fallbackMessage: string,
): NormalizedApiError {
  return {
    message: extractMessageFromPayload(data, fallbackMessage),
    status,
    code: extractCodeFromPayload(data),
    details: data && typeof data === "object" ? data : undefined,
  };
}

function shouldRedirectToLoginOn401(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return !PUBLIC_AUTH_PATHS.has(path);
}

type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  timeoutMs?: number;
  omitAuth?: boolean;
};

/**
 * JSON API request. Returns parsed JSON body on 2xx.
 * No business logic — only transport, auth header, and error normalization.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    headers: userHeaders,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    omitAuth = false,
    ...rest
  } =
    options;

  const token = getToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;

  try {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    res = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(!omitAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userHeaders || {}),
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw normalizeFailure(0, null, "Request timed out");
    }
    const msg = err instanceof Error ? err.message : "Network error";
    throw normalizeFailure(0, null, msg);
  } finally {
    clearTimeout(timeout);
  }

  const data = (await res.json().catch(() => null)) as unknown;

  if (res.status === 401) {
    removeToken();
    if (shouldRedirectToLoginOn401()) {
      window.location.href = "/login";
    }
    throw normalizeFailure(
      401,
      data,
      "Session expired. Please login again.",
    );
  }

  if (!res.ok) {
    const code = extractCodeFromPayload(data);
    if (code === ENTITY_MEMBERSHIP_INACTIVE_CODE) {
      redirectToMembershipInactiveIfNeeded();
    }
    const fallback =
      res.status >= 500
        ? "Server error. Please try again later."
        : "API request failed";
    throw normalizeFailure(res.status, data, fallback);
  }

  return data as T;
}
