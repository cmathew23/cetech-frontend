import { API_BASE, paths } from "@/config/endpoints";
import { apiRequest, isNormalizedApiError } from "@/lib/apiClient";

const SAVE_TIMEOUT_MS = 120_000;
const READ_TIMEOUT_MS = 30_000;

export type PeakFlowSavePayload = {
  athleteId: string;
  entityId: string;
  taxonomyAreaKey: string;
  analysisType: "BODY" | "CLUB";
  result: object;
  resultVideoUrl: string;
};

function failureMessage(error: unknown, fallback: string): string {
  if (isNormalizedApiError(error) && error.message.trim() !== "") return error.message;
  if (error instanceof Error && error.message.trim() !== "") return error.message;
  return fallback;
}

export function peakFlowAnalysesListUrl(
  athleteId: string,
  entityId?: string | null,
): string {
  const params = new URLSearchParams({ athleteId });
  const entity = entityId?.trim() ?? "";
  if (entity !== "") params.set("entityId", entity);
  return `${API_BASE}${paths.peakFlowSwing.list}?${params.toString()}`;
}

export function peakFlowAnalysisDetailUrl(analysisId: string, athleteId: string): string {
  const params = new URLSearchParams({ athleteId });
  return `${API_BASE}${paths.peakFlowSwing.byId(analysisId)}?${params.toString()}`;
}

export function peakFlowShareUrl(analysisId: string): string {
  return `${API_BASE}${paths.peakFlowSwing.share(analysisId)}`;
}

export async function postPeakFlowSaveAnalysis(payload: PeakFlowSavePayload): Promise<unknown> {
  try {
    return await apiRequest(paths.peakFlowSwing.save, {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: SAVE_TIMEOUT_MS,
    });
  } catch (error) {
    throw new Error(failureMessage(error, "Saved analysis could not be stored."));
  }
}

export async function fetchPeakFlowSavedAnalysesRequest(
  athleteId: string,
  entityId?: string | null,
): Promise<unknown> {
  const params = new URLSearchParams({ athleteId });
  const entity = entityId?.trim() ?? "";
  if (entity !== "") params.set("entityId", entity);
  try {
    return await apiRequest(`${paths.peakFlowSwing.list}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      timeoutMs: READ_TIMEOUT_MS,
    });
  } catch (error) {
    throw new Error(failureMessage(error, "Saved analyses could not be loaded."));
  }
}

export async function fetchPeakFlowSavedAnalysisRequest(
  analysisId: string,
  athleteId: string,
): Promise<unknown> {
  const params = new URLSearchParams({ athleteId });
  try {
    return await apiRequest(`${paths.peakFlowSwing.byId(analysisId)}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      timeoutMs: READ_TIMEOUT_MS,
    });
  } catch (error) {
    throw new Error(failureMessage(error, "Saved analysis could not be opened."));
  }
}

export async function postPeakFlowShareAnalysis(
  analysisId: string,
  entityId: string,
): Promise<unknown> {
  const path = paths.peakFlowSwing.share(analysisId);
  try {
    return await apiRequest(path, {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: READ_TIMEOUT_MS,
    });
  } catch (error) {
    if (
      isNormalizedApiError(error) &&
      error.status === 409 &&
      error.code === "ENTITY_CONTEXT_REQUIRED"
    ) {
      const authoritativeEntityId = entityId.trim();
      if (authoritativeEntityId === "") {
        throw new Error(error.message);
      }
      try {
        return await apiRequest(path, {
          method: "POST",
          body: JSON.stringify({ entityId: authoritativeEntityId }),
          timeoutMs: READ_TIMEOUT_MS,
        });
      } catch (retryError) {
        throw new Error(failureMessage(retryError, "Analysis could not be shared."));
      }
    }
    throw new Error(failureMessage(error, "Analysis could not be shared."));
  }
}
