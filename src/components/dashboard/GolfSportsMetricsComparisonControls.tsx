"use client";

import { GolfSportsMetricsComparisonContainer } from "@/components/dashboard/GolfSportsMetricsComparisonContainer";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import {
  fetchCoachTrainingPlanDomainHistory,
  type CoachTrainingPlanDomainHistoryRow,
} from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatDateRange } from "@/lib/dateTime";
import { useEffect, useState, type ChangeEvent } from "react";

export async function fetchGolfSkillsPlanVersionOptions(
  entityId: string,
  athleteId: string,
): Promise<CoachTrainingPlanDomainHistoryRow[]> {
  return fetchCoachTrainingPlanDomainHistory(entityId, athleteId, "SKILLS");
}

export function isValidGolfPlanVersionPair(
  earlier: CoachTrainingPlanDomainHistoryRow,
  later: CoachTrainingPlanDomainHistoryRow,
): boolean {
  if (
    !earlier.versionId ||
    !later.versionId ||
    earlier.versionId === later.versionId
  ) {
    return false;
  }

  if (earlier.weekEndDate && later.weekStartDate) {
    return earlier.weekEndDate < later.weekStartDate;
  }

  return true;
}

function planVersionLabel(row: CoachTrainingPlanDomainHistoryRow): string {
  if (row.weekStartDate && row.weekEndDate) {
    return formatDateRange(row.weekStartDate, row.weekEndDate);
  }
  if (row.versionNumber !== null) {
    return `Version ${row.versionNumber}`;
  }
  return row.versionId ?? "Unavailable";
}

function versionLoadError(error: unknown): string {
  if (isNormalizedApiError(error)) return error.message;
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return "Unable to load Skills plan versions.";
}

export function GolfSportsMetricsComparisonControlsContent({
  entityId,
  athleteId,
  versions,
  loading,
  error,
  earlierTrainingPlanVersionId,
  laterTrainingPlanVersionId,
  onEarlierChange,
  onLaterChange,
}: {
  entityId: string;
  athleteId: string;
  versions: CoachTrainingPlanDomainHistoryRow[];
  loading: boolean;
  error: string | null;
  earlierTrainingPlanVersionId: string;
  laterTrainingPlanVersionId: string;
  onEarlierChange: (versionId: string) => void;
  onLaterChange: (versionId: string) => void;
}) {
  const selectableVersions = versions.filter(
    (row) => row.versionId !== null && row.versionId.trim() !== "",
  );
  const earlierVersion =
    selectableVersions.find(
      (row) => row.versionId === earlierTrainingPlanVersionId,
    ) ?? null;
  const laterVersion =
    selectableVersions.find(
      (row) => row.versionId === laterTrainingPlanVersionId,
    ) ?? null;
  const validPair =
    earlierVersion !== null &&
    laterVersion !== null &&
    isValidGolfPlanVersionPair(earlierVersion, laterVersion);

  return (
    <Card
      title="Sports Metrics Comparison"
      subtitle="Select two Skills plan weeks to compare."
      accent={false}
      padding="compact"
    >
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-textSecondary">
            Loading Skills plan versions…
          </p>
        ) : null}
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {!loading && !error && selectableVersions.length < 2 ? (
          <p className="text-sm text-textSecondary">
            At least two Skills plan versions are required for comparison.
          </p>
        ) : null}

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <FormField
            id="golf-sports-metrics-earlier-version"
            label="Earlier week"
            className="min-w-0"
          >
            <Select
              id="golf-sports-metrics-earlier-version"
              value={earlierTrainingPlanVersionId}
              disabled={loading || error !== null || selectableVersions.length < 2}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onEarlierChange(event.target.value)
              }
            >
              <option value="">Select an earlier week</option>
              {selectableVersions.map((row, index) => {
                const disabled =
                  row.versionId === laterTrainingPlanVersionId ||
                  (laterVersion !== null &&
                    !isValidGolfPlanVersionPair(row, laterVersion));
                return (
                  <option
                    key={`${row.versionId}-${index}`}
                    value={row.versionId ?? ""}
                    disabled={disabled}
                  >
                    {planVersionLabel(row)}
                  </option>
                );
              })}
            </Select>
          </FormField>

          <FormField
            id="golf-sports-metrics-later-version"
            label="Later week"
            className="min-w-0"
          >
            <Select
              id="golf-sports-metrics-later-version"
              value={laterTrainingPlanVersionId}
              disabled={loading || error !== null || selectableVersions.length < 2}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onLaterChange(event.target.value)
              }
            >
              <option value="">Select a later week</option>
              {selectableVersions.map((row, index) => {
                const disabled =
                  row.versionId === earlierTrainingPlanVersionId ||
                  (earlierVersion !== null &&
                    !isValidGolfPlanVersionPair(earlierVersion, row));
                return (
                  <option
                    key={`${row.versionId}-${index}`}
                    value={row.versionId ?? ""}
                    disabled={disabled}
                  >
                    {planVersionLabel(row)}
                  </option>
                );
              })}
            </Select>
          </FormField>
        </div>

        {validPair ? (
          <GolfSportsMetricsComparisonContainer
            entityId={entityId}
            athleteId={athleteId}
            earlierTrainingPlanVersionId={earlierTrainingPlanVersionId}
            laterTrainingPlanVersionId={laterTrainingPlanVersionId}
          />
        ) : null}
      </div>
    </Card>
  );
}

