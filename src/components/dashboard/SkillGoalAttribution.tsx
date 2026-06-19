"use client";

import { cn } from "@/lib/utils";

export function normalizeSkillPrimaryGoalName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function SkillGoalAttributionText({
  primaryGoalName,
  className,
}: {
  primaryGoalName: unknown;
  className?: string;
}) {
  const goalName = normalizeSkillPrimaryGoalName(primaryGoalName);
  if (goalName === null) return null;

  return (
    <p className={cn("text-xs text-textSecondary", className)}>
      <span className="font-medium">Goal:</span> {goalName}
    </p>
  );
}
