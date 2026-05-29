import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

const WEARABLE_SUMMARY_TIMEOUT_MS = 240_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
  const text = readString(value);
  return text === "" ? null : text;
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readNonNegInt(value: unknown): number | null {
  const parsed = readFiniteNumber(value);
  if (parsed === null || parsed < 0) return null;
  return Math.floor(parsed);
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function toDisplayLabel(rawKey: string): string {
  return rawKey
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type WearableMetricValue =
  | {
      kind: "number";
      label: string;
      value: number;
    }
  | {
      kind: "string";
      label: string;
      value: string;
    }
  | {
      kind: "boolean";
      label: string;
      value: boolean;
    };

export type WearableMetricGroup = {
  key: string;
  title: string;
  sampleCount: number | null;
  status: string | null;
  latestAt: string | null;
  metrics: WearableMetricValue[];
  hasData: boolean;
  source: Record<string, unknown>;
};

export type WearableSummary = {
  athleteId: string;
  startDate: string;
  endDate: string;
  providerName: string | null;
  connectionStatus: string | null;
  syncStatus: string | null;
  latestSyncAt: string | null;
  hasData: boolean;
  groups: {
    connectionSync: WearableMetricGroup;
    recoveryReadiness: WearableMetricGroup;
    activityTrainingLoad: WearableMetricGroup;
    cardiovascularFitness: WearableMetricGroup;
    workoutPerformance: WearableMetricGroup;
    movementQuality: WearableMetricGroup;
    bodyHealthMetrics: WearableMetricGroup;
    metadataProviderData: WearableMetricGroup;
  };
};

const GROUP_SPECS = [
  {
    key: "connectionSync",
    title: "Connection / Sync Status",
    aliases: [
      "connectionSync",
      "connection",
      "sync",
      "connectionStatus",
      "syncStatus",
      "connectionAndSync",
    ],
  },
  {
    key: "recoveryReadiness",
    title: "Recovery & Readiness",
    aliases: ["recoveryReadiness", "recovery", "readiness"],
  },
  {
    key: "activityTrainingLoad",
    title: "Activity & Training Load",
    aliases: ["activityTrainingLoad", "activity", "trainingLoad", "activityLoad"],
  },
  {
    key: "cardiovascularFitness",
    title: "Cardiovascular Fitness",
    aliases: ["cardiovascularFitness", "cardiovascular", "fitness", "cardio"],
  },
  {
    key: "workoutPerformance",
    title: "Workout Performance",
    aliases: ["workoutPerformance", "workout", "performance"],
  },
  {
    key: "movementQuality",
    title: "Movement Quality",
    aliases: ["movementQuality", "movement", "mobility"],
  },
  {
    key: "bodyHealthMetrics",
    title: "Body & Health Metrics",
    aliases: ["bodyHealthMetrics", "bodyHealth", "body", "healthMetrics", "health"],
  },
  {
    key: "metadataProviderData",
    title: "Metadata / Provider Data",
    aliases: [
      "metadataProviderData",
      "metadata",
      "providerData",
      "provider",
      "providerMetadata",
    ],
  },
] as const;

type GroupSpec = (typeof GROUP_SPECS)[number];
type GroupKey = GroupSpec["key"];

function looksLikeWearableSummaryRecord(record: Record<string, unknown>): boolean {
  return (
    "groups" in record ||
    "wearables" in record ||
    "startDate" in record ||
    "endDate" in record ||
    "providerName" in record ||
    "athleteId" in record
  );
}

function unwrapWearableSummaryPayload(payload: unknown): Record<string, unknown> {
  let current: unknown = adaptBackendSuccess(payload);

  for (let depth = 0; depth < 5; depth += 1) {
    const record = asRecord(current);
    if (!record) return {};
    if (looksLikeWearableSummaryRecord(record)) return record;

    const nested = record.data ?? record.summary ?? record.wearableSummary ?? record.wearables;
    if (nested !== undefined && nested !== null) {
      current = nested;
      continue;
    }
    return record;
  }

  return asRecord(current) ?? {};
}

function parseMetricValues(raw: Record<string, unknown>): WearableMetricValue[] {
  const metrics: WearableMetricValue[] = [];

  for (const [rawKey, rawValue] of Object.entries(raw)) {
    if (
      rawKey === "sampleCount" ||
      rawKey === "count" ||
      rawKey === "status" ||
      rawKey === "syncStatus" ||
      rawKey === "connectionStatus" ||
      rawKey === "latestAt" ||
      rawKey === "latestSyncAt" ||
      rawKey === "recordedAt" ||
      rawKey === "timestamp" ||
      rawKey === "meta" ||
      rawKey === "metadata" ||
      rawKey === "providerData" ||
      rawKey === "noData" ||
      rawKey === "periodStart" ||
      rawKey === "periodEnd" ||
      rawKey === "startDate" ||
      rawKey === "endDate"
    ) {
      continue;
    }

    if (Array.isArray(rawValue)) continue;

    if (typeof rawValue === "string") {
      const text = rawValue.trim();
      if (text !== "") {
        metrics.push({ kind: "string", label: toDisplayLabel(rawKey), value: text });
      }
      continue;
    }

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      metrics.push({ kind: "number", label: toDisplayLabel(rawKey), value: rawValue });
      continue;
    }

    if (typeof rawValue === "boolean") {
      metrics.push({ kind: "boolean", label: toDisplayLabel(rawKey), value: rawValue });
      continue;
    }
  }

  return metrics.slice(0, 8);
}

function parseMetricGroup(spec: GroupSpec, raw: unknown): WearableMetricGroup {
  const row = asRecord(raw) ?? {};
  const status =
    readNullableString(row.status) ??
    readNullableString(row.syncStatus) ??
    readNullableString(row.connectionStatus);
  const latestAt =
    readNullableString(row.latestAt) ??
    readNullableString(row.latestSyncAt) ??
    readNullableString(row.recordedAt) ??
    readNullableString(row.timestamp);
  const sampleCount = readNonNegInt(row.sampleCount) ?? readNonNegInt(row.count);
  const metrics = parseMetricValues(row);

  return {
    key: spec.key,
    title: spec.title,
    sampleCount,
    status,
    latestAt,
    metrics,
    hasData:
      readBoolean(row.noData) === true
        ? false
        : metrics.length > 0 ||
          sampleCount !== null ||
          status !== null ||
          latestAt !== null,
    source: row,
  };
}

function resolveGroupSource(
  spec: GroupSpec,
  groupsRecord: Record<string, unknown>,
  topLevelRecord: Record<string, unknown>,
): unknown {
  for (const alias of spec.aliases) {
    if (alias in groupsRecord) return groupsRecord[alias];
  }
  for (const alias of spec.aliases) {
    if (alias in topLevelRecord) return topLevelRecord[alias];
  }
  return null;
}

export function parseWearableSummaryPayload(payload: unknown): WearableSummary {
  const record = unwrapWearableSummaryPayload(payload);
  const groupsRecord =
    asRecord(record.groups) ??
    asRecord(record.summaryGroups) ??
    asRecord(record.sections) ??
    {};

  const parsedGroups = GROUP_SPECS.reduce<Record<GroupKey, WearableMetricGroup>>(
    (acc, spec) => {
      acc[spec.key] = parseMetricGroup(
        spec,
        resolveGroupSource(spec, groupsRecord, record),
      );
      return acc;
    },
    {} as Record<GroupKey, WearableMetricGroup>,
  );

  const hasData =
    parsedGroups.connectionSync.hasData ||
    parsedGroups.recoveryReadiness.hasData ||
    parsedGroups.activityTrainingLoad.hasData ||
    parsedGroups.cardiovascularFitness.hasData ||
    parsedGroups.workoutPerformance.hasData ||
    parsedGroups.movementQuality.hasData ||
    parsedGroups.bodyHealthMetrics.hasData ||
    parsedGroups.metadataProviderData.hasData;

  return {
    athleteId: readString(record.athleteId),
    startDate: readString(record.startDate),
    endDate: readString(record.endDate),
    providerName:
      readNullableString(record.providerName) ??
      readNullableString(record.provider) ??
      readNullableString(record.wearableProvider),
    connectionStatus: readNullableString(record.connectionStatus),
    syncStatus: readNullableString(record.syncStatus),
    latestSyncAt:
      readNullableString(record.latestSyncAt) ?? readNullableString(record.lastSyncAt),
    hasData,
    groups: parsedGroups,
  };
}

export async function fetchWearableSummary(params: {
  entityId: string;
  athleteId: string;
  startDate: string;
  endDate: string;
}): Promise<WearableSummary> {
  const raw = await apiRequest(
    paths.entities.athleteWearableSummary(params.entityId, params.athleteId, {
      startDate: params.startDate,
      endDate: params.endDate,
    }),
    {
      method: "GET",
      cache: "no-store",
      timeoutMs: WEARABLE_SUMMARY_TIMEOUT_MS,
    },
  );

  return parseWearableSummaryPayload(raw);
}

export function hasWearableSummaryData(
  summary: WearableSummary | null | undefined,
): boolean {
  return summary?.hasData === true;
}

export function formatWearableMetricValue(value: WearableMetricValue): string {
  if (value.kind === "boolean") return value.value ? "Yes" : "No";
  if (value.kind === "number") {
    return Number.isInteger(value.value)
      ? value.value.toLocaleString("en-US")
      : value.value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return value.value;
}

export function readWearableSummaryStatus(summary: WearableSummary): string | null {
  return (
    summary.connectionStatus ??
    summary.syncStatus ??
    summary.groups.connectionSync.status ??
    null
  );
}

export function readWearableSummaryProvider(summary: WearableSummary): string | null {
  return summary.providerName ?? summary.groups.metadataProviderData.status ?? null;
}

export function readWearableSummaryConnected(summary: WearableSummary): boolean | null {
  return (
    readBoolean(summary.connectionStatus) ??
    readBoolean(summary.groups.connectionSync.status) ??
    null
  );
}
