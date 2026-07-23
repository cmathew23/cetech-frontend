"use client";

import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  fetchWeeklyAdherenceComparison,
  fetchWeeklyAdherenceSnapshots,
  fetchWeeklyAdherenceSummary,
  hasNutritionAdherenceDomain,
  type WeeklyAdherenceComparisonData,
  type WeeklyAdherenceComparisonResponse,
  type WeeklyAdherenceSnapshotOption,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";
import { fetchAthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  resolveWeeklyAdherencePlanRangeFromJournal,
  type WeeklyAdherencePlanRange,
} from "@/lib/weeklyAdherenceWeek";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AthleteWeeklyAdherencePhase =
  | "hidden"
  | "loading"
  | "loaded"
  | "error"
  | "awaiting_identifiers";

export type NutritionAdherenceKpiState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; percentLabel: string }
  | { status: "empty" }
  | { status: "awaiting_identifiers" };

export type AthleteWeeklyAdherenceState = {
  phase: AthleteWeeklyAdherencePhase;
  nutritionKpi: NutritionAdherenceKpiState;
  summary: WeeklyAdherenceSummary | null;
  error: string | null;
  weekStart: string;
  weekEnd: string;
  trainingPlanVersionId: string;
  reload: () => void;
  comparisonData: WeeklyAdherenceComparisonData | null;
  comparisonLoading: boolean;
  comparisonError: string | null;
  selectedSnapshotAId: string;
  selectedSnapshotBId: string;
  availableSnapshots: WeeklyAdherenceSnapshotOption[];
  snapshotsLoading: boolean;
  snapshotsError: string | null;
  setSelectedSnapshotAId: (snapshotId: string) => void;
  setSelectedSnapshotBId: (snapshotId: string) => void;
};

const AthleteWeeklyAdherenceContext =
  createContext<AthleteWeeklyAdherenceState | null>(null);

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load";
}

export function hasWeeklyAdherenceComparisonSnapshotIds(
  snapshotAId: string,
  snapshotBId: string,
): boolean {
  return snapshotAId.trim() !== "" && snapshotBId.trim() !== "";
}

export function comparisonSnapshotIdsForOwner(
  selectionOwner: string,
  currentOwner: string,
  snapshotAId: string,
  snapshotBId: string,
): [string, string] {
  return selectionOwner === currentOwner
    ? [snapshotAId, snapshotBId]
    : ["", ""];
}

export function isChronologicalWeeklyAdherenceSnapshotPair(
  snapshots: WeeklyAdherenceSnapshotOption[],
  earlierSnapshotId: string,
  laterSnapshotId: string,
): boolean {
  const earlier = snapshots.find((snapshot) => snapshot.id === earlierSnapshotId);
  const later = snapshots.find((snapshot) => snapshot.id === laterSnapshotId);
  return Boolean(
    earlier?.weekStart &&
      later?.weekStart &&
      earlier.weekStart < later.weekStart,
  );
}

export function reconcileWeeklyAdherenceSnapshotSelections({
  changedSelection,
  snapshotId,
  earlierSnapshotId,
  laterSnapshotId,
  snapshots,
}: {
  changedSelection: "earlier" | "later";
  snapshotId: string;
  earlierSnapshotId: string;
  laterSnapshotId: string;
  snapshots: WeeklyAdherenceSnapshotOption[];
}): [string, string] {
  if (changedSelection === "earlier") {
    return [
      snapshotId,
      isChronologicalWeeklyAdherenceSnapshotPair(
        snapshots,
        snapshotId,
        laterSnapshotId,
      )
        ? laterSnapshotId
        : "",
    ];
  }
  return [
    isChronologicalWeeklyAdherenceSnapshotPair(
      snapshots,
      earlierSnapshotId,
      snapshotId,
    )
      ? earlierSnapshotId
      : "",
    snapshotId,
  ];
}

export function chronologicalComparisonSnapshotIds(
  snapshots: WeeklyAdherenceSnapshotOption[],
  earlierSnapshotId: string,
  laterSnapshotId: string,
): [string, string] {
  return isChronologicalWeeklyAdherenceSnapshotPair(
    snapshots,
    earlierSnapshotId,
    laterSnapshotId,
  )
    ? [earlierSnapshotId, laterSnapshotId]
    : ["", ""];
}

export async function runWeeklyAdherenceComparisonLifecycle({
  snapshotAId,
  snapshotBId,
  isCurrent,
  fetchComparison,
  setComparisonData,
  setComparisonLoading,
  setComparisonError,
}: {
  snapshotAId: string;
  snapshotBId: string;
  isCurrent: () => boolean;
  fetchComparison: () => Promise<WeeklyAdherenceComparisonResponse>;
  setComparisonData: (data: WeeklyAdherenceComparisonData | null) => void;
  setComparisonLoading: (loading: boolean) => void;
  setComparisonError: (error: string | null) => void;
}): Promise<void> {
  setComparisonData(null);
  setComparisonError(null);

  if (
    !hasWeeklyAdherenceComparisonSnapshotIds(snapshotAId, snapshotBId)
  ) {
    setComparisonLoading(false);
    return;
  }

  setComparisonLoading(true);
  try {
    const response = await fetchComparison();
    if (!isCurrent()) return;
    setComparisonData(response.data);
  } catch (error) {
    if (!isCurrent()) return;
    setComparisonError(formatLoadError(error));
  } finally {
    if (isCurrent()) setComparisonLoading(false);
  }
}

