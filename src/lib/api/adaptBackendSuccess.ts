/**
 * Academy Admin (and optional future admin) response adapter.
 * Unwraps `{ success, data }` success envelopes; passes through raw payloads;
 * throws NormalizedApiError when `success === false` (including HTTP 200 failures).
 */

import type { NormalizedApiError } from "@/lib/apiClient";

function throwEnvelopeFailure(payload: Record<string, unknown>): never {
  const message =
    typeof payload.message === "string" && payload.message.trim() !== ""
      ? payload.message.trim()
      : "Request failed";
  const err: NormalizedApiError = {
    message,
    status:
      typeof payload.status === "number" && Number.isFinite(payload.status)
        ? payload.status
        : 400,
    code:
      typeof payload.errorCode === "string"
        ? payload.errorCode
        : typeof payload.code === "string"
          ? payload.code
          : undefined,
    details: payload,
  };
  throw err;
}

/**
 * Normalize a JSON body after a successful HTTP response from apiRequest.
 * - `{ success: false, ... }` → throws NormalizedApiError
 * - `{ success: true, data: T }` → returns `data`
 * - `{ success: true }` without `data` → returns full payload (caller may still parse)
 * - No `success` key → returns payload unchanged
 */
export function adaptBackendSuccess(payload: unknown): unknown {
  if (payload === null || typeof payload !== "object") {
    return payload;
  }
  const o = payload as Record<string, unknown>;
  if (!("success" in o)) {
    return payload;
  }
  if (o.success === false) {
    throwEnvelopeFailure(o);
  }
  if (o.success === true && "data" in o) {
    return o.data;
  }
  return payload;
}
