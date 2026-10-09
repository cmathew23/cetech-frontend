"use client";

import { AthleteCompetitionEntrySection } from "@/components/dashboard/athlete/AthleteCompetitionEntrySection";
import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import {
  DASHBOARD_METRIC_STATUS_CLASS,
  DASHBOARD_METRIC_SUPPORTING_CLASS,
  DASHBOARD_METRIC_TILE_CLASS,
  DASHBOARD_METRIC_TITLE_CLASS,
  dashboardMetricGridClass,
} from "@/components/dashboard/shared/dashboardTypography";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import { fetchAthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import { fetchSportMetricsGolfWeeklySummary } from "@/lib/api/sportMetricsGolf";
import {
  fetchGolfCompetitions,
  type GolfCompetitionListItem,
} from "@/lib/api/sportMetricsGolfCompetitions";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateOnly } from "@/lib/dateTime";
import { formatEnumeratedLabel } from "@/lib/textFormat";
import { cn } from "@/lib/utils";
import { releasedSkillsTrainingPlanVersionId } from "@/lib/weeklyAdherenceWeek";
import { useCallback, useEffect, useState } from "react";

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load competitions.";
}

function formatCompetitionFormat(format: GolfCompetitionListItem["format"]): string {
  return `${format} holes`;
}

export function AthleteSeasonCompetitionCards({
  competitions,
  onSelect,
}: {
  competitions: GolfCompetitionListItem[];
  onSelect: (competitionId: string) => void;
}) {
  return (
    <div className={dashboardMetricGridClass(competitions.length)}>
      {competitions.map((competition) => (
        <button
          key={competition.id}
          type="button"
          className={cn(DASHBOARD_METRIC_TILE_CLASS, "text-left")}
          onClick={() => onSelect(competition.id)}
        >
          <h4 className={DASHBOARD_METRIC_TITLE_CLASS}>{competition.name}</h4>
          <p className={DASHBOARD_METRIC_STATUS_CLASS}>{competition.status}</p>
          <div className={DASHBOARD_METRIC_SUPPORTING_CLASS}>
            <p>{formatDateOnly(competition.startDate)}</p>
            <p>{competition.venue}</p>
            <p>{formatCompetitionFormat(competition.format)}</p>
            <p>{formatEnumeratedLabel(competition.type)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function AthleteCompetitionsPageContent() {
  const { accessContext, accessGateReady } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers({
    accessContext,
    accessGateReady,
  });
  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";
  const [trainingPlanVersionId, setTrainingPlanVersionId] = useState("");
  const [seasonCycleId, setSeasonCycleId] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState<number | null>(null);
  const [competitions, setCompetitions] = useState<GolfCompetitionListItem[]>(
    [],
  );
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [openCompetitionId, setOpenCompetitionId] = useState<string | null>(
    null,
  );
  const [listReloadKey, setListReloadKey] = useState(0);

  const refreshList = useCallback(() => {
    setListReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (planningIds.phase !== "ready" || entityId === "" || athleteId === "") {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, athleteId);
        if (!cancelled) {
          setTrainingPlanVersionId(releasedSkillsTrainingPlanVersionId(journal));
        }
      } catch {
        if (!cancelled) setTrainingPlanVersionId("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planningIds.phase, entityId, athleteId]);

  useEffect(() => {
    const versionId = trainingPlanVersionId.trim();
    if (entityId === "" || athleteId === "" || versionId === "") {
      return;
    }
    let cancelled = false;
    setListLoading(true);
    void (async () => {
      try {
        const summary = await fetchSportMetricsGolfWeeklySummary({
          entityId,
          athleteId,
          trainingPlanVersionId: versionId,
        });
        if (cancelled) return;
        const nextSeasonCycleId = summary.seasonCycleId?.trim() || null;
        setSeasonCycleId(nextSeasonCycleId);
        setSeasonYear(summary.seasonYear);
        setListError(null);
        if (!nextSeasonCycleId) {
          setCompetitions([]);
          return;
        }
        const list = await fetchGolfCompetitions({
          entityId,
          athleteId,
          seasonCycleId: nextSeasonCycleId,
        });
        if (cancelled) return;
        setSeasonYear(list.seasonYear);
        setCompetitions(list.competitions);
      } catch (e) {
        if (cancelled) return;
        setListError(formatLoadError(e));
        setCompetitions([]);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityId, athleteId, trainingPlanVersionId, listReloadKey]);

  const showWorkflow = showCreate || openCompetitionId !== null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Competitions"
        subtitle={
          seasonYear !== null ? `Season ${String(seasonYear)}` : undefined
        }
        trailing={<AthleteHeaderIdentityMetadata />}
        actions={
          <Button
            type="button"
            onClick={() => {
              setOpenCompetitionId(null);
              setShowCreate(true);
            }}
          >
            + Add Competition
          </Button>
        }
      />

      {listError ? <Alert variant="danger">{listError}</Alert> : null}
      {listLoading ? (
        <p className="text-sm text-textSecondary">Loading competitions…</p>
      ) : null}
      {!listLoading && trainingPlanVersionId.trim() !== "" && !seasonCycleId ? (
        <p className="text-sm text-textSecondary">Season cycle unavailable</p>
      ) : null}

      {showWorkflow ? (
        <AthleteCompetitionEntrySection
          key={openCompetitionId ?? "create"}
          entityId={entityId}
          athleteId={athleteId}
          trainingPlanVersionId={trainingPlanVersionId}
          competitionId={openCompetitionId}
          ignoreStoredDraft={showCreate || openCompetitionId !== null}
          onCompetitionCreated={refreshList}
          onCompetitionSubmitted={refreshList}
        />
      ) : null}

      {!listLoading && seasonCycleId && competitions.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-textSecondary">
            No competitions recorded for this season.
          </p>
          <Button
            type="button"
            onClick={() => {
              setOpenCompetitionId(null);
              setShowCreate(true);
            }}
          >
            + Add Competition
          </Button>
        </div>
      ) : null}

      {competitions.length > 0 ? (
        <AthleteSeasonCompetitionCards
          competitions={competitions}
          onSelect={(competitionId) => {
            setShowCreate(false);
            setOpenCompetitionId(competitionId);
          }}
        />
      ) : null}
    </div>
  );
}
