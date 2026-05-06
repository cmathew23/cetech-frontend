import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
  isNormalizedApiError: () => false,
}));

import {
  headApproveTrainingPlanVersion,
  fetchCoachAthleteTrainingPlanReadiness,
  parseReadinessPayload,
  releaseTrainingPlanVersionToAthlete,
  submitTrainingPlanVersionForReview,
} from "@/lib/api/coachAthletePlanningReadiness";

describe("parseReadinessPayload", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("parses backend generation readiness flags", () => {
    expect(
      parseReadinessPayload({
        data: {
          readinessStatus: "COMPLETE",
          canGenerate: true,
          isReady: true,
          blockers: [],
          validationStatus: "CONFIRMED",
        },
      }),
    ).toMatchObject({
      readinessStatus: "COMPLETE",
      canGenerate: true,
      isReady: true,
      blockers: [],
      validationStatus: "CONFIRMED",
    });
  });

  it("extracts blocker messages from object arrays", () => {
    expect(
      parseReadinessPayload({
        data: {
          readinessStatus: "BLOCKED",
          canGenerate: false,
          blockers: [
            { message: "seasonDefined" },
            { reason: "upstreamGenerationDecisionPassed" },
          ],
        },
      }).blockers,
    ).toEqual(["seasonDefined", "upstreamGenerationDecisionPassed"]);
  });

  it("preserves exact blocker payloads when no text key matches", () => {
    expect(
      parseReadinessPayload({
        data: {
          readinessStatus: "NOT_READY",
          canGenerate: false,
          blockers: [
            { requirement: "upstreamGenerationDecisionPassed", satisfied: false },
          ],
        },
      }).blockers,
    ).toEqual([
      '{"requirement":"upstreamGenerationDecisionPassed","satisfied":false}',
    ]);
  });

  it("includes generationDomain and seasonCycleId in readiness requests", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        readinessStatus: "COMPLETE",
        isReady: true,
        canGenerate: true,
        blockers: [],
      },
    });

    await fetchCoachAthleteTrainingPlanReadiness("entity-1", "athlete-1", {
      generationDomain: "SKILLS",
      seasonCycleId: "season-123",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/readiness?generationDomain=SKILLS&seasonCycleId=season-123",
      {
        method: "GET",
        cache: "no-store",
      },
    );
  });

  it("submits a training plan version for review with generationDomain", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await submitTrainingPlanVersionForReview(
      "entity-1",
      "athlete-1",
      "plan-1",
      "version-1",
      "SKILLS",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plans/plan-1/versions/version-1/submit-review",
      {
        method: "POST",
        body: JSON.stringify({ generationDomain: "SKILLS" }),
      },
    );
  });

  it("head-approves a training plan version with generationDomain", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await headApproveTrainingPlanVersion(
      "entity-1",
      "athlete-1",
      "plan-1",
      "version-1",
      "NUTRITION",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plans/plan-1/versions/version-1/head-approve",
      {
        method: "POST",
        body: JSON.stringify({ generationDomain: "NUTRITION" }),
      },
    );
  });

  it("releases a training plan version with generationDomain", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await releaseTrainingPlanVersionToAthlete(
      "entity-1",
      "athlete-1",
      "plan-1",
      "version-1",
      "S_AND_C",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plans/plan-1/versions/version-1/release",
      {
        method: "POST",
        body: JSON.stringify({ generationDomain: "S_AND_C" }),
      },
    );
  });
});
