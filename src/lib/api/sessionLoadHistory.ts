import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const SESSION_LOAD_HISTORY_TIMEOUT_MS = 240_000;

export const SANDC_SESSION_LOAD_HISTORY_EMPTY_MESSAGE =
  "Historical comparison will appear after the first completed S&C week.";

export type SandCSessionLoadWeek = {
  weekStart: string;
  weekEnd: string;
  averageSessionLoad: number | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readAverageSessionLoad(record: Record<string, unknown>): number | null {
  const nestedContext = asRecord(record.context);
  const domainRecord = asRecord(
    asRecord(record.domains)?.STRENGTH_CONDITIONING,
  );
  const domainContext = asRecord(domainRecord?.context);
  return readNullableNumber(
    record.averageSessionLoad ??
      record.averageWeeklySessionLoad ??
      nestedContext?.averageSessionLoad ??
      domainRecord?.averageSessionLoad ??
      domainContext?.averageSessionLoad,
  );
}

function parseHistoryWeekList(payload: unknown): unknown[] {
  const adapted = adaptBackendSuccess(payload);
  if (Array.isArray(adapted)) return adapted;

  const record = asRecord(adapted);
  if (!record) return [];

  if (Array.isArray(record.weeks)) return record.weeks;
  if (Array.isArray(record.history)) return record.history;
  if (Array.isArray(record.summaries)) return record.summaries;
  if (Array.isArray(record.data)) return record.data;

  const nested = asRecord(record.data);
  if (!nested) return [];
  if (Array.isArray(nested.weeks)) return nested.weeks;
  if (Array.isArray(nested.history)) return nested.history;
  if (Array.isArray(nested.summaries)) return nested.summaries;
  return [];
}

export function parseSandCSessionLoadWeek(
  value: unknown,
): SandCSessionLoadWeek | null {
  const record = asRecord(value);
  if (!record) return null;
  const weekStart =
    readString(record.weekStart) || readString(record.weekStartDate);
  const weekEnd = readString(record.weekEnd) || readString(record.weekEndDate);
  if (weekStart === "" || weekEnd === "") return null;
  return {
    weekStart,
    weekEnd,
    averageSessionLoad: readAverageSessionLoad(record),
  };
}

export function parseSandCSessionLoadHistoryPayload(
  payload: unknown,
): SandCSessionLoadWeek[] {
  return parseHistoryWeekList(payload).reduce<SandCSessionLoadWeek[]>(
    (weeks, value) => {
      const parsed = parseSandCSessionLoadWeek(value);
      if (parsed) weeks.push(parsed);
      return weeks;
    },
    [],
  );
}

export function sessionLoadHistoryWeekKey(
  week: Pick<SandCSessionLoadWeek, "weekStart" | "weekEnd">,
): string {
  return `${week.weekStart}|${week.weekEnd}`;
}

export function formatAverageSessionLoadAu(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const rounded = Number.isInteger(value)
    ? value
    : Math.round(value * 10) / 10;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return `${normalized} AU`;
}

export function formatAverageSessionLoadDifference(
  current: number | null,
  historical: number | null,
): string {
  if (current === null || historical === null) return "—";
  const raw = current - historical;
  if (raw === 0) return `→ ${formatAverageSessionLoadAu(0)}`;
  const arrow = raw > 0 ? "↑" : "↓";
  return `${arrow} ${formatAverageSessionLoadAu(Math.abs(raw))}`;
}

export async function fetchSandCSessionLoadHistory(params: {
  entityId: string;
  athleteId: string;
}): Promise<SandCSessionLoadWeek[]> {
  const raw = await apiRequest(
    paths.entities.athleteStrengthConditioningSessionLoadHistory(
      params.entityId,
      params.athleteId,
    ),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: SESSION_LOAD_HISTORY_TIMEOUT_MS,
    },
  );
  return parseSandCSessionLoadHistoryPayload(raw);
}
