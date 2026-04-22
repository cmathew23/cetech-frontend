/**
 * Mirrors cetech-backend Prisma enum `AthleteLevel`.
 */
export const ATHLETE_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ELITE",
] as const;

export type AthleteLevelValue = (typeof ATHLETE_LEVELS)[number];
