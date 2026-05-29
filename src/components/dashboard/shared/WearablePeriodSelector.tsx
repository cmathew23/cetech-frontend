"use client";

import type { WearablePeriodDays } from "@/lib/wearablePeriod";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: WearablePeriodDays; label: string }> = [
  { value: 7, label: "7 days" },
  { value: 15, label: "15 days" },
  { value: 30, label: "30 days" },
];

export function WearablePeriodSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: WearablePeriodDays;
  onChange: (value: WearablePeriodDays) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Wearable period days"
      className="flex flex-wrap gap-2"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => {
              if (!disabled && option.value !== value) onChange(option.value);
            }}
            className={cn(
              "inline-flex min-w-[6rem] items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition",
              disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
              selected
                ? "border-primary bg-primaryLight text-primaryDark shadow-sm"
                : "border-border bg-bg text-textPrimary hover:bg-card hover:shadow-sm",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
