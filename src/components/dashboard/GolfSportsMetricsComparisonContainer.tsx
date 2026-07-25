"use client";

import { GolfSportsMetricsComparison } from "@/components/dashboard/GolfSportsMetricsComparison";
import { Alert } from "@/components/ui/Alert";
import {
  fetchSportMetricsGolfComparison,
  type SportMetricsGolfComparisonData,
  type SportMetricsGolfComparisonResponse,
} from "@/lib/api/sportMetricsGolf";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useEffect, useState } from "react";

export type GolfSportsMetricsComparisonContainerState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "empty" }
  | { phase: "loaded"; comparison: SportMetricsGolfComparisonData };

function comparisonLoadError(error: unknown): string {
  if (isNormalizedApiError(error)) return error.message;
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return "Unable to load Golf Sports Metrics comparison.";
}

export async function runGolfSportsMetricsComparisonLoad({
  fetchComparison,
  isCurrent,
  setState,
}: {
  fetchComparison: () => Promise<SportMetricsGolfComparisonResponse>;
  isCurrent: () => boolean;
  setState: (state: GolfSportsMetricsComparisonContainerState) => void;
}): Promise<void> {
  setState({ phase: "loading" });

  try {
    const response = await fetchComparison();
    if (!isCurrent()) return;
    const hasTopLevelDetails =
      response.data.taxonomyMismatches.length > 0 ||
      response.data.unclassifiableCounts.earlier !== 0 ||
      response.data.unclassifiableCounts.later !== 0;
    if (response.data.categories.length === 0 && !hasTopLevelDetails) {
      setState({ phase: "empty" });
      return;
    }
    setState({ phase: "loaded", comparison: response.data });
  } catch (error) {
    if (!isCurrent()) return;
    setState({ phase: "error", message: comparisonLoadError(error) });
  }
}

export function GolfSportsMetricsComparisonContainerContent({
  state,
}: {
  state: GolfSportsMetricsComparisonContainerState;
}) {
  if (state.phase === "loading") {
    return (
      <p className="text-sm text-textSecondary">
        Loading Golf Sports Metrics comparison…
      </p>
    );
  }

  if (state.phase === "error") {
    return <Alert variant="danger">{state.message}</Alert>;
  }

  if (state.phase === "empty") {
    return (
      <p className="text-sm text-textSecondary">
        No Golf Sports Metrics comparison categories returned.
      </p>
    );
  }

  return <GolfSportsMetricsComparison comparison={state.comparison} />;
}

export function GolfSportsMetricsComparisonContainer({
  entityId,
  athleteId,
  earlierTrainingPlanVersionId,
  laterTrainingPlanVersionId,
}: {
  entityId: string;
  athleteId: string;
  earlierTrainingPlanVersionId: string;
  laterTrainingPlanVersionId: string;
}) {
  const [state, setState] =
    useState<GolfSportsMetricsComparisonContainerState>({
      phase: "loading",
    });

  useEffect(() => {
    let current = true;

    void runGolfSportsMetricsComparisonLoad({
      fetchComparison: () =>
        fetchSportMetricsGolfComparison({
          entityId,
          athleteId,
          earlierTrainingPlanVersionId,
          laterTrainingPlanVersionId,
        }),
      isCurrent: () => current,
      setState,
    });

    return () => {
      current = false;
    };
  }, [
    athleteId,
    earlierTrainingPlanVersionId,
    entityId,
    laterTrainingPlanVersionId,
  ]);

  return <GolfSportsMetricsComparisonContainerContent state={state} />;
}
