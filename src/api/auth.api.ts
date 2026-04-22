/**
 * DEFERRED — not part of the active runtime API layer.
 *
 * Canonical today:
 * - Transport: `src/lib/apiClient.ts`
 * - Paths: `src/config/endpoints.ts` (`paths.auth.*`)
 * - Call sites: `src/app/login`, `src/app/register`, `src/hooks/useAuth.ts`, `src/lib/logoutClient.js`
 *
 * Revisit only if we consolidate domain modules under `src/api/` and retire `src/lib/api/*`.
 */

export {};
