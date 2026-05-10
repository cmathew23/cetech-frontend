import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
  isNormalizedApiError: () => false,
}));

import {
  fetchAthleteWeeklyPlanJournal,
  fetchPersistedTrainingPlanActiveDetail,
  headApproveTrainingPlanVersion,
  fetchCoachAthleteTrainingPlanReadiness,
  parseReadinessPayload,
  requestTrainingPlanRevision,
  reviseNutritionPlan,
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

  it("requests revision with generationDomain and coachFeedback", async () => {
    apiRequestMock.mockResolvedValue({
      message: "ok",
      data: {
        requestRevision: {
          coachFeedback: "Tighten the drill progression",
        },
        warnings: ["regenerated"],
      },
    });

    const result = await requestTrainingPlanRevision(
      "entity-1",
      "athlete-1",
      "plan-1",
      "version-1",
      "SKILLS",
      "Tighten the drill progression",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plans/plan-1/versions/version-1/request-revision",
      {
        method: "POST",
        body: JSON.stringify({
          generationDomain: "SKILLS",
          coachFeedback: "Tighten the drill progression",
        }),
      },
    );
    expect(result).toMatchObject({
      coachFeedback: "Tighten the drill progression",
      warnings: ["regenerated"],
    });
  });

  it("uses the dedicated nutrition revise endpoint", async () => {
    apiRequestMock.mockResolvedValue({
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-2",
    });

    await reviseNutritionPlan("entity-1", "athlete-1", {
      trainingPlanId: "plan-1",
      versionId: "version-2",
      coachFeedback: "Increase protein at breakfast",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/nutrition/revise",
      {
        method: "POST",
        timeoutMs: 120000,
        body: JSON.stringify({
          trainingPlanId: "plan-1",
          versionId: "version-2",
          coachFeedback: "Increase protein at breakfast",
        }),
      },
    );
  });

  it("fetches persisted active detail without a generationDomain query", async () => {
    apiRequestMock.mockResolvedValue({
      message: "ok",
      data: {
        plan: {
          id: "plan-1",
          athleteId: "athlete-1",
          entityId: "entity-1",
          status: "ACTIVE",
        },
        version: {
          id: "version-1",
          trainingPlanId: "plan-1",
          status: "ACTIVE",
        },
        days: [],
      },
    });

    const result = await fetchPersistedTrainingPlanActiveDetail("plan-1", "SKILLS");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/training-plan-management/plan-1/active/detail",
      {
        method: "GET",
        cache: "no-store",
      },
    );
    expect(result.plan.id).toBe("plan-1");
    expect(result.version.id).toBe("version-1");
  });

  it("parses the wrapped weekly journal payload", async () => {
    apiRequestMock.mockResolvedValue({
      message: "ok",
      data: {
        athleteId: "athlete-1",
        entityId: "entity-1",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        domains: {
          SKILLS: { status: "RELEASED", planId: "plan-s", versionId: "version-s" },
          NUTRITION: { status: "NOT_RELEASED", planId: null, versionId: null },
          S_AND_C: { status: "RELEASED", planId: "plan-c", versionId: "version-c" },
        },
        days: [
          {
            date: "2026-05-04",
            dayNumber: 1,
            skills: [{ title: "Session" }],
            nutrition: [],
            sandc: [],
          },
        ],
      },
    });

    const result = await fetchAthleteWeeklyPlanJournal("entity-1", "athlete-1");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/weekly-plan-journal",
      {
        method: "GET",
        cache: "no-store",
      },
    );
    expect(result.domains.SKILLS.status).toBe("RELEASED");
    expect(result.days[0]).toMatchObject({
      date: "2026-05-04",
      dayNumber: 1,
    });
  });
});
