/**
 * Training plan level validation — coach review of system-suggested athlete level.
 * Align with GET/POST `/entities/.../training-plan-generation/level-validation` DTOs.
 */

export const TRAINING_PLAN_VALIDATED_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ELITE",
] as const;

export type TrainingPlanValidatedLevel =
  (typeof TRAINING_PLAN_VALIDATED_LEVELS)[number];

export type TrainingPlanLevelValidationView = {
  age: number | null;
  ageBand: string | null;
  highestCompetitionLevelReachedPast12Months: string | null;
  highestRankingAchievedAtThatLevelPast12Months: number | null;
  baseSuggestedLevel: string | null;
  rankingOverrideApplied: boolean | null;
  finalSuggestedLevel: string | null;
  validatedLevel: string | null;
  validationStatus: string | null;
  reasons: string[];
};