export function GolfSportsMetricsComparisonControls({
  entityId,
  athleteId,
}: {
  entityId: string;
  athleteId: string;
}) {
  const owner = `${entityId.trim()}:${athleteId.trim()}`;
  const hasIdentifiers = entityId.trim() !== "" && athleteId.trim() !== "";
  const [loadState, setLoadState] = useState<{
    owner: string;
    versions: CoachTrainingPlanDomainHistoryRow[];
    error: string | null;
  }>({
    owner: "",
    versions: [],
    error: null,
  });
  const [selection, setSelection] = useState({
    owner: "",
    earlierTrainingPlanVersionId: "",
    laterTrainingPlanVersionId: "",
  });

  useEffect(() => {
    let current = true;

    if (!hasIdentifiers) {
      return () => {
        current = false;
      };
    }

    void fetchGolfSkillsPlanVersionOptions(entityId, athleteId)
      .then((rows) => {
        if (current) {
          setLoadState({ owner, versions: rows, error: null });
        }
      })
      .catch((loadError) => {
        if (current) {
          setLoadState({
            owner,
            versions: [],
            error: versionLoadError(loadError),
          });
        }
      });

    return () => {
      current = false;
    };
  }, [athleteId, entityId, hasIdentifiers, owner]);

  const versions = loadState.owner === owner ? loadState.versions : [];
  const loading = hasIdentifiers && loadState.owner !== owner;
  const error = loadState.owner === owner ? loadState.error : null;
  const earlierTrainingPlanVersionId =
    selection.owner === owner ? selection.earlierTrainingPlanVersionId : "";
  const laterTrainingPlanVersionId =
    selection.owner === owner ? selection.laterTrainingPlanVersionId : "";

  const earlierVersion =
    versions.find(
      (row) => row.versionId === earlierTrainingPlanVersionId,
    ) ?? null;
  const laterVersion =
    versions.find((row) => row.versionId === laterTrainingPlanVersionId) ??
    null;

  return (
    <GolfSportsMetricsComparisonControlsContent
      entityId={entityId}
      athleteId={athleteId}
      versions={versions}
      loading={loading}
      error={error}
      earlierTrainingPlanVersionId={earlierTrainingPlanVersionId}
      laterTrainingPlanVersionId={laterTrainingPlanVersionId}
      onEarlierChange={(versionId) => {
        const nextEarlier =
          versions.find((row) => row.versionId === versionId) ?? null;
        const nextLaterId =
          nextEarlier &&
          laterVersion &&
          !isValidGolfPlanVersionPair(nextEarlier, laterVersion)
            ? ""
            : laterTrainingPlanVersionId;
        setSelection({
          owner,
          earlierTrainingPlanVersionId: versionId,
          laterTrainingPlanVersionId: nextLaterId,
        });
      }}
      onLaterChange={(versionId) => {
        const nextLater =
          versions.find((row) => row.versionId === versionId) ?? null;
        const nextEarlierId =
          earlierVersion &&
          nextLater &&
          !isValidGolfPlanVersionPair(earlierVersion, nextLater)
            ? ""
            : earlierTrainingPlanVersionId;
        setSelection({
          owner,
          earlierTrainingPlanVersionId: nextEarlierId,
          laterTrainingPlanVersionId: versionId,
        });
      }}
    />
  );
}
