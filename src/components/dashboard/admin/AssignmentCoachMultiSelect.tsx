"use client";

import type { CoachAssignmentOption } from "@/types/academyAdmin.types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export type AssignmentCoachMultiSelectProps = {
  id: string;
  coachOptions: CoachAssignmentOption[];
  selectedCoachProfileIds: string[];
  disabled: boolean;
  getOptionLines: (
    opt: CoachAssignmentOption,
  ) => { primary: string; secondary: string };
  onToggle: (coachProfileId: string, checked: boolean) => void;
};

/**
 * Checkbox list for assigning one athlete to multiple coaches (Admin Assignments form).
 */
export function AssignmentCoachMultiSelect({
  id,
  coachOptions,
  selectedCoachProfileIds,
  disabled,
  getOptionLines,
  onToggle,
}: AssignmentCoachMultiSelectProps) {
  const selectedSet = useMemo(
    () => new Set(selectedCoachProfileIds),
    [selectedCoachProfileIds],
  );

  return (
    <div
      id={id}
      role="group"
      aria-label="Select coaches"
      className="rounded-lg border border-border bg-card"
    >
      {coachOptions.length === 0 ? (
        <p className="px-3 py-3 text-sm text-textSecondary">
          No coaches available.
        </p>
      ) : (
        <div className="max-h-60 divide-y divide-border overflow-y-auto">
          {coachOptions.map((opt) => {
            const checked = selectedSet.has(opt.coachProfileId);
            const { primary, secondary } = getOptionLines(opt);
            return (
              <label
                key={opt.coachProfileId}
                className={cn(
                  "flex cursor-pointer gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50/70",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) =>
                    onToggle(opt.coachProfileId, e.target.checked)
                  }
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-textPrimary">
                    {primary}
                  </span>
                  {secondary.trim() !== "" ? (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {secondary}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
