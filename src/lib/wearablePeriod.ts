import { getLocalDateKey, normalizeDateOnlyKey, parseToLocalDate } from "@/lib/dateTime";

export type WearablePeriodDays = 7 | 15 | 30;

export type WearableDateRange = {
  startDate: string;
  endDate: string;
};

export type WearableDateRangeMode = "plan" | "rolling";

export type ResolvedWearableQueryRange = WearableDateRange & {
  mode: WearableDateRangeMode;
};

function shiftDateOnly(dateKey: string, daysDelta: number): string {
  const parsed = parseToLocalDate(dateKey);
  if (!parsed) return dateKey;
  const shifted = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  shifted.setDate(shifted.getDate() + daysDelta);
  return getLocalDateKey(shifted);
}

export function normalizeWearableDateKey(
  value: string | null | undefined,
): string | null {
  return normalizeDateOnlyKey(value);
}

export function countInclusiveCalendarDays(
  startDate: string,
  endDate: string,
): number | null {
  const start = parseToLocalDate(startDate);
  const end = parseToLocalDate(endDate);
  if (!start || !end) return null;
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (endMs < startMs) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((endMs - startMs) / dayMs) + 1;
}

export function inferWearablePeriodDaysFromPlanRange(
  startDate: string,
  endDate: string,
): WearablePeriodDays | null {
  const days = countInclusiveCalendarDays(startDate, endDate);
  if (days === 7 || days === 15 || days === 30) return days;
  return null;
}

export function resolveWearablePlanDateRange(
  planStartDate: string,
  planEndDate: string,
): ResolvedWearableQueryRange | null {
  const startDate = normalizeWearableDateKey(planStartDate);
  const endDate = normalizeWearableDateKey(planEndDate);
  if (startDate === null || endDate === null) return null;
  if (endDate < startDate) return null;
  return { startDate, endDate, mode: "plan" };
}

export function resolveWearableRollingDateRange(
  days: WearablePeriodDays,
  anchorEndDate?: string,
): ResolvedWearableQueryRange {
  const normalizedDays = days === 15 || days === 30 ? days : 7;
  const endDate = normalizeWearableDateKey(anchorEndDate) ?? getLocalDateKey();
  const startDate = shiftDateOnly(endDate, -(normalizedDays - 1));
  return { startDate, endDate, mode: "rolling" };
}

export function resolveWearableQueryRange(input: {
  planStartDate?: string | null;
  planEndDate?: string | null;
  rollingDays?: WearablePeriodDays;
  anchorEndDate?: string;
}): ResolvedWearableQueryRange | null {
  const planRange = resolveWearablePlanDateRange(
    input.planStartDate ?? "",
    input.planEndDate ?? "",
  );
  if (planRange) return planRange;
  return resolveWearableRollingDateRange(
    input.rollingDays ?? 7,
    input.anchorEndDate,
  );
}

/** @deprecated Use resolveWearableRollingDateRange for rolling-only callers. */
export function resolveWearableDateRange(
  days: WearablePeriodDays,
  anchorEndDate?: string,
): WearableDateRange {
  const rolling = resolveWearableRollingDateRange(days, anchorEndDate);
  return { startDate: rolling.startDate, endDate: rolling.endDate };
}
