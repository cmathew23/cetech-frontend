"use client";

import { cn } from "@/lib/utils";

export function normalizeSkillPrimaryGoalName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeSkillSuccessCriteria(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (!Array.isArray(value)) return null;
  const parts = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry !== "");
  return parts.length > 0 ? parts.join(" ") : null;
}

export function normalizeSkillTargetValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function SkillGoalAttributionText({
  primaryGoalName,
  successCriteria,
  targetValue,
  className,
}: {
  primaryGoalName: unknown;
  successCriteria?: unknown;
  targetValue?: unknown;
  className?: string;
}) {
  const goalName = normalizeSkillPrimaryGoalName(primaryGoalName);
  const criteria = normalizeSkillSuccessCriteria(successCriteria);
  const target = normalizeSkillTargetValue(targetValue);
  if (goalName === null && criteria === null && target === null) return null;

  return (
    <div className={cn("mb-2 space-y-0.5 text-xs", className)}>
      {goalName !== null ? (
        <p>
          <span className="font-medium text-primary">Goal:</span>{" "}
          <span className="text-textPrimary">{goalName}</span>
        </p>
      ) : null}
      {criteria !== null ? (
        <p>
          <span className="font-medium text-primary">Success criterion:</span>{" "}
          <span className="text-textPrimary">{criteria}</span>
        </p>
      ) : null}
      {target !== null ? (
        <p>
          <span className="font-medium text-primary">Target value:</span>{" "}
          <span className="text-textPrimary">{target}</span>
        </p>
      ) : null}
    </div>
  );
}
