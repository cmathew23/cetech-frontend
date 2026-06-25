import {
  fetchCoachAthleteTrainingPlanGenerationJob,
  startCoachAthleteTrainingPlanGenerationJob,
  type CoachAthleteTrainingPlanGenerationJob,
  type TrainingPlanGenerationDomain,
} from "@/lib/api/coachAthletePlanningReadiness";

export const TRAINING_PLAN_JOB_POLL_INTERVAL_MS = 5_000;

export type TrainingPlanGenerationJobTerminalResult =
  | {
      terminalStatus: "COMPLETED";
      latestJob: CoachAthleteTrainingPlanGenerationJob;
    }
  | {
      terminalStatus: "FAILED";
      latestJob: CoachAthleteTrainingPlanGenerationJob;
      errorMessage: string;
    };

export async function runTrainingPlanGenerationJob(options: {
  entityId: string;
  athleteId: string;
  sportCode: string;
  generationDomain: TrainingPlanGenerationDomain;
  durationDays: 7 | 15 | 30;
  seasonCycleId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  goalIds?: string[];
  onUpdate?: (job: CoachAthleteTrainingPlanGenerationJob) => void;
  delayMs?: (ms: number) => Promise<void>;
}): Promise<TrainingPlanGenerationJobTerminalResult> {
  const delayMs =
    options.delayMs
    ?? ((ms: number) => new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    }));

  const startedJob = await startCoachAthleteTrainingPlanGenerationJob(
    options.entityId,
    options.athleteId,
    {
      sportCode: options.sportCode,
      durationDays: options.durationDays,
      generationDomain: options.generationDomain,
      seasonCycleId: options.seasonCycleId,
      planStartDate: options.planStartDate,
      planEndDate: options.planEndDate,
      goalIds: options.goalIds,
    },
  );
  options.onUpdate?.(startedJob);

  const jobId = startedJob.jobId?.trim() ?? "";
  if (jobId === "") {
    return {
      terminalStatus: "FAILED",
      latestJob: startedJob,
      errorMessage: "Training plan generation could not be started. Please try again.",
    };
  }

  let currentJob = startedJob;
  while (currentJob.status !== "COMPLETED" && currentJob.status !== "FAILED") {
    await delayMs(TRAINING_PLAN_JOB_POLL_INTERVAL_MS);
    currentJob = await fetchCoachAthleteTrainingPlanGenerationJob(
      options.entityId,
      options.athleteId,
      jobId,
    );
    options.onUpdate?.(currentJob);
  }

  if (currentJob.status === "FAILED") {
    return {
      terminalStatus: "FAILED",
      latestJob: currentJob,
      errorMessage:
        currentJob.errorMessage?.trim()
        || "Training plan generation failed. Please try again shortly.",
    };
  }

  return {
    terminalStatus: "COMPLETED",
    latestJob: currentJob,
  };
}
