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
  fetchAthleteTodayPlan,
  fetchAthleteWeeklyPlanJournal,
  fetchCoachAthleteTrainingPlanCompleteness,
  fetchCoachAthleteUpstreamPlanningContext,
  fetchLatestCoachAthleteDomainDraft,
  fetchPersistedTrainingPlanActiveDetail,
  headApprove,
  headApproveTrainingPlanVersion,
  lockCoachAthletePlanningContext,
  fetchCoachAthleteTrainingPlanReadiness,
  parseUpstreamPlanningContextPayload,
  parseReadinessPayload,
  persistCoachAthleteTrainingPlanDraft,
  persistDraftResultFromLatestDomainDraft,
  release,
  requestTrainingPlanRevision,
  requestRevision,
  reviseNutritionPlan,
  releaseTrainingPlanVersionToAthlete,
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
        timeoutMs: 30_000,
      },
    );
    expect(result.upstreamPlanningContextLocked).toBe(true);
    expect(result.seasonCycleId).toBe("season-1");
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
        timeoutMs: 120000,
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
        body: JSON.stringify({ generationDomain: "NUTRITION" }),
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
        days: [],
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

  it("paths.trainingPlanManagement.activeDetail includes generationDomain query", () => {
    expect(paths.trainingPlanManagement.activeDetail("plan-1", "SKILLS")).toBe(
      "/training-plan-management/plan-1/active/detail?generationDomain=SKILLS",
    );
    expect(paths.trainingPlanManagement.activeDetail("plan/x", "S_AND_C")).toBe(
      "/training-plan-management/plan%2Fx/active/detail?generationDomain=S_AND_C",
    );
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

  it("persist-draft uses 60s client timeout", async () => {
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
        timeoutMs: 60_000,
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
