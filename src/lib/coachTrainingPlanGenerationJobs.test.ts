import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  fetchCoachAthleteTrainingPlanGenerationJobMock,
  startCoachAthleteTrainingPlanGenerationJobMock,
} = vi.hoisted(() => ({
  fetchCoachAthleteTrainingPlanGenerationJobMock: vi.fn(),
  startCoachAthleteTrainingPlanGenerationJobMock: vi.fn(),
}));

vi.mock("@/lib/api/coachAthletePlanningReadiness", () => ({
  fetchCoachAthleteTrainingPlanGenerationJob: fetchCoachAthleteTrainingPlanGenerationJobMock,
  startCoachAthleteTrainingPlanGenerationJob: startCoachAthleteTrainingPlanGenerationJobMock,
}));

import {
  runTrainingPlanGenerationJob,
  TRAINING_PLAN_JOB_POLL_INTERVAL_MS,
} from "@/lib/coachTrainingPlanGenerationJobs";

describe("runTrainingPlanGenerationJob", () => {
  beforeEach(() => {
    fetchCoachAthleteTrainingPlanGenerationJobMock.mockReset();
    startCoachAthleteTrainingPlanGenerationJobMock.mockReset();
  });

  it("starts async generation, reports running progress, and resolves on completion", async () => {
    const onUpdate = vi.fn();
    const delayMs = vi.fn().mockResolvedValue(undefined);

    startCoachAthleteTrainingPlanGenerationJobMock.mockResolvedValue({
      jobId: "job-1",
      domain: "SKILLS",
      status: "QUEUED",
      progressPercent: 0,
      progressStage: "QUEUED",
      progressMessage: "Generation job queued.",
      errorMessage: null,
      raw: {},
    });
    fetchCoachAthleteTrainingPlanGenerationJobMock
      .mockResolvedValueOnce({
        jobId: "job-1",
        domain: "SKILLS",
        status: "RUNNING",
        progressPercent: 40,
        progressStage: "GENERATING",
        progressMessage: "Building practice sessions...",
        errorMessage: null,
        raw: {},
      })
      .mockResolvedValueOnce({
        jobId: "job-1",
        domain: "SKILLS",
        status: "COMPLETED",
        progressPercent: 100,
        progressStage: "COMPLETED",
        progressMessage: "Draft ready.",
        errorMessage: null,
        raw: {},
      });

    const result = await runTrainingPlanGenerationJob({
      entityId: "entity-1",
      athleteId: "athlete-1",
      sportCode: "GOLF",
      generationDomain: "SKILLS",
      durationDays: 7,
      onUpdate,
      delayMs,
    });

    expect(startCoachAthleteTrainingPlanGenerationJobMock).toHaveBeenCalledWith(
      "entity-1",
      "athlete-1",
      {
        sportCode: "GOLF",
        durationDays: 7,
        generationDomain: "SKILLS",
      },
    );
    expect(delayMs).toHaveBeenCalledWith(TRAINING_PLAN_JOB_POLL_INTERVAL_MS);
    expect(fetchCoachAthleteTrainingPlanGenerationJobMock).toHaveBeenNthCalledWith(
      1,
      "entity-1",
      "athlete-1",
      "job-1",
    );
    expect(fetchCoachAthleteTrainingPlanGenerationJobMock).toHaveBeenNthCalledWith(
      2,
      "entity-1",
      "athlete-1",
      "job-1",
    );
    expect(onUpdate).toHaveBeenCalledTimes(3);
    expect(onUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        status: "RUNNING",
        progressPercent: 40,
        progressStage: "GENERATING",
        progressMessage: "Building practice sessions...",
      }),
    );
    expect(result).toEqual({
      terminalStatus: "COMPLETED",
      latestJob: expect.objectContaining({
        status: "COMPLETED",
        progressPercent: 100,
      }),
    });
  });

  it("returns the safe backend error message when the job fails", async () => {
    const onUpdate = vi.fn();
    const delayMs = vi.fn().mockResolvedValue(undefined);

    startCoachAthleteTrainingPlanGenerationJobMock.mockResolvedValue({
      jobId: "job-2",
      domain: "NUTRITION",
      status: "QUEUED",
      progressPercent: 0,
      progressStage: "QUEUED",
      progressMessage: "Generation job queued.",
      errorMessage: null,
      raw: {},
    });
    fetchCoachAthleteTrainingPlanGenerationJobMock.mockResolvedValue({
      jobId: "job-2",
      domain: "NUTRITION",
      status: "FAILED",
      progressPercent: 55,
      progressStage: "GENERATING",
      progressMessage: "Generating meals...",
      errorMessage: "Nutrition generation failed safely.",
      raw: {},
    });

    const result = await runTrainingPlanGenerationJob({
      entityId: "entity-1",
      athleteId: "athlete-1",
      sportCode: "GOLF",
      generationDomain: "NUTRITION",
      durationDays: 7,
      onUpdate,
      delayMs,
    });

    expect(delayMs).toHaveBeenCalledWith(TRAINING_PLAN_JOB_POLL_INTERVAL_MS);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FAILED",
        errorMessage: "Nutrition generation failed safely.",
      }),
    );
    expect(result).toEqual({
      terminalStatus: "FAILED",
      latestJob: expect.objectContaining({
        status: "FAILED",
      }),
      errorMessage: "Nutrition generation failed safely.",
    });
  });
});
