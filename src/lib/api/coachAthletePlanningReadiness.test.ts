import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
  isNormalizedApiError: () => false,
}));

import { paths } from "@/config/endpoints";
import {
  executeCoachAthleteTrainingPlan,
  fetchCoachAthleteTrainingPlanGenerationJob,
  fetchAthleteTodayPlan,
  fetchAthleteWeeklyPlanJournal,
  fetchCoachAthleteTrainingPlanCompleteness,
  fetchCoachTrainingPlanDomainHistory,
  fetchCoachTrainingPlanDomainHistoryDetail,
  fetchCoachAthleteDomainDraftRevisionContext,
  fetchCoachAthleteDomainDraftRevisionOptions,
  fetchCoachAthleteUpstreamPlanningContext,
  fetchDomainPlanSummary,
  fetchLatestCoachAthleteDomainDraft,
  fetchPersistedTrainingPlanActiveDetail,
  headApprove,
  headApproveTrainingPlanVersion,
  domainApprove,
  lockCoachAthletePlanningContext,
  fetchCoachAthleteTrainingPlanReadiness,
  parseUpstreamPlanningContextPayload,
  parseReadinessPayload,
  persistCoachAthleteTrainingPlanDraft,
  persistDraftResultFromLatestDomainDraft,
  release,
  requestTrainingPlanRevision,
  requestRevision,
  reviseSkillsPlan,
  reviseNutritionPlan,
  releaseTrainingPlanVersionToAthlete,
  startCoachAthleteTrainingPlanGenerationJob,
  submitReview,
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

  it("parses sportCode echoed on readiness payloads", () => {
    expect(
      parseReadinessPayload({
        data: { readinessStatus: "READY", sportCode: "TENNIS" },
      }).sportCode,
    ).toBe("TENNIS");
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
        timeoutMs: 60_000,
      },
    );
  });

  it("includes sportCode in readiness requests when provided", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        readinessStatus: "READY",
        canGenerate: true,
        blockers: [],
      },
    });

    await fetchCoachAthleteTrainingPlanReadiness("entity-1", "athlete-1", {
      generationDomain: "SKILLS",
      sportCode: "GOLF",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/readiness?generationDomain=SKILLS&sportCode=GOLF",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60_000,
      },
    );
  });

  it("includes sportCode in completeness requests when provided", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        completenessStatus: "COMPLETE",
        missingRequiredFields: [],
      },
    });

    await fetchCoachAthleteTrainingPlanCompleteness("entity-1", "athlete-1", {
      sportCode: "GOLF",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/completeness?sportCode=GOLF",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60_000,
      },
    );
  });

  it("parses locked upstream planning context payloads", () => {
    expect(
      parseUpstreamPlanningContextPayload({
        data: {
          upstreamPlanningContextLocked: true,
          planningContextLocked: true,
          planWindow: {
            startDate: "2026-05-11",
            endDate: "2026-05-17",
          },
          planningContext: {
            seasonCycleId: "season-1",
            goalIds: ["goal-1", "goal-2"],
            startDate: "2026-05-11",
            endDate: "2026-05-17",
            phase: "PRE_SEASON",
          },
          workloadSummary: {
            weeklyTrainingHours: 8,
            recommendedMinHours: 6,
            recommendedMaxHours: 10,
            status: "READY",
            sportCode: "TENNIS",
            validatedLevel: "INTERMEDIATE",
          },
        },
      }),
    ).toMatchObject({
      planningContextLocked: true,
      upstreamPlanningContextLocked: true,
      planWindow: {
        startDate: "2026-05-11",
        endDate: "2026-05-17",
      },
      seasonCycleId: "season-1",
      goalIds: ["goal-1", "goal-2"],
      startDate: "2026-05-11",
      endDate: "2026-05-17",
      phase: "PRE_SEASON",
      workloadSummary: {
        weeklyTrainingHours: 8,
        recommendedMinHours: 6,
        recommendedMaxHours: 10,
        status: "READY",
      },
    });
  });

  it("parses Athlete 401 locked upstream response shape for display fields", () => {
    expect(
      parseUpstreamPlanningContextPayload({
        upstreamPlanningContextLocked: true,
        planningContextLocked: true,
        planWindow: { startDate: "2026-05-20", endDate: "2026-05-26" },
        season: { phaseName: "Off Season", phaseCode: "OFF_SEASON" },
        workload: {
          weeklyTrainingHours: 16,
          recommendedRange: { minHours: 10, maxHours: 16, label: "10 - 16 hrs/week" },
          trainingLoadStatus: "OPTIMAL",
        },
        planningContext: {
          validatedLevel: null,
          workload: {
            weeklyTrainingHours: 16,
            recommendedRange: { minHours: 10, maxHours: 16, label: "10 - 16 hrs/week" },
          },
        },
      }),
    ).toMatchObject({
      planningContextLocked: true,
      upstreamPlanningContextLocked: true,
      workloadSummary: {
        weeklyTrainingHours: 16,
        recommendedMinHours: 10,
        recommendedMaxHours: 16,
      },
      workload: {
        recommendedRange: { label: "10 - 16 hrs/week" },
      },
    });
  });

  it("merges partial planningContext workload with enriched workloadSummary", () => {
    expect(
      parseUpstreamPlanningContextPayload({
        data: {
          planningContextLocked: true,
          planningContext: {
            workload: {
              weeklyTrainingHours: 16,
            },
          },
          workloadSummary: {
            weeklyTrainingHours: 16,
            recommendedMinHours: 10,
            recommendedMaxHours: 18,
            status: "OPTIMAL",
            validatedLevel: "ADVANCED",
          },
        },
      }),
    ).toMatchObject({
      workloadSummary: {
        weeklyTrainingHours: 16,
        recommendedMinHours: 10,
        recommendedMaxHours: 18,
        status: "OPTIMAL",
        validatedLevel: "ADVANCED",
      },
    });
  });

  it("parses enriched locked planning context fields", () => {
    expect(
      parseUpstreamPlanningContextPayload({
        data: {
          planningContextLocked: true,
          upstreamPlanningContextLocked: true,
          planWindow: {
            startDate: "2026-05-11",
            endDate: "2026-05-17",
          },
          season: {
            phaseName: "Pre Season",
            phaseCode: "PRE_SEASON",
            seasonCycleId: "season-1",
          },
          goals: [
            {
              goalId: "goal-1",
              goalName: "Improve first serve consistency",
              successCriteria: "Hit 7 of 10 serves into target zone",
            },
          ],
          planningContext: {
            seasonCycleId: "season-1",
            goalIds: ["goal-1"],
            lockedGoalIds: ["goal-1"],
            validatedLevel: "ADVANCED",
            season: {
              phaseName: "Pre Season",
              phaseCode: "PRE_SEASON",
              seasonCycleId: "season-1",
            },
            workload: {
              weeklyTrainingHours: 9,
              sport: "GOLF",
              ageBand: "JUNIOR",
              trainingLoadStatus: "OPTIMAL",
              recommendedRange: {
                minHours: 10,
                maxHours: 16,
                label: "10 - 16 hrs/week",
              },
              classificationStatus: "WITHIN_RANGE",
              restrictionSummary: "Maintain current volume",
              summary: "Workload is appropriate for the athlete's level.",
            },
            goals: [
              {
                goalId: "goal-1",
                goalName: "Improve first serve consistency",
                successCriteria: "Hit 7 of 10 serves into target zone",
              },
            ],
          },
        },
      }),
    ).toMatchObject({
      seasonCycleId: "season-1",
      goalIds: ["goal-1"],
      season: {
        phaseName: "Pre Season",
        phaseCode: "PRE_SEASON",
        seasonCycleId: "season-1",
      },
      workload: {
        weeklyTrainingHours: 9,
          sport: "GOLF",
          ageBand: "JUNIOR",
          trainingLoadStatus: "OPTIMAL",
          recommendedRange: {
            minHours: 10,
            maxHours: 16,
            label: "10 - 16 hrs/week",
          },
        classificationStatus: "WITHIN_RANGE",
        restrictionSummary: "Maintain current volume",
        summary: "Workload is appropriate for the athlete's level.",
      },
      goals: [
        {
          goalId: "goal-1",
          goalName: "Improve first serve consistency",
          successCriteria: "Hit 7 of 10 serves into target zone",
        },
      ],
      planningContext: {
        seasonCycleId: "season-1",
        goalIds: ["goal-1"],
        lockedGoalIds: ["goal-1"],
        validatedLevel: "ADVANCED",
        season: {
          phaseName: "Pre Season",
          phaseCode: "PRE_SEASON",
        },
        workload: {
          weeklyTrainingHours: 9,
          sport: "GOLF",
          ageBand: "JUNIOR",
          trainingLoadStatus: "OPTIMAL",
          recommendedRange: {
            minHours: 10,
            maxHours: 16,
            label: "10 - 16 hrs/week",
          },
          classificationStatus: "WITHIN_RANGE",
          restrictionSummary: "Maintain current volume",
        },
        goals: [
          {
            goalId: "goal-1",
            goalName: "Improve first serve consistency",
            successCriteria: "Hit 7 of 10 serves into target zone",
          },
        ],
      },
    });
  });

  it("fetches upstream planning context from the dedicated endpoint", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        upstreamPlanningContextLocked: true,
        seasonCycleId: "season-1",
        goalIds: ["goal-1"],
        startDate: "2026-05-11",
        endDate: "2026-05-17",
      },
    });

    const result = await fetchCoachAthleteUpstreamPlanningContext(
      "entity-1",
      "athlete-1",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/upstream-planning-context",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60_000,
      },
    );
    expect(result.upstreamPlanningContextLocked).toBe(true);
    expect(result.seasonCycleId).toBe("season-1");
  });

  it("fetches domain plan summary with extended timeout for Head Coach review", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        domains: {
          SKILLS: { trainingPlanId: "plan-skills", status: "RELEASED" },
          NUTRITION: { trainingPlanId: "plan-nutrition", status: "ASSISTANT_COACH_APPROVED" },
          S_AND_C: { trainingPlanId: null, status: null },
        },
      },
    });

    const result = await fetchDomainPlanSummary("entity-1", "athlete-1");

    expect(apiRequestMock).toHaveBeenCalledWith(
      paths.entities.athleteTrainingPlanDomainSummary("entity-1", "athlete-1"),
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60_000,
      },
    );
    expect(result.SKILLS.trainingPlanId).toBe("plan-skills");
    expect(result.NUTRITION.status).toBe("ASSISTANT_COACH_APPROVED");
  });

  it("parses domain plan summary status from version-oriented backend fields", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        domains: {
          SKILLS: {
            trainingPlanId: "plan-skills",
            latestVersionId: "version-skills-2",
            latestVersionStatus: "ASSISTANT_COACH_APPROVED",
          },
          NUTRITION: {
            trainingPlanId: "plan-nutrition",
            activeVersionId: "version-nutrition-3",
            currentVersionStatus: "RELEASED",
          },
          S_AND_C: { trainingPlanId: null, status: null },
        },
      },
    });

    const result = await fetchDomainPlanSummary("entity-1", "athlete-1");

    expect(result.SKILLS.latestVersionId).toBe("version-skills-2");
    expect(result.SKILLS.status).toBe("ASSISTANT_COACH_APPROVED");
    expect(result.NUTRITION.activeVersionId).toBe("version-nutrition-3");
    expect(result.NUTRITION.status).toBe("RELEASED");
  });

  it("locks planning context with planWindow dates", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        planningContextLocked: true,
        upstreamPlanningContextLocked: true,
        planWindow: {
          startDate: "2026-05-11",
          endDate: "2026-05-17",
        },
      },
    });

    const result = await lockCoachAthletePlanningContext("entity-1", "athlete-1", {
      planWindow: {
        startDate: "2026-05-11",
        endDate: "2026-05-17",
      },
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/planning-context/lock",
      {
        method: "POST",
        body: JSON.stringify({
          planWindow: {
            startDate: "2026-05-11",
            endDate: "2026-05-17",
          },
        }),
      },
    );
    expect(result.planningContextLocked).toBe(true);
    expect(result.planWindow).toEqual({
      startDate: "2026-05-11",
      endDate: "2026-05-17",
    });
  });

  it("parses structured execute missingRequirements payloads", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        executionDecision: {
          executed: false,
          reason: "blocked-by-backend",
        },
        completenessDecision: {
          canGenerate: false,
          missingRequirements: [
            { reason: "upstreamGenerationDecisionPassed" },
            { message: "seasonDefined" },
          ],
        },
      },
    });

    const result = await executeCoachAthleteTrainingPlan("entity-1", "athlete-1", {
      sportCode: "SOCCER",
      durationDays: 7,
      generationDomain: "SKILLS",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/execute",
      {
        method: "POST",
        timeoutMs: 480_000,
        body: JSON.stringify({
          sportCode: "SOCCER",
          durationDays: 7,
          generationDomain: "SKILLS",
        }),
      },
    );
    expect(result.completenessDecision).toEqual({
      canGenerate: false,
      missingRequirements: ["upstreamGenerationDecisionPassed", "seasonDefined"],
    });
  });

  it("starts an async generation job", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        jobId: "job-1",
        domain: "SKILLS",
        status: "QUEUED",
        progressPercent: 0,
        progressStage: "QUEUED",
        progressMessage: "Generation job queued.",
      },
    });

    const result = await startCoachAthleteTrainingPlanGenerationJob(
      "entity-1",
      "athlete-1",
      {
        sportCode: "GOLF",
        durationDays: 7,
        generationDomain: "SKILLS",
      },
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/jobs",
      {
        method: "POST",
        timeoutMs: 480_000,
        body: JSON.stringify({
          sportCode: "GOLF",
          durationDays: 7,
          generationDomain: "SKILLS",
        }),
      },
    );
    expect(result).toMatchObject({
      jobId: "job-1",
      domain: "SKILLS",
      status: "QUEUED",
      progressPercent: 0,
      progressStage: "QUEUED",
      progressMessage: "Generation job queued.",
    });
  });

  it("polls a generation job and parses safe error messages", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        jobId: "job-1",
        domain: "NUTRITION",
        status: "FAILED",
        progressPercent: 65,
        progressStage: "GENERATING",
        progressMessage: "Generating meals...",
        error: {
          errorMessage: "Planner service timed out.",
        },
      },
    });

    const result = await fetchCoachAthleteTrainingPlanGenerationJob(
      "entity-1",
      "athlete-1",
      "job-1",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/jobs/job-1",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 480_000,
      },
    );
    expect(result).toMatchObject({
      jobId: "job-1",
      domain: "NUTRITION",
      status: "FAILED",
      progressPercent: 65,
      progressStage: "GENERATING",
      progressMessage: "Generating meals...",
      errorMessage: "Planner service timed out.",
    });
  });

  it("submits a training plan version for review with generationDomain", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await submitReview(
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
        timeoutMs: 480_000,
        body: JSON.stringify({ generationDomain: "SKILLS" }),
      },
    );
  });

  it("keeps the legacy submit-review wrapper on the same endpoint", async () => {
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
        timeoutMs: 480_000,
        body: JSON.stringify({ generationDomain: "SKILLS" }),
      },
    );
  });

  it("head-approves a training plan version with generationDomain", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await headApprove(
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
        timeoutMs: 480_000,
        body: JSON.stringify({ generationDomain: "NUTRITION" }),
      },
    );
  });

  it("keeps the legacy head-approve wrapper on the same endpoint", async () => {
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
        timeoutMs: 480_000,
        body: JSON.stringify({ generationDomain: "NUTRITION" }),
      },
    );
  });

  it("domain-approves a direct-release Skills plan version with generationDomain", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await domainApprove(
      "entity-1",
      "athlete-1",
      "plan-1",
      "version-1",
      "SKILLS",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plans/plan-1/versions/version-1/domain-approve",
      {
        method: "POST",
        timeoutMs: 480_000,
        body: JSON.stringify({ generationDomain: "SKILLS" }),
      },
    );
  });

  it("releases a training plan version with generationDomain", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await release(
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
        timeoutMs: 480_000,
        body: JSON.stringify({ generationDomain: "S_AND_C" }),
      },
    );
  });

  it("keeps the legacy release wrapper on the same endpoint", async () => {
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
        timeoutMs: 480_000,
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

    const result = await requestRevision(
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
        timeoutMs: 480_000,
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

  it("keeps the legacy request-revision wrapper on the same endpoint", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        requestRevision: {
          coachFeedback: "Tighten the drill progression",
        },
      },
    });

    await requestTrainingPlanRevision(
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
        timeoutMs: 480_000,
        body: JSON.stringify({
          generationDomain: "SKILLS",
          coachFeedback: "Tighten the drill progression",
        }),
      },
    );
  });

  it("uses the dedicated nutrition revise endpoint", async () => {
    apiRequestMock.mockResolvedValue({
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-2",
    });

    const result = await reviseNutritionPlan("entity-1", "athlete-1", {
      trainingPlanId: "plan-1",
      versionId: "version-2",
      coachFeedback: "Increase protein at breakfast",
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/nutrition/revise",
      {
        method: "POST",
        timeoutMs: 480_000,
        body: JSON.stringify({
          trainingPlanId: "plan-1",
          versionId: "version-2",
          coachFeedback: "Increase protein at breakfast",
        }),
      },
    );
    expect(result).toMatchObject({
      planId: "plan-1",
      versionId: "version-2",
      versionNumber: null,
      generationDomain: "NUTRITION",
      detail: null,
    });
  });

  it("passes a structured Nutrition revisionPatch through to the revise endpoint", async () => {
    apiRequestMock.mockResolvedValue({
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-3",
    });

    const revisionPatch = {
      operation: "REPLACE_ITEM",
      dayIndex: 1,
      sessionIndex: 1,
      itemIndex: 1,
      item: {
        itemType: "NUTRITION",
        label: "Oatmeal",
        nutritionCatalogItemId: "nut-9",
        serving: "1 cup",
        timing: "Breakfast",
        notes: "High fibre",
      },
    } as const;

    await reviseNutritionPlan("entity-1", "athlete-1", {
      trainingPlanId: "plan-1",
      versionId: "version-3",
      coachFeedback: "Apply 1 Nutrition change — Change food item details.",
      revisionPatch,
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/nutrition/revise",
      {
        method: "POST",
        timeoutMs: 480_000,
        body: JSON.stringify({
          trainingPlanId: "plan-1",
          versionId: "version-3",
          coachFeedback: "Apply 1 Nutrition change — Change food item details.",
          revisionPatch,
        }),
      },
    );
  });

  it("passes the exact Skills Add Drill revisionPatch through to the revise endpoint", async () => {
    apiRequestMock.mockResolvedValue({
      trainingPlanId: "skills-plan-1",
      trainingPlanVersionId: "skills-version-2",
    });
    const revisionPatch = {
      operation: "ADD_ITEM",
      dayIndex: 2,
      sessionIndex: 3,
      item: { skillCode: "PACE_CONTROL_01" },
    } as const;

    await reviseSkillsPlan("entity-1", "athlete-1", {
      trainingPlanId: "skills-plan-1",
      versionId: "skills-version-1",
      coachFeedback: "Add drill Pace control ladder to Short game.",
      revisionPatch,
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/skills/revise",
      {
        method: "POST",
        timeoutMs: 480_000,
        body: JSON.stringify({
          trainingPlanId: "skills-plan-1",
          versionId: "skills-version-1",
          coachFeedback: "Add drill Pace control ladder to Short game.",
          revisionPatch,
        }),
      },
    );
  });

  it("omits revisionPatch from the body when the caller does not supply one", async () => {
    apiRequestMock.mockResolvedValue({
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-2",
    });

    await reviseNutritionPlan("entity-1", "athlete-1", {
      trainingPlanId: "plan-1",
      versionId: "version-2",
      coachFeedback: "Increase protein at breakfast",
    });

    const body = JSON.parse(apiRequestMock.mock.calls.at(-1)![1].body as string);
    expect(body).not.toHaveProperty("revisionPatch");
  });

  it("fetches persisted active detail with generationDomain query", async () => {
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
        generationDomain: "SKILLS",
        allowedActions: ["SUBMIT_REVIEW", "HEAD_APPROVE", "REQUEST_REVISION", "RELEASE"],
        releaseMode: "HEAD_COACH_RELEASE",
        selectedVersionRule: "ACTIVE_VERSION",
        days: [
          {
            id: "day-1",
            dayIndex: 1,
            date: "2026-05-04",
            sessions: [
              {
                id: "session-1",
                title: "Serve practice",
                sessionStructure: {
                  skill: {
                    items: [
                      {
                        label: "Target Serve Drill",
                        primaryGoalId: "goal-serve-1",
                        primaryGoalName: "Improve first serve consistency",
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    });

    const result = await fetchPersistedTrainingPlanActiveDetail("plan-1", "SKILLS");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/training-plan-management/plan-1/active/detail?generationDomain=SKILLS",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60000,
      },
    );
    expect(result.plan.id).toBe("plan-1");
    expect(result.version.id).toBe("version-1");
    expect(result.generationDomain).toBe("SKILLS");
    expect(result.allowedActions).toEqual([
      "SUBMIT_REVIEW",
      "HEAD_APPROVE",
      "REQUEST_REVISION",
      "RELEASE",
    ]);
    expect(result.releaseMode).toBe("HEAD_COACH_RELEASE");
    expect(result.selectedVersionRule).toBe("ACTIVE_VERSION");
    expect(result.days[0]?.sessions[0]?.sessionStructureSections[0]?.items[0]).toMatchObject({
      label: "Target Serve Drill",
      primaryGoalId: "goal-serve-1",
      primaryGoalName: "Improve first serve consistency",
    });
  });

  it("includes generationDomain for NUTRITION active/detail", async () => {
    apiRequestMock.mockResolvedValue({
      message: "ok",
      data: {
        plan: { id: "plan-n", athleteId: "athlete-1", entityId: "entity-1", status: "ACTIVE" },
        version: { id: "version-n", trainingPlanId: "plan-n", status: "ACTIVE" },
        days: [],
      },
    });

    await fetchPersistedTrainingPlanActiveDetail("plan-n", "NUTRITION");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/training-plan-management/plan-n/active/detail?generationDomain=NUTRITION",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("parses fresh Nutrition nutrients from active/detail without falling back to stale values", async () => {
    apiRequestMock.mockResolvedValue({
      message: "ok",
      data: {
        plan: { id: "plan-n", athleteId: "athlete-1", entityId: "entity-1", status: "AI_GENERATED" },
        version: {
          id: "version-19",
          trainingPlanId: "plan-n",
          versionNumber: 19,
          status: "AI_GENERATED",
        },
        days: [
          {
            id: "day-1",
            dayIndex: 1,
            sessions: [
              {
                id: "session-1",
                name: "Snacks",
                sessionStructure: {
                  items: {
                    items: [
                      {
                        label: "Banana milkshake",
                        serving: "2 glass",
                        calories: 130.61289978027344,
                        protein: 3.6865992546081543,
                        carbs: 18.29117202758789,
                        fat: 4.742460250854492,
                        fiber: 2,
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    });

    const result = await fetchPersistedTrainingPlanActiveDetail("plan-n", "NUTRITION");
    const item = result.days[0]?.sessions[0]?.sessionStructureSections[0]?.items[0];

    expect(item).toMatchObject({
      label: "Banana milkshake",
      serving: "2 glass",
      calories: 130.61289978027344,
      protein: 3.6865992546081543,
      carbs: 18.29117202758789,
      fat: 4.742460250854492,
      fiber: 2,
    });
  });

  it("paths.trainingPlanManagement.activeDetail includes generationDomain query", () => {
    expect(paths.trainingPlanManagement.activeDetail("plan-1", "SKILLS")).toBe(
      "/training-plan-management/plan-1/active/detail?generationDomain=SKILLS",
    );
    expect(paths.trainingPlanManagement.activeDetail("plan/x", "S_AND_C")).toBe(
      "/training-plan-management/plan%2Fx/active/detail?generationDomain=S_AND_C",
    );
  });

  it("fetches domain plan history from the entity athlete endpoint", async () => {
    apiRequestMock.mockResolvedValue({
      data: [
        {
          planId: "plan-1",
          domainPlanId: "domain-plan-1",
          versionId: "version-2",
          versionNumber: 2,
          domain: "SKILLS",
          weekStartDate: "2026-05-04",
          weekEndDate: "2026-05-10",
          status: "COMPLETED",
          releasedAt: "2026-05-11T08:00:00.000Z",
          releasedBy: "Coach Lee",
          viewOnly: true,
        },
      ],
    });

    const result = await fetchCoachTrainingPlanDomainHistory(
      "entity-1",
      "athlete-1",
      "SKILLS",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-management/domains/SKILLS/history",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60000,
      },
    );
    expect(result).toEqual([
      expect.objectContaining({
        planId: "plan-1",
        domainPlanId: "domain-plan-1",
        versionId: "version-2",
        versionNumber: 2,
        domain: "SKILLS",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "COMPLETED",
        releasedAt: "2026-05-11T08:00:00.000Z",
        releasedBy: "Coach Lee",
        viewOnly: true,
      }),
    ]);
  });

  it("fetches domain plan history detail and parses planContent read-only", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        planId: "plan-1",
        domainPlanId: "domain-plan-1",
        versionId: "version-2",
        versionNumber: 2,
        domain: "SKILLS",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "COMPLETED",
        releasedAt: "2026-05-11T08:00:00.000Z",
        releasedBy: "Coach Lee",
        viewOnly: true,
        planContent: {
          plan: {
            id: "plan-1",
            athleteId: "athlete-1",
            entityId: "entity-1",
            status: "COMPLETED",
          },
          version: {
            id: "version-2",
            trainingPlanId: "plan-1",
            status: "COMPLETED",
            versionNumber: 2,
          },
          generationDomain: "SKILLS",
          constraintComplianceSummary: { status: "COMPLIANT" },
          days: [
            {
              id: "day-1",
              dayIndex: 1,
              date: "2026-05-04",
              sessions: [
                {
                  id: "session-1",
                  title: "Serve practice",
                  sessionStructure: {
                    skill: {
                      items: [
                        {
                          label: "Target Serve Drill",
                          summary: "Hit targets from deuce court",
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await fetchCoachTrainingPlanDomainHistoryDetail(
      "entity-1",
      "athlete-1",
      "SKILLS",
      "domain-plan-1",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-management/domains/SKILLS/history/domain-plan-1",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 60000,
      },
    );
    expect(result).toMatchObject({
      planId: "plan-1",
      domainPlanId: "domain-plan-1",
      versionId: "version-2",
      versionNumber: 2,
      domain: "SKILLS",
      viewOnly: true,
    });
    expect(result.planContent.allowedActions).toEqual([]);
    expect(result.planContent.days[0]?.sessions[0]?.sessionStructureSections[0]?.items[0]).toMatchObject({
      label: "Target Serve Drill",
      summary: "Hit targets from deuce court",
    });
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
        timeoutMs: 240_000,
      },
    );
    expect(result.domains.SKILLS.status).toBe("RELEASED");
    expect(result.days[0]).toMatchObject({
      date: "2026-05-04",
      dayNumber: 1,
    });
  });

  it("fetches today plan and treats empty 200 payloads as an empty plan", async () => {
    apiRequestMock.mockResolvedValue({
      message: "ok",
      data: {},
    });

    const result = await fetchAthleteTodayPlan("entity-1", "athlete-1");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/today-plan",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
    expect(result.domains.SKILLS.status).toBe("NOT_RELEASED");
    expect(result.domains.NUTRITION.status).toBe("NOT_RELEASED");
    expect(result.domains.S_AND_C.status).toBe("NOT_RELEASED");
    expect(result.skills).toEqual([]);
    expect(result.nutrition).toEqual([]);
    expect(result.sandc).toEqual([]);
  });
});

describe("training plan generation timeouts and helpers", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("persist-draft uses extended client timeout", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        trainingPlanId: "tp-1",
        trainingPlanVersionId: "tv-1",
        versionNumber: 1,
        status: "DRAFT",
        daysCreated: 7,
        sessionsCreated: 5,
        itemsPersisted: 10,
      },
    });

    await persistCoachAthleteTrainingPlanDraft("entity-1", "athlete-1", {
      generatedPlannerCandidate: { x: 1 },
      generationContextSnapshot: { y: 2 },
      persistenceContext: {
        seasonCycleId: "s1",
        startDate: "2026-01-01",
        endDate: "2026-01-07",
      },
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/persist-draft",
      expect.objectContaining({
        method: "POST",
        timeoutMs: 480_000,
      }),
    );
  });

  it("latest-domain-draft GET uses extended client timeout by default", async () => {
    apiRequestMock.mockResolvedValue({
      trainingPlanId: "tp-1",
      trainingPlanVersionId: "tv-1",
      days: [],
    });

    await fetchLatestCoachAthleteDomainDraft("entity-1", "athlete-1", "SKILLS");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/domain-drafts/latest?generationDomain=SKILLS",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        timeoutMs: 60_000,
      }),
    );
  });

  it("fetches domain draft revision context with generationDomain query", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        generationDomain: "SKILLS",
        draft: {
          trainingPlanId: "plan-1",
          trainingPlanVersionId: "version-1",
          versionNumber: 2,
          status: "AI_GENERATED",
          days: [
            {
              dayIndex: 1,
              sessions: [
                {
                  sessionIndex: 1,
                  title: "Serve practice",
                  items: [{ label: "Target serve drill" }],
                },
              ],
            },
          ],
        },
        ref: {
          trainingPlanId: "plan-1",
          versionId: "version-1",
          status: "AI_GENERATED",
        },
        targetMap: {
          days: [{ label: "Day 1 - Serve practice" }],
        },
        planningBriefSummary: {
          goals: ["Improve first serve"],
          workload: "Moderate",
        },
        lockedPlanningContextSummary: {
          safetyNotes: ["Protect shoulder"],
        },
        allowedChangeTypes: ["CHANGE_DRILL"],
        changeOptions: [{ changeType: "CHANGE_DRILL", label: "Change drill" }],
        requiredInput: ["changeType", "reason"],
      },
    });

    const result = await fetchCoachAthleteDomainDraftRevisionContext(
      "entity-1",
      "athlete-1",
      "SKILLS",
    );

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/domain-drafts/revision-context?generationDomain=SKILLS",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        timeoutMs: 60_000,
      }),
    );
    expect(result.generationDomain).toBe("SKILLS");
    expect(result.draft?.trainingPlanId).toBe("plan-1");
    expect(result.ref?.versionId).toBe("version-1");
    expect(result.allowedChangeTypes).toEqual(["CHANGE_DRILL"]);
    expect(result.changeOptions[0]?.label).toBe("Change drill");
    expect(result.targetMap).toEqual({
      days: [{ label: "Day 1 - Serve practice" }],
    });
  });

  it("parses nutrition composition fields on latest domain draft items", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        trainingPlanId: "plan-nutrition-1",
        trainingPlanVersionId: "version-nutrition-1",
        versionNumber: 1,
        status: "AI_GENERATED",
        days: [
          {
            dayIndex: 1,
            sessions: [
              {
                sessionIndex: 1,
                title: "Breakfast",
                items: [
                  {
                    nutritionCatalogItemId: "nutrition-item-1",
                    label: "Greek Yogurt",
                    serving: "1 cup",
                    quantity: 1,
                    unit: "cup",
                    calories: 150,
                    protein: 15,
                    carbs: 8,
                    fat: 2,
                    timing: "Pre-training",
                    notes: "Pair with berries",
                  },
                  {
                    nutritionCatalogItemId: "nutrition-item-2",
                    label: "Idli",
                    servingQuantity: 2,
                    unit: "pieces",
                    calories: 138,
                  },
                  {
                    nutritionCatalogItemId: "nutrition-item-3",
                    label: "Coconut Chutney",
                    servingSize: "1 bowl",
                    calories: 266,
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await fetchLatestCoachAthleteDomainDraft(
      "entity-1",
      "athlete-1",
      "NUTRITION",
    );

    expect(result.days[0]?.sessions[0]?.items[0]).toMatchObject({
      nutritionCatalogItemId: "nutrition-item-1",
      label: "Greek Yogurt",
      serving: "1 cup",
      quantity: 1,
      unit: "cup",
      calories: 150,
      protein: 15,
      carbs: 8,
      fat: 2,
      timing: "Pre-training",
      notes: "Pair with berries",
    });
    expect(result.days[0]?.sessions[0]?.items[1]).toMatchObject({
      nutritionCatalogItemId: "nutrition-item-2",
      label: "Idli",
      serving: null,
      quantity: 2,
      unit: "pieces",
      calories: 138,
    });
    expect(result.days[0]?.sessions[0]?.items[2]).toMatchObject({
      nutritionCatalogItemId: "nutrition-item-3",
      label: "Coconut Chutney",
      serving: "1 bowl",
      calories: 266,
    });
  });

  it("parses primary goal attribution fields on latest skills draft items", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        trainingPlanId: "plan-skills-1",
        trainingPlanVersionId: "version-skills-1",
        versionNumber: 1,
        status: "AI_GENERATED",
        days: [
          {
            dayIndex: 1,
            sessions: [
              {
                sessionIndex: 1,
                title: "Serve practice",
                items: [
                  {
                    itemType: "SERVE",
                    label: "Target Serve Drill",
                    summary: "Hit targets from deuce court",
                    primaryGoalId: "goal-serve-1",
                    primaryGoalName: "Improve first serve consistency",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await fetchLatestCoachAthleteDomainDraft(
      "entity-1",
      "athlete-1",
      "SKILLS",
    );

    expect(result.days[0]?.sessions[0]?.items[0]).toMatchObject({
      itemType: "SERVE",
      label: "Target Serve Drill",
      summary: "Hit targets from deuce court",
      primaryGoalId: "goal-serve-1",
      primaryGoalName: "Improve first serve consistency",
    });
  });

  it("maps latest draft fields to persist-draft result shape", () => {
    expect(
      persistDraftResultFromLatestDomainDraft({
        trainingPlanId: "p1",
        trainingPlanVersionId: "v1",
        versionNumber: 2,
        status: "AI_GENERATED",
        source: "AI",
        revision: null,
        durationDays: 7,
        daysCreated: 7,
        sessionsCreated: 5,
        itemsPersisted: 12,
        days: [],
        raw: { ok: true },
      }),
    ).toEqual({
      trainingPlanId: "p1",
      trainingPlanVersionId: "v1",
      versionNumber: 2,
      status: "AI_GENERATED",
      daysCreated: 7,
      sessionsCreated: 5,
      itemsPersisted: 12,
      raw: { ok: true },
    });
  });
});

describe("fetchCoachAthleteDomainDraftRevisionOptions", () => {
  const basePayload = {
    generationDomain: "SKILLS" as const,
    trainingPlanId: "plan-1",
    trainingPlanVersionId: "version-1",
    target: {
      dayKey: "day-1",
      sessionKey: "session-1",
      itemKey: "item-1",
      itemType: "DRILL",
      currentId: "drill-1",
      label: "Target serve drill",
      tags: [],
    },
    coachRequest: "Replace the bunker drill, it is too advanced.",
    optionKind: "REPLACEMENT" as const,
    limit: 4,
  };

  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs to the revision-options path with the full request body", async () => {
    apiRequestMock.mockResolvedValue({
      data: { generationDomain: "SKILLS", target: {}, options: [] },
    });

    await fetchCoachAthleteDomainDraftRevisionOptions("entity-1", "athlete-1", basePayload);

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity-1/athletes/athlete-1/training-plan-generation/domain-drafts/revision-options",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );

    const requestInit = apiRequestMock.mock.calls[0]?.[1] as { body: string };
    const body = JSON.parse(requestInit.body);
    expect(body).toMatchObject({
      generationDomain: "SKILLS",
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-1",
      coachRequest: "Replace the bunker drill, it is too advanced.",
      optionKind: "REPLACEMENT",
      limit: 4,
    });
    expect(body.target).toEqual({
      dayKey: "day-1",
      sessionKey: "session-1",
      itemKey: "item-1",
      itemType: "DRILL",
      currentId: "drill-1",
      label: "Target serve drill",
      tags: [],
    });
    // Contract sends trainingPlanVersionId, never versionId.
    expect(body).not.toHaveProperty("versionId");
  });

  it("parses and rank-sorts DB/catalog/current-plan options", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        generationDomain: "SKILLS",
        target: { dayKey: "day-1" },
        options: [
          {
            id: "opt-2",
            rank: 2,
            label: "Cross-court rally drill",
            domain: "SKILLS",
            optionKind: "REPLACEMENT",
            source: "CATALOG",
            score: 0.8,
            reason: "Similar load",
            goalIds: ["goal-1"],
            targetTags: ["serve"],
            safetyTags: [],
            levelTags: ["INTERMEDIATE"],
            metadata: { catalogItemId: "cat-2" },
          },
          {
            id: "opt-1",
            rank: 1,
            label: "Target serve drill",
            domain: "SKILLS",
            optionKind: "REPLACEMENT",
            source: "DB",
            score: 0.9,
            reason: "Best fit",
            goalIds: [],
            targetTags: [],
            safetyTags: ["shoulder"],
            levelTags: [],
            metadata: null,
          },
        ],
      },
    });

    const result = await fetchCoachAthleteDomainDraftRevisionOptions(
      "entity-1",
      "athlete-1",
      basePayload,
    );

    expect(result.generationDomain).toBe("SKILLS");
    expect(result.options.map((option) => option.id)).toEqual(["opt-1", "opt-2"]);
    expect(result.options[0]).toMatchObject({
      id: "opt-1",
      rank: 1,
      label: "Target serve drill",
      source: "DB",
      score: 0.9,
      reason: "Best fit",
      safetyTags: ["shoulder"],
    });
    expect(result.options[1]).toMatchObject({
      id: "opt-2",
      source: "CATALOG",
      targetTags: ["serve"],
      levelTags: ["INTERMEDIATE"],
      metadata: { catalogItemId: "cat-2" },
    });
    // Skills payloads are unchanged: the Nutrition-only catalog field is never populated for them,
    // and metadata.catalogItemId is never promoted into nutritionCatalogItemId.
    expect(result.options[0]?.nutritionCatalogItemId).toBeUndefined();
    expect(result.options[1]?.nutritionCatalogItemId).toBeUndefined();
  });

  it("preserves the explicit top-level nutritionCatalogItemId on Nutrition options", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        generationDomain: "NUTRITION",
        target: { dayKey: "day-1", sessionKey: "meal-1" },
        options: [
          {
            id: "opt-nut-1",
            rank: 1,
            label: "Oatmeal",
            domain: "NUTRITION",
            optionKind: "REPLACEMENT",
            source: "CATALOG",
            // Authoritative catalog reference is the top-level field, distinct from metadata.
            nutritionCatalogItemId: "nut-42",
            metadata: { catalogItemId: "meta-should-not-be-used", serving: "1 cup" },
          },
          {
            id: "opt-nut-2",
            rank: 2,
            label: "Toast",
            domain: "NUTRITION",
            optionKind: "REPLACEMENT",
            source: "CATALOG",
            metadata: null,
          },
        ],
      },
    });

    const result = await fetchCoachAthleteDomainDraftRevisionOptions(
      "entity-1",
      "athlete-1",
      basePayload,
    );

    expect(result.options[0]).toMatchObject({
      id: "opt-nut-1",
      nutritionCatalogItemId: "nut-42",
    });
    // Options without the field expose it as undefined (never inferred from metadata).
    expect(result.options[1]?.nutritionCatalogItemId).toBeUndefined();
  });

  it("parses the backend's complete canonical item on Nutrition options", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        generationDomain: "NUTRITION",
        options: [
          {
            id: "opt-nut-1",
            rank: 1,
            label: "Oatmeal",
            domain: "NUTRITION",
            optionKind: "REPLACEMENT",
            source: "CATALOG",
            nutritionCatalogItemId: "nut-42",
            // Complete canonical item: identity, serving, and every nutrition value preserved.
            item: {
              nutritionCatalogItemId: "nut-42",
              itemType: "NUTRITION",
              label: "Oatmeal",
              serving: "1 cup",
              calories: 320,
              protein: 12,
              carbs: 54,
              fat: 6,
              fiber: 8,
              timing: "Breakfast",
              notes: "High fibre",
            },
          },
          {
            id: "opt-nut-2",
            rank: 2,
            label: "Toast",
            domain: "NUTRITION",
            optionKind: "REPLACEMENT",
            source: "CATALOG",
          },
        ],
      },
    });

    const result = await fetchCoachAthleteDomainDraftRevisionOptions(
      "entity-1",
      "athlete-1",
      basePayload,
    );

    expect(result.options[0]?.item).toEqual({
      nutritionCatalogItemId: "nut-42",
      itemType: "NUTRITION",
      label: "Oatmeal",
      serving: "1 cup",
      calories: 320,
      protein: 12,
      carbs: 54,
      fat: 6,
      fiber: 8,
      timing: "Breakfast",
      notes: "High fibre",
    });
    // Options without an item object expose it as null so submission stays blocked.
    expect(result.options[1]?.item).toBeNull();
  });

  it("filters options missing id/label/optionKind or with an invalid source", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        options: [
          { id: "ok", label: "Valid", optionKind: "REPLACEMENT", source: "CURRENT_PLAN" },
          { rank: 1, label: "No id", optionKind: "REPLACEMENT", source: "DB" },
          { id: "no-label", optionKind: "REPLACEMENT", source: "DB" },
          { id: "no-kind", label: "No kind", source: "DB" },
          { id: "bad-source", label: "Bad source", optionKind: "REPLACEMENT", source: "LLM" },
          { id: "no-source", label: "No source", optionKind: "REPLACEMENT" },
        ],
      },
    });

    const result = await fetchCoachAthleteDomainDraftRevisionOptions(
      "entity-1",
      "athlete-1",
      basePayload,
    );

    expect(result.options.map((option) => option.id)).toEqual(["ok"]);
    expect(result.options[0]?.source).toBe("CURRENT_PLAN");
  });

  it("caps parsed options to the top 4", async () => {
    const options = Array.from({ length: 6 }, (_unused, index) => ({
      id: `opt-${index + 1}`,
      label: `Option ${index + 1}`,
      optionKind: "REPLACEMENT",
      source: "CATALOG",
    }));
    apiRequestMock.mockResolvedValue({ data: { options } });

    const result = await fetchCoachAthleteDomainDraftRevisionOptions(
      "entity-1",
      "athlete-1",
      basePayload,
    );

    expect(result.options).toHaveLength(4);
    expect(result.options.map((option) => option.id)).toEqual([
      "opt-1",
      "opt-2",
      "opt-3",
      "opt-4",
    ]);
  });

  it("returns [] when options are empty or missing", async () => {
    apiRequestMock.mockResolvedValue({ data: { generationDomain: "SKILLS", options: [] } });
    const empty = await fetchCoachAthleteDomainDraftRevisionOptions(
      "entity-1",
      "athlete-1",
      basePayload,
    );
    expect(empty.options).toEqual([]);

    apiRequestMock.mockResolvedValue({ data: { generationDomain: "SKILLS" } });
    const missing = await fetchCoachAthleteDomainDraftRevisionOptions(
      "entity-1",
      "athlete-1",
      basePayload,
    );
    expect(missing.options).toEqual([]);
  });

  it("sends a clean SESSION target for ADD_ITEM: itemType set, item fields omitted, no null fields", async () => {
    apiRequestMock.mockResolvedValue({
      data: { generationDomain: "SKILLS", target: {}, options: [] },
    });

    await fetchCoachAthleteDomainDraftRevisionOptions("entity-1", "athlete-1", {
      generationDomain: "SKILLS",
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-1",
      target: {
        dayKey: "day-1",
        sessionKey: "session-1",
        // Even if item-level fields leak in, they must NOT be forwarded to the backend.
        itemKey: null,
        itemType: null,
        currentId: null,
        label: "Morning session",
        tags: [],
      },
      coachRequest: "Add a volley drill to the morning session.",
      optionKind: "ADD_ITEM",
      limit: 4,
    });

    const requestInit = apiRequestMock.mock.calls[0]?.[1] as { body: string };
    const body = JSON.parse(requestInit.body);
    expect(body).toMatchObject({
      generationDomain: "SKILLS",
      optionKind: "ADD_ITEM",
      limit: 4,
    });
    // Domain-specific itemType, SESSION keys + label + tags only.
    expect(body.target).toEqual({
      dayKey: "day-1",
      sessionKey: "session-1",
      itemType: "SKILL",
      label: "Morning session",
      tags: [],
    });
    expect(body.target).not.toHaveProperty("itemKey");
    expect(body.target).not.toHaveProperty("currentId");
    // No field in the ADD_ITEM target is serialized as null.
    expect(JSON.stringify(body.target)).not.toContain("null");
  });

  it("sends the domain-specific ADD_ITEM itemType for NUTRITION and S_AND_C", async () => {
    for (const [domain, expectedItemType] of [
      ["NUTRITION", "NUTRITION"],
      ["S_AND_C", "EXERCISE"],
    ] as const) {
      apiRequestMock.mockReset();
      apiRequestMock.mockResolvedValue({ data: { generationDomain: domain, options: [] } });
      await fetchCoachAthleteDomainDraftRevisionOptions("entity-1", "athlete-1", {
        generationDomain: domain,
        trainingPlanId: "plan-1",
        trainingPlanVersionId: "version-1",
        target: {
          dayKey: "day-2",
          sessionKey: "session-1",
          label: "Balance and Lower Control",
          tags: [],
        },
        coachRequest: "Add another item.",
        optionKind: "ADD_ITEM",
        limit: 4,
      });
      const requestInit = apiRequestMock.mock.calls[0]?.[1] as { body: string };
      const body = JSON.parse(requestInit.body);
      expect(body.target).toEqual({
        dayKey: "day-2",
        sessionKey: "session-1",
        itemType: expectedItemType,
        label: "Balance and Lower Control",
        tags: [],
      });
      expect(JSON.stringify(body.target)).not.toContain("null");
    }
  });

  it("parses ADD_ITEM options returned by the backend", async () => {
    apiRequestMock.mockResolvedValue({
      data: {
        generationDomain: "S_AND_C",
        target: { dayKey: "day-1", sessionKey: "session-1" },
        options: [
          {
            id: "ex-1",
            rank: 1,
            label: "Goblet squat",
            domain: "S_AND_C",
            optionKind: "ADD_ITEM",
            source: "CATALOG",
            score: 0.9,
            reason: "Approved lower-body exercise",
            goalIds: [],
            targetTags: [],
            safetyTags: [],
            levelTags: [],
            metadata: { catalogItemId: "ex-1" },
          },
        ],
      },
    });

    const result = await fetchCoachAthleteDomainDraftRevisionOptions("entity-1", "athlete-1", {
      generationDomain: "S_AND_C",
      trainingPlanId: "plan-1",
      trainingPlanVersionId: "version-1",
      target: {
        dayKey: "day-1",
        sessionKey: "session-1",
        itemKey: null,
        itemType: null,
        currentId: null,
        label: "Lower body",
        tags: [],
      },
      coachRequest: "Add another squat variation.",
      optionKind: "ADD_ITEM",
      limit: 4,
    });

    expect(result.options).toHaveLength(1);
    expect(result.options[0]).toMatchObject({
      id: "ex-1",
      label: "Goblet squat",
      optionKind: "ADD_ITEM",
      source: "CATALOG",
    });
  });
});
