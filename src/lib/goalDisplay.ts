import type { TrainingPlanGenerationDomain } from "@/lib/api/coachAthletePlanningReadiness";

function trimOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function cleanGoalText(value: string | null | undefined): string | null {
  const trimmed = trimOrNull(value);
  if (!trimmed) return null;
  return trimmed.replace(/^AI\s*->\s*/i, "").trim() || null;
}

export function formatGoalDate(value: string | null | undefined): string | null {
  const cleaned = trimOrNull(value);
  if (!cleaned) return null;

  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime())) {
    return cleaned.includes("T") ? cleaned.slice(0, 10) : cleaned;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatGoalStatus(value: string | null | undefined): string | null {
  const cleaned = trimOrNull(value);
  if (!cleaned) return null;
  return cleaned
    .toLowerCase()
    .split("_")
    .filter((part) => part !== "")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatGoalDomain(
  value: TrainingPlanGenerationDomain | null | undefined,
): string | null {
  if (value === "SKILLS") return "Skills";
  if (value === "S_AND_C") return "S&C";
  if (value === "NUTRITION") return "Nutrition";
  return null;
}

export function renderGoalSuccessCriteria(
  value: string | null | undefined,
): string[] {
  const cleaned = cleanGoalText(value);
  if (!cleaned) return [];

  return cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
    .filter((line) => line !== "");
}
