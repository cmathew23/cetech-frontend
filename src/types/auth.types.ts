/**
 * Auth DTOs inferred from CETECH frontend usage (login, register, useAuth, apiClient).
 * Align field names with cetech-backend auth responses; extend when backend contract is documented.
 */

import type { NormalizedApiError } from "@/lib/apiClient";

/** Roles accepted by POST /auth/register (matches register UI options). */
export type RegistrationRole = "ATHLETE" | "COACH" | "ACADEMY_ADMIN";

// --- Requests ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RegistrationRole;
}

// --- Responses ---

/**
 * Token nesting observed after successful POST /auth/login:
 * `data.accessToken` or `data.data.accessToken`.
 */
export interface LoginAccessPayload {
  accessToken?: string;
  data?: {
    accessToken?: string;
  };
}

/**
 * Successful login supports observed token nesting:
 * - data.accessToken
 * - data.data.accessToken
 * Some transports may also include accessToken at root.
 */
export interface LoginSuccessResponse {
  success?: true;
  data?: LoginAccessPayload;
  accessToken?: string;
}

/** Error-shaped login payload used by frontend fallback handling. */
export interface LoginFailureResponse {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
  errorCode?: string;
  code?: string;
  message?: string;
}

export type LoginResponse = LoginSuccessResponse | LoginFailureResponse;

/**
 * POST /auth/register success response.
 */
export interface RegisterResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      roles: string[];
    };
  };
}

/**
 * POST /auth/logout response.
 */
export interface LogoutResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
}

/**
 * User shape for GET /auth/me — not field-accessed in `useAuth` today.
 * Include common optional fields so callers can narrow safely later.
 */
export interface AuthUserDto {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

/**
 * GET /auth/me success response.
 */
export interface MeResponse {
  success: true;
  data: {
    userId: string;
    roles: string[];
  };
}

// --- Errors (aligned with apiClient NormalizedApiError) ---

/**
 * Canonical transport error shape from api client.
 */
export type NormalizedApiErrorShape = NormalizedApiError;
