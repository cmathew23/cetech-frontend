"use client";

import { Card } from "@/components/ui/Card";
import {
  formatSportMetricsStatusLabel,
  hasSportMetricsGolfEvidence,
  sportMetricsStatusVariant,
  type SportMetricEvidenceItem,
  type SportMetricGoalEvidenceGroup,
  type SportMetricsGolfWeeklySummary,
} from "@/lib/api/sportMetricsGolf";
import { formatDateOnly, formatDateOrDateTime } from "@/lib/dateTime";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge";

const ENUM_LABELS: Record<string, string> = {
  GOLF: "Golf",
  NO_DATA_LOGGED: "No Results Logged",
  EVIDENCE_LOGGED: "Results Logged",
  NEEDS_COACH_REVIEW: "Needs Coach Review",
  TARGET_MET: "Target Met",
  TARGET_NOT_MET: "Target Not Met",
  SIMULATOR: "Simulator",
  SIMULATOR_MANUAL: "Manual Simulator Entry",
  SIMULATOR_IMPORT: "Simulator Import",
  ATHLETE_MANUAL: "Athlete Entry",
  COACH_MANUAL: "Coach Entry",
  ON_COURSE: "On Course",
  PRACTICE_FACILITY: "Practice Facility",
  DRILL_RESULT: "Drill Result",
  ROUND_RESULT: "Round Result",
  PRACTICE_RESULT: "Practice Result",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickString(record: Record<string, unknown> | null, keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const text = readString(record[key]);
    if (text !== "") return text;
  }
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function humanizeSportMetricsEnum(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const upper = trimmed.toUpperCase();
  if (ENUM_LABELS[upper]) return ENUM_LABELS[upper];
  return trimmed
    .toLowerCase()
    .split("_")
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function hasAnySportMetricsRecords(
  summary: SportMetricsGolfWeeklySummary,
): boolean {
  return hasSportMetricsGolfEvidence(summary);
}

export function resolveSportMetricsTopStatus(summary: SportMetricsGolfWeeklySummary): {
  status: string;
  label: string;
  variant: StatusBadgeVariant;
} {
  if (hasAnySportMetricsRecords(summary)) {
    return {
      status: "EVIDENCE_LOGGED",
      label: formatSportMetricsStatusLabel("EVIDENCE_LOGGED"),
      variant: sportMetricsStatusVariant("EVIDENCE_LOGGED"),
    };
  }
  const status = summary.status.trim() !== "" ? summary.status : "NO_DATA_LOGGED";
  return {
    status,
    label: formatSportMetricsStatusLabel(status),
    variant: sportMetricsStatusVariant(status),
  };
}

export const GOAL_PROGRESS_SECTION_FALLBACK = "Goal Progress";
export const TRAINING_CONTEXT_SECTION_FALLBACK = "Training Context";
export const ADDITIONAL_SKILL_RESULTS_SECTION_TITLE = "Additional Skill Results";
export const ADDITIONAL_SKILL_WORK_SECTION_TITLE = "Additional Skill Work";

export type SportMetricsDisplayLabels = {
  goalSectionFallback: string;
  unlinkedSectionTitle: string;
  goalEmptyMessage: string;
  includeTechnicalDetailFields: boolean;
};

function evidenceItemHasTechnicalFields(item: SportMetricEvidenceItem): boolean {
  const raw = asRecord(item.raw);
  const valueJson = asRecord(raw?.valueJson) ?? raw;
  if (!valueJson) return false;

  if (readNumber(valueJson.successes) !== null) return true;
  if (readNumber(valueJson.successPercent) !== null) return true;
  if (readNumber(valueJson.successRate) !== null) return true;

  const provider = valueJson.provider;
  if (provider && typeof provider === "object") {
    const providerRecord = asRecord(provider);
    if (providerRecord && pickString(providerRecord, ["key", "providerKey", "id"])) {
      return true;
    }
  }

  return false;
}

function iterAllEvidenceItems(
  summary: SportMetricsGolfWeeklySummary,
): SportMetricEvidenceItem[] {
  const items: SportMetricEvidenceItem[] = [];
  for (const group of summary.goalEvidence) {
    items.push(...group.evidence);
  }
  items.push(...summary.unlinkedEvidence);
  return items;
}

export function summaryUsesTechnicalResultLabels(
  summary: SportMetricsGolfWeeklySummary,
): boolean {
  const items = iterAllEvidenceItems(summary);
  if (items.length === 0) return true;
  return items.some((item) => evidenceItemHasTechnicalFields(item));
}

export function resolveSportMetricsDisplayLabels(
  summary: SportMetricsGolfWeeklySummary,
): SportMetricsDisplayLabels {
  const technical = summaryUsesTechnicalResultLabels(summary);
  return {
    goalSectionFallback: technical
      ? GOAL_PROGRESS_SECTION_FALLBACK
      : TRAINING_CONTEXT_SECTION_FALLBACK,
    unlinkedSectionTitle: technical
      ? ADDITIONAL_SKILL_RESULTS_SECTION_TITLE
      : ADDITIONAL_SKILL_WORK_SECTION_TITLE,
    goalEmptyMessage: technical
      ? "No results logged for this goal yet."
      : "No training context logged for this goal yet.",
    includeTechnicalDetailFields: technical,
  };
}

export function resolveUnlinkedSectionTitle(
  summary: SportMetricsGolfWeeklySummary,
): string {
  return resolveSportMetricsDisplayLabels(summary).unlinkedSectionTitle;
}

/** @deprecated Use resolveUnlinkedSectionTitle(summary) for role-filtered payloads. */
export const UNLINKED_SKILL_EVIDENCE_SECTION_TITLE = ADDITIONAL_SKILL_RESULTS_SECTION_TITLE;

export function resolveGoalDisplayTitle(
  group: SportMetricGoalEvidenceGroup,
  labels: SportMetricsDisplayLabels,
): string {
  const parsedTitle = group.goalTitle.trim();
  if (parsedTitle !== "" && parsedTitle !== "Goal") {
    return parsedTitle;
  }

  const raw = asRecord(group.raw);
  const goal = asRecord(raw?.goal);
  const nestedTitle =
    pickString(goal, ["title", "goalTitle", "name", "label"]) ??
    pickString(raw, ["goalTitle", "title", "goalName", "name", "label"]);

  return nestedTitle ?? labels.goalSectionFallback;
}

export function resolveGoalGroupHeading(
  group: SportMetricGoalEvidenceGroup,
  labels: SportMetricsDisplayLabels,
): string {
  const title = resolveGoalDisplayTitle(group, labels);
  const fallbacks = new Set([
    labels.goalSectionFallback,
    GOAL_PROGRESS_SECTION_FALLBACK,
    TRAINING_CONTEXT_SECTION_FALLBACK,
    "Linked Goal",
    "Goal",
  ]);
  if (fallbacks.has(title)) {
    return labels.goalSectionFallback;
  }
  const prefix = labels.includeTechnicalDetailFields ? "Goal" : "Training";
  return `${prefix}: ${title}`;
}

export function resolveGoalSuccessCriteria(
  group: SportMetricGoalEvidenceGroup,
): string | null {
  const parsed = group.successCriteria?.trim() ?? "";
  if (parsed !== "") return parsed;

  const raw = asRecord(group.raw);
  const goal = asRecord(raw?.goal);
  return (
    pickString(goal, ["successCriteria", "criteria", "target"]) ??
    pickString(raw, ["successCriteria", "criteria", "target"])
  );
}

export function resolveEvidenceDisplayTitle(item: SportMetricEvidenceItem): string {
  const raw = asRecord(item.raw);
  const prescribed = asRecord(raw?.prescribedContextJson);
  const valueJson = asRecord(raw?.valueJson);

  const fromPrescribed = pickString(prescribed, ["label"]);
  if (fromPrescribed) return fromPrescribed;

  const fromValue = pickString(valueJson, ["label"]);
  if (fromValue) return fromValue;

  const metricType = pickString(raw, ["metricType"]);
  if (metricType) {
    return humanizeSportMetricsEnum(metricType) ?? metricType;
  }

  const parsedLabel = item.label.trim();
  if (parsedLabel !== "" && parsedLabel !== "Evidence" && parsedLabel !== "Result") {
    return parsedLabel;
  }

  return "Result";
}

function formatCountLabel(label: string, value: number): string {
  return `${label}: ${Number.isInteger(value) ? String(value) : value.toFixed(1)}`;
}

function formatPercentLabel(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded.toFixed(1)}%`;
}

export function buildEvidenceDetailLines(
  item: SportMetricEvidenceItem,
  options?: { includeTechnicalDetailFields?: boolean },
): string[] {
  const raw = asRecord(item.raw);
  const valueJson = asRecord(raw?.valueJson) ?? raw;
  const prescribed = asRecord(raw?.prescribedContextJson);
  if (!valueJson && !prescribed) return [];

  const includeTechnical = options?.includeTechnicalDetailFields !== false;
  const lines: string[] = [];
  const attempts = readNumber(valueJson?.attempts);
  const successes = includeTechnical ? readNumber(valueJson?.successes) : null;
  let successPercent = includeTechnical ? readNumber(valueJson?.successPercent) : null;
  if (includeTechnical && successPercent === null) {
    successPercent = readNumber(valueJson?.successRate);
  }

  if (attempts !== null) {
    lines.push(formatCountLabel("Attempts", attempts));
  }

  const durationMinutes = readNumber(valueJson?.durationMinutes ?? prescribed?.durationMinutes);
  if (durationMinutes !== null) {
    lines.push(formatCountLabel("Duration (min)", durationMinutes));
  }

  const reps = pickString(prescribed, ["reps"]) ?? pickString(valueJson ?? {}, ["reps"]);
  if (reps) {
    lines.push(`Reps: ${reps}`);
  }

  if (successes !== null) {
    lines.push(formatCountLabel("Successes", successes));
  }
  if (
    includeTechnical &&
    successPercent === null &&
    attempts !== null &&
    attempts > 0 &&
    successes !== null
  ) {
    successPercent = (successes / attempts) * 100;
  }
  if (successPercent !== null) {
    lines.push(`Success Rate: ${formatPercentLabel(successPercent)}`);
  }

  if (!includeTechnical) {
    return lines;
  }

  const holesPlayed = readNumber(valueJson?.holesPlayed);
  if (holesPlayed !== null) {
    lines.push(formatCountLabel("Holes Played", holesPlayed));
  }

  if (!valueJson) return lines;

  const score = readNumber(valueJson.score);
  if (score !== null) {
    lines.push(formatCountLabel("Score", score));
  }

  const par = readNumber(valueJson.par);
  if (par !== null) {
    lines.push(formatCountLabel("Par", par));
  }

  const putts = readNumber(valueJson.putts);
  if (putts !== null) {
    lines.push(formatCountLabel("Putts", putts));
  }

  const fairwaysHit = readNumber(valueJson.fairwaysHit);
  const fairwaysPossible = readNumber(valueJson.fairwaysPossible);
  if (fairwaysHit !== null && fairwaysPossible !== null) {
    lines.push(`Fairways: ${fairwaysHit}/${fairwaysPossible}`);
  } else if (fairwaysHit !== null) {
    lines.push(formatCountLabel("Fairways Hit", fairwaysHit));
  }

  const greensInRegulation = readNumber(valueJson.greensInRegulation);
  const girPossible = readNumber(valueJson.girPossible);
  if (greensInRegulation !== null && girPossible !== null) {
    lines.push(`GIR: ${greensInRegulation}/${girPossible}`);
  } else if (greensInRegulation !== null) {
    lines.push(formatCountLabel("Greens In Regulation", greensInRegulation));
  }

  const penalties = readNumber(valueJson.penalties);
  if (penalties !== null) {
    lines.push(formatCountLabel("Penalties", penalties));
  }

  const provider = asRecord(valueJson.provider);
  const providerKey = pickString(provider, ["key", "providerKey", "id"]);
  if (providerKey) {
    lines.push(`Provider: ${providerKey}`);
  }

  return lines;
}

function resolveEvidenceEnvironment(item: SportMetricEvidenceItem): string | null {
  const raw = asRecord(item.raw);
  const environment =
    pickString(raw, ["environment"]) ?? pickString(asRecord(raw?.valueJson), ["environment"]);
  return humanizeSportMetricsEnum(environment);
}

function resolveEvidenceSource(item: SportMetricEvidenceItem): string | null {
  const raw = asRecord(item.raw);
  const source =
    pickString(raw, ["source"]) ?? pickString(asRecord(raw?.valueJson), ["source"]);
  return humanizeSportMetricsEnum(source);
}

function resolveGroupStatusBadge(group: SportMetricGoalEvidenceGroup): {
  label: string;
  variant: StatusBadgeVariant;
} | null {
  if (group.evidence.length === 0) return null;

  return {
    label: formatSportMetricsStatusLabel("EVIDENCE_LOGGED"),
    variant: sportMetricsStatusVariant("EVIDENCE_LOGGED"),
  };
}

function EvidenceMeta({
  environment,
  source,
  occurredAt,
}: {
  environment: string | null;
  source: string | null;
  occurredAt: string | null;
}) {
  const parts = [
    environment,
    source,
    occurredAt ? formatDateOrDateTime(occurredAt, occurredAt) : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;
  return <p className="text-[11px] text-textMuted">{parts.join(" · ")}</p>;
}

function EvidenceRow({
  item,
  includeTechnicalDetailFields,
}: {
  item: SportMetricEvidenceItem;
  includeTechnicalDetailFields: boolean;
}) {
  const title = resolveEvidenceDisplayTitle(item);
  const detailLines = buildEvidenceDetailLines(item, { includeTechnicalDetailFields });
  const notes = item.notes?.trim() ?? "";

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-textPrimary">{title}</p>
          <EvidenceMeta
            environment={resolveEvidenceEnvironment(item)}
            source={resolveEvidenceSource(item)}
            occurredAt={item.occurredAt}
          />
          {detailLines.length > 0 ? (
            <p className="text-sm text-textSecondary">{detailLines.join(" · ")}</p>
          ) : null}
          {notes !== "" ? (
            <p className="text-xs text-textSecondary">{notes}</p>
          ) : null}
        </div>
        {item.status ? (
          <StatusBadge variant={sportMetricsStatusVariant(item.status)}>
            {formatSportMetricsStatusLabel(item.status)}
          </StatusBadge>
        ) : null}
      </div>
    </div>
  );
}

function GoalEvidenceBlock({
  group,
  labels,
}: {
  group: SportMetricGoalEvidenceGroup;
  labels: SportMetricsDisplayLabels;
}) {
  const goalHeading = resolveGoalGroupHeading(group, labels);
  const successCriteria = resolveGoalSuccessCriteria(group);
  const statusBadge = resolveGroupStatusBadge(group);

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-textPrimary">{goalHeading}</p>
          {successCriteria ? (
            <p className="text-xs text-textSecondary">
              Success criteria: {successCriteria}
            </p>
          ) : null}
        </div>
        {statusBadge ? (
          <StatusBadge variant={statusBadge.variant}>{statusBadge.label}</StatusBadge>
        ) : null}
      </div>

      {group.evidence.length > 0 ? (
        <div className="space-y-2">
          {group.evidence.map((item, index) => (
            <EvidenceRow
              key={item.id ?? `${group.goalId ?? goalHeading}-${index}`}
              item={item}
              includeTechnicalDetailFields={labels.includeTechnicalDetailFields}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-textSecondary">
          {labels.goalEmptyMessage}
        </p>
      )}
    </div>
  );
}

export function SportMetricsEvidenceCards({
  summary,
}: {
  summary: SportMetricsGolfWeeklySummary;
}) {
  const topStatus = resolveSportMetricsTopStatus(summary);
  const labels = resolveSportMetricsDisplayLabels(summary);

  return (
    <Card
      title="SPORT Metrics"
      subtitle={`Sport: Golf · ${formatDateOnly(summary.weekStartDate, summary.weekStartDate)} – ${formatDateOnly(summary.weekEndDate, summary.weekEndDate)}`}
      accent={false}
      padding="compact"
      className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
      actions={
        <StatusBadge variant={topStatus.variant}>{topStatus.label}</StatusBadge>
      }
    >
      <div className="space-y-4">
        {summary.goalEvidence.length > 0 ? (
          <div className="space-y-3">
            {summary.goalEvidence.map((group, index) => (
              <GoalEvidenceBlock
                key={group.goalId ?? `${resolveGoalDisplayTitle(group, labels)}-${index}`}
                group={group}
                labels={labels}
              />
            ))}
          </div>
        ) : null}

        {summary.unlinkedEvidence.length > 0 ? (
          <div className="space-y-3 rounded-md border border-dashed border-border bg-surface/40 p-4">
            <div>
              <p className="text-sm font-semibold text-textPrimary">
                {labels.unlinkedSectionTitle}
              </p>
            </div>
            <div className="space-y-2">
              {summary.unlinkedEvidence.map((item, index) => (
                <EvidenceRow
                  key={item.id ?? `unlinked-${index}`}
                  item={item}
                  includeTechnicalDetailFields={labels.includeTechnicalDetailFields}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