export function formatAdherencePercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? Math.round(rounded) : rounded.toFixed(1)}%`;
}

export function AthleteWeeklyAdherenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isGateReady, hasActiveAcademyMembership, accessContext, accessGateReady } =
    useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers({ accessContext, accessGateReady });

  const [summary, setSummary] = useState<WeeklyAdherenceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [planWeekRange, setPlanWeekRange] =
    useState<WeeklyAdherencePlanRange | null>(null);
  const [trainingPlanVersionId, setTrainingPlanVersionId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [comparisonData, setComparisonData] =
    useState<WeeklyAdherenceComparisonData | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [selectedSnapshotAId, setSelectedSnapshotAId] = useState("");
  const [selectedSnapshotBId, setSelectedSnapshotBId] = useState("");
  const [comparisonSelectionOwner, setComparisonSelectionOwner] = useState("");
  const [availableSnapshots, setAvailableSnapshots] = useState<
    WeeklyAdherenceSnapshotOption[]
  >([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [snapshotsError, setSnapshotsError] = useState<string | null>(null);

  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";
  const comparisonOwner = `${entityId}:${athleteId}`;

  const selectSnapshotA = useCallback(
    (snapshotId: string) => {
      const [earlierSnapshotId, laterSnapshotId] =
        reconcileWeeklyAdherenceSnapshotSelections({
          changedSelection: "earlier",
          snapshotId,
          earlierSnapshotId: selectedSnapshotAId,
          laterSnapshotId: selectedSnapshotBId,
          snapshots: availableSnapshots,
        });
      setComparisonSelectionOwner(comparisonOwner);
      setSelectedSnapshotAId(earlierSnapshotId);
      setSelectedSnapshotBId(laterSnapshotId);
    },
    [
      availableSnapshots,
      comparisonOwner,
      selectedSnapshotAId,
      selectedSnapshotBId,
    ],
  );

  const selectSnapshotB = useCallback(
    (snapshotId: string) => {
      const [earlierSnapshotId, laterSnapshotId] =
        reconcileWeeklyAdherenceSnapshotSelections({
          changedSelection: "later",
          snapshotId,
          earlierSnapshotId: selectedSnapshotAId,
          laterSnapshotId: selectedSnapshotBId,
          snapshots: availableSnapshots,
        });
      setComparisonSelectionOwner(comparisonOwner);
      setSelectedSnapshotAId(earlierSnapshotId);
      setSelectedSnapshotBId(laterSnapshotId);
    },
    [
      availableSnapshots,
      comparisonOwner,
      selectedSnapshotAId,
      selectedSnapshotBId,
    ],
  );

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (
      !isGateReady ||
      !hasActiveAcademyMembership ||
      planningIds.phase !== "ready" ||
      entityId === "" ||
      athleteId === ""
    ) {
      setFetching(false);
      return;
    }

    let cancelled = false;
    setFetching(true);
    setError(null);

    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, athleteId);
        const weekRange = resolveWeeklyAdherencePlanRangeFromJournal(journal);
        if (weekRange === null) {
          throw new Error("Could not resolve released plan week.");
        }
        const data = await fetchWeeklyAdherenceSummary({
          entityId,
          athleteId,
          weekStart: weekRange.weekStart,
          weekEnd: weekRange.weekEnd,
        });
        if (!cancelled) {
          setPlanWeekRange(weekRange);
          setTrainingPlanVersionId(journal.domains.SKILLS?.versionId?.trim() ?? "");
          setSummary(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setPlanWeekRange(null);
          setTrainingPlanVersionId("");
          setSummary(null);
          setError(formatLoadError(e));
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    athleteId,
    entityId,
    hasActiveAcademyMembership,
    isGateReady,
    planningIds.phase,
    reloadKey,
  ]);

  useEffect(() => {
    let cancelled = false;
    setAvailableSnapshots([]);
    setSelectedSnapshotAId("");
    setSelectedSnapshotBId("");
    setComparisonSelectionOwner("");
    setComparisonData(null);
    setComparisonLoading(false);
    setComparisonError(null);
    setSnapshotsError(null);

    if (entityId === "" || athleteId === "") {
      setSnapshotsLoading(false);
      return;
    }

    setSnapshotsLoading(true);
    void fetchWeeklyAdherenceSnapshots({ entityId, athleteId })
      .then((snapshots) => {
        if (!cancelled) setAvailableSnapshots(snapshots);
      })
      .catch((snapshotError) => {
        if (!cancelled) {
          setAvailableSnapshots([]);
          setSnapshotsError(formatLoadError(snapshotError));
        }
      })
      .finally(() => {
        if (!cancelled) setSnapshotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [athleteId, entityId]);

  useEffect(() => {
    let cancelled = false;
    const [snapshotAId, snapshotBId] = comparisonSnapshotIdsForOwner(
      comparisonSelectionOwner,
      comparisonOwner,
      selectedSnapshotAId,
      selectedSnapshotBId,
    );
    const [validSnapshotAId, validSnapshotBId] =
      chronologicalComparisonSnapshotIds(
        availableSnapshots,
        snapshotAId,
        snapshotBId,
      );
    void runWeeklyAdherenceComparisonLifecycle({
      snapshotAId: validSnapshotAId,
      snapshotBId: validSnapshotBId,
      isCurrent: () => !cancelled,
      fetchComparison: () =>
        fetchWeeklyAdherenceComparison({
          entityId,
          athleteId,
          snapshotAId: validSnapshotAId,
          snapshotBId: validSnapshotBId,
        }),
      setComparisonData,
      setComparisonLoading,
      setComparisonError,
    });
    return () => {
      cancelled = true;
    };
  }, [
    availableSnapshots,
    athleteId,
    comparisonOwner,
    comparisonSelectionOwner,
    entityId,
    selectedSnapshotAId,
    selectedSnapshotBId,
  ]);

  const nutritionKpi: NutritionAdherenceKpiState = useMemo(() => {
    if (!isGateReady) {
      return { status: "loading" };
    }
    if (!hasActiveAcademyMembership) {
      return { status: "loading" };
    }
    if (planningIds.phase === "loading") {
      return { status: "loading" };
    }
    if (planningIds.phase !== "ready" || entityId === "" || athleteId === "") {
      return { status: "awaiting_identifiers" };
    }
    if (fetching) {
      return { status: "loading" };
    }
    if (error) {
      return { status: "error", message: error };
    }
    if (summary && hasNutritionAdherenceDomain(summary)) {
      return {
        status: "ready",
        percentLabel: formatAdherencePercent(
          summary.domains.NUTRITION!.adherencePercent,
        ),
      };
    }
    if (summary) {
      return { status: "empty" };
    }
    return { status: "loading" };
  }, [
    athleteId,
    entityId,
    error,
    fetching,
    hasActiveAcademyMembership,
    isGateReady,
    planningIds.phase,
    summary,
  ]);

  const phase: AthleteWeeklyAdherencePhase = useMemo(() => {
    if (!isGateReady) {
      return "loading";
    }
    if (!hasActiveAcademyMembership) {
      return "hidden";
    }
    if (planningIds.phase === "loading") {
      return "loading";
    }
    if (planningIds.phase !== "ready" || entityId === "" || athleteId === "") {
      return "awaiting_identifiers";
    }
    if (fetching) {
      return "loading";
    }
    if (error) {
      return "error";
    }
    if (summary) {
      return "loaded";
    }
    return "loading";
  }, [
    athleteId,
    entityId,
    error,
    fetching,
    hasActiveAcademyMembership,
    isGateReady,
    planningIds.phase,
    summary,
  ]);

  const value = useMemo<AthleteWeeklyAdherenceState>(
    () => ({
      phase,
      nutritionKpi,
      summary,
      error,
      weekStart: planWeekRange?.weekStart ?? "",
      weekEnd: planWeekRange?.weekEnd ?? "",
      trainingPlanVersionId,
      reload,
      comparisonData,
      comparisonLoading,
      comparisonError,
      selectedSnapshotAId,
      selectedSnapshotBId,
      availableSnapshots,
      snapshotsLoading,
      snapshotsError,
      setSelectedSnapshotAId: selectSnapshotA,
      setSelectedSnapshotBId: selectSnapshotB,
    }),
    [
      availableSnapshots,
      comparisonData,
      comparisonError,
      comparisonLoading,
      error,
      nutritionKpi,
      phase,
      planWeekRange?.weekEnd,
      planWeekRange?.weekStart,
      reload,
      selectSnapshotA,
      selectSnapshotB,
      selectedSnapshotAId,
      selectedSnapshotBId,
      snapshotsError,
      snapshotsLoading,
      summary,
      trainingPlanVersionId,
    ],
  );

  return (
    <AthleteWeeklyAdherenceContext.Provider value={value}>
      {children}
    </AthleteWeeklyAdherenceContext.Provider>
  );
}

export function useAthleteWeeklyAdherence(): AthleteWeeklyAdherenceState {
  const ctx = useContext(AthleteWeeklyAdherenceContext);
  if (!ctx) {
    throw new Error(
      "useAthleteWeeklyAdherence must be used within AthleteWeeklyAdherenceProvider",
    );
  }
  return ctx;
}
