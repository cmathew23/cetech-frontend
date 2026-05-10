"use client";

import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAthleteWeeklyPlanJournal,
  type AthleteWeeklyPlanJournal,
} from "@/lib/api/coachAthletePlanningReadiness";
import { formatDateOnly } from "@/lib/dateTime";
import { formatEnumeratedLabel, toTitleCaseInput } from "@/lib/textFormat";
import { useCallback, useEffect, useMemo, useState } from "react";

type ViewState =
  | { phase: "loading" }
  | { phase: "ready"; journal: AthleteWeeklyPlanJournal }
  | { phase: "error"; message: string };

type Scalar = string | number | boolean;

const DOMAIN_SECTIONS = [
  {
    key: "SKILLS",
    label: "Skills",
    sectionTitle: "Skills",
    emptyMessage: "No skills session released for this day.",
  },
  {
    key: "NUTRITION",
    label: "Nutrition",
    sectionTitle: "Nutrition",
    emptyMessage: "No nutrition plan released for this day.",
  },
  {
    key: "S_AND_C",
    label: "Strength & Conditioning",
    sectionTitle: "Strength & Conditioning",
    emptyMessage: "No S&C session released for this day.",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): value is Scalar {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isScalarArray(value: unknown): value is Scalar[] {
  return Array.isArray(value) && value.every((item) => isScalar(item));
}

function formatFieldLabel(key: string): string {
  const withSpaces = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
  return withSpaces === "" ? "Field" : toTitleCaseInput(withSpaces);
}

function formatScalarValue(value: Scalar): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "—";
  const trimmed = value.trim();
  if (trimmed === "") return "—";
  const looksLikeDate = /^\d{4}-\d{2}-\d{2}(?:[T ][^ ]+)?/.test(trimmed);
  if (looksLikeDate) {
    const formatted = formatDateOnly(trimmed, "");
    if (formatted !== "") return formatted;
  }
  if (/^[A-Z0-9_]+$/.test(trimmed)) return formatEnumeratedLabel(trimmed);
  return trimmed;
}

function joinScalarArray(values: Scalar[]): string {
  return values
    .map((value) => formatScalarValue(value))
    .filter((value) => value !== "—")
    .join(", ");
}

function summarizeUnknown(value: unknown): string | null {
  if (isScalar(value)) return formatScalarValue(value);
  if (isScalarArray(value)) {
    const joined = joinScalarArray(value);
    return joined !== "" ? joined : null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} item(s)` : null;
  }
  if (!isRecord(value)) return null;

  const entries = Object.entries(value);
  for (const [key, fieldValue] of entries) {
    if (key === "id") continue;
    if (isScalar(fieldValue)) {
      const formatted = formatScalarValue(fieldValue);
      if (formatted !== "—") return formatted;
    }
  }
  return null;
}

function collectPrimaryLines(record: Record<string, unknown>): string[] {
  const keys = [
    "title",
    "name",
    "label",
    "summary",
    "description",
    "objective",
    "notes",
    "mealType",
    "sessionType",
    "itemType",
  ];
  const lines: string[] = [];
  for (const key of keys) {
    const value = record[key];
    const summary = summarizeUnknown(value);
    if (summary && !lines.includes(summary)) {
      lines.push(summary);
    }
  }
  return lines;
}

function collectDetailRows(record: Record<string, unknown>): Array<{ label: string; value: string }> {
  const priority = [
    "plannedStartTime",
    "plannedEndTime",
    "plannedDurationMinutes",
    "durationMinutes",
    "intensity",
    "estimatedDailyCalories",
    "targetCalorieMin",
    "targetCalorieMax",
    "calorieAdequacyStatus",
    "estimatedProteinGrams",
    "estimatedCarbohydrateGrams",
    "estimatedFatGrams",
    "estimatedFiberGrams",
    "macroAdequacyStatus",
  ];
  const seen = new Set<string>();
  const rows: Array<{ label: string; value: string }> = [];

  function pushRow(key: string, rawValue: unknown) {
    if (seen.has(key) || key === "id") return;
    let value: string | null = null;
    if (isScalar(rawValue)) {
      const formatted = formatScalarValue(rawValue);
      value = formatted !== "—" ? formatted : null;
    } else if (isScalarArray(rawValue)) {
      const joined = joinScalarArray(rawValue);
      value = joined !== "" ? joined : null;
    }
    if (!value) return;
    seen.add(key);
    rows.push({ label: formatFieldLabel(key), value });
  }

  for (const key of priority) {
    pushRow(key, record[key]);
  }
  for (const [key, value] of Object.entries(record)) {
    pushRow(key, value);
  }
  return rows.slice(0, 8);
}

function itemHeading(item: unknown, index: number): string {
  if (isScalar(item)) {
    const value = formatScalarValue(item);
    return value === "—" ? `Entry ${index + 1}` : value;
  }
  if (isRecord(item)) {
    const primaryLines = collectPrimaryLines(item);
    if (primaryLines.length > 0) return primaryLines[0];
  }
  return `Entry ${index + 1}`;
}

function renderJournalItem(item: unknown, index: number) {
  if (isScalar(item)) {
    return (
      <Card key={`scalar-${index}`} accent={false} padding="compact" className="bg-bg">
        <p className="text-sm text-textPrimary">{formatScalarValue(item)}</p>
      </Card>
    );
  }

  if (!isRecord(item)) {
    return (
      <Card key={`unknown-${index}`} accent={false} padding="compact" className="bg-bg">
        <p className="text-sm text-textSecondary">Plan details are available for this entry.</p>
      </Card>
    );
  }

  const primaryLines = collectPrimaryLines(item);
  const detailRows = collectDetailRows(item);

  return (
    <Card key={`record-${index}`} accent={false} padding="compact" className="bg-bg">
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-textPrimary">{itemHeading(item, index)}</p>
          {primaryLines.slice(1, 3).map((line) => (
            <p key={line} className="text-sm text-textSecondary">
              {line}
            </p>
          ))}
        </div>
        {detailRows.length > 0 ? (
          <dl className="space-y-1">
            {detailRows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="grid grid-cols-[minmax(0,160px)_1fr] gap-2 text-sm">
                <dt className="font-medium text-textSecondary">{row.label}</dt>
                <dd className="min-w-0 break-words text-textPrimary">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-textSecondary">
            Plan details are available for this entry.
          </p>
        )}
      </div>
    </Card>
  );
}

function domainBadge(status: "RELEASED" | "NOT_RELEASED") {
  if (status === "RELEASED") {
    return <StatusBadge variant="success">Released</StatusBadge>;
  }
  return <StatusBadge variant="neutral">Not Released</StatusBadge>;
}

export function AthleteWeeklyPlanJournalPageContent() {
  const { accessGateReady, accessContext, user } = useAuth();
  const entityId = useMemo(
    () => accessContext?.academy.trainingEntityId?.trim() ?? "",
    [accessContext?.academy.trainingEntityId],
  );
  const athleteId = useMemo(
    () => accessContext?.user.userId?.trim() ?? user?.id?.trim() ?? "",
    [accessContext?.user.userId, user?.id],
  );
  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const retryLoadJournal = useCallback(() => {
    setState({ phase: "loading" });
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!accessGateReady || entityId === "" || athleteId === "") return;
    let cancelled = false;
    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, athleteId);
        if (!cancelled) {
          setState({ phase: "ready", journal });
        }
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error
          ? e.message
          : "Could not load your weekly plan journal. Please try again.";
        setState({ phase: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessGateReady, athleteId, entityId, reloadKey]);

  const isLoading = !accessGateReady || state.phase === "loading";
  const journal = state.phase === "ready" ? state.journal : null;
  const weekSubtitle = journal
    ? `${formatDateOnly(journal.weekStartDate)} - ${formatDateOnly(journal.weekEndDate)}`
    : "Review the released sessions and plan items for your current training week.";
  const allDomainsNotReleased = journal
    ? DOMAIN_SECTIONS.every((domain) => journal.domains[domain.key].status === "NOT_RELEASED")
    : false;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Weekly Plan Journal"
        subtitle={weekSubtitle}
        trailing={<AthleteHeaderIdentityMetadata />}
      />
      {isLoading ? (
        <DashboardCardShell title="Weekly Plan Journal" className="min-h-[220px]">
          <div className="flex min-h-[120px] items-center justify-center text-sm text-textSecondary">
            Loading weekly plan journal…
          </div>
        </DashboardCardShell>
      ) : entityId === "" || athleteId === "" ? (
        <DashboardCardShell title="Weekly Plan Journal">
          <Alert variant="warning">
            Your athlete context is not available yet. Please try again shortly.
          </Alert>
        </DashboardCardShell>
      ) : state.phase === "error" ? (
        <DashboardCardShell title="Weekly Plan Journal">
          <div className="space-y-3">
            <Alert variant="danger">{state.message}</Alert>
            <div>
              <Button type="button" variant="secondary" onClick={retryLoadJournal}>
                Retry
              </Button>
            </div>
          </div>
        </DashboardCardShell>
      ) : (
        <>
          {(() => {
            const readyJournal = state.journal;
            return (
              <>
          <DashboardCardShell title="Current Week" subtitle={weekSubtitle}>
            <div className="grid gap-3 md:grid-cols-3">
              {DOMAIN_SECTIONS.map((domain) => {
                const summary = readyJournal.domains[domain.key];
                return (
                  <Card
                    key={domain.key}
                    padding="compact"
                    accent={false}
                    className="bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-textPrimary">{domain.label}</h3>
                          <p className="mt-1 text-sm text-textSecondary">
                            {summary.status === "RELEASED"
                              ? "Released for this week"
                              : "Not released yet"}
                          </p>
                        </div>
                        {domainBadge(summary.status)}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </DashboardCardShell>

          {allDomainsNotReleased ? (
            <DashboardCardShell title="Weekly Journal">
              <p className="text-sm text-textSecondary">
                Your weekly plan has not been released yet.
              </p>
            </DashboardCardShell>
          ) : null}

          {readyJournal.days.length === 0 ? (
            <DashboardCardShell title="Journal Days">
              <p className="text-sm text-textSecondary">
                No weekly journal entries are available yet.
              </p>
            </DashboardCardShell>
          ) : (
            readyJournal.days.map((day) => (
              <DashboardCardShell
                key={`${day.date}-${day.dayNumber}`}
                title={`Day ${day.dayNumber}`}
                subtitle={formatDateOnly(day.date)}
                className="shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
              >
                <div className="grid gap-4 xl:grid-cols-3">
                  {DOMAIN_SECTIONS.map((domain) => {
                    const items =
                      domain.key === "SKILLS"
                        ? day.skills
                        : domain.key === "NUTRITION"
                          ? day.nutrition
                          : day.sandc;
                    return (
                      <div key={`${day.date}-${domain.key}`} className="space-y-3">
                        <div className="border-l-2 border-primary/60 pl-3">
                          <h4 className="text-sm font-semibold text-textPrimary">
                            {domain.sectionTitle}
                          </h4>
                          <p className="text-xs text-textSecondary">
                            {items.length > 0
                              ? `${items.length} item(s) released`
                              : domain.emptyMessage}
                          </p>
                        </div>
                        {items.length === 0 ? (
                          <Card
                            padding="compact"
                            accent={false}
                            className="bg-bg text-sm text-textSecondary"
                          >
                            {domain.emptyMessage}
                          </Card>
                        ) : (
                          <div className="space-y-3">
                            {items.map((item, index) => renderJournalItem(item, index))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DashboardCardShell>
            ))
          )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
