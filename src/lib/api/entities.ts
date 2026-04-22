import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import type { CreateEntityRequest } from "@/types/trainingEntity.types";

/**
 * POST /entities (cetech-backend trainingEntity.routes.js + trainingEntity.validator).
 * Required: name, type. Optional: hasHeadCoach, headCoachId
 */

export type CreateEntityPayload = CreateEntityRequest;

export async function createEntity(payload: CreateEntityPayload) {
  const body: Record<string, unknown> = {
    name: payload.name.trim(),
    type: payload.type,
  };
  if (payload.hasHeadCoach !== undefined) {
    body.hasHeadCoach = payload.hasHeadCoach;
  }
  if (payload.headCoachId) {
    body.headCoachId = payload.headCoachId;
  }
  return apiRequest(paths.entities.root, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
