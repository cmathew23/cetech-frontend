"use client";

import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  fetchWeeklyAdherenceSummary,
  hasNutritionAdherenceDomain,
  type WeeklyAdherenceSummary,
} from "@/lib/api/weeklyAdherence";
import { isNormalizedApiError } from "@/lib/apiClient";
import { getCurrentWeekDateRange } from "@/lib/weeklyAdherenceWeek";
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
  reload: () => void;
};

const AthleteWeeklyAdherenceContext =
  createContext<AthleteWeeklyAdherenceState | null>(null);

function formatLoadError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Unable to load";
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
  const { isGateReady, hasActiveAcademyMembership } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers();
  const weekRange = useMemo(() => getCurrentWeekDateRange(), []);

  const [summary, setSummary] = useState<WeeklyAdherenceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";

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
        const data = await fetchWeeklyAdherenceSummary({
          entityId,
          athleteId,
          weekStart: weekRange.weekStart,
          weekEnd: weekRange.weekEnd,
        });
        if (!cancelled) {
          setSummary(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
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
    weekRange.weekEnd,
    weekRange.weekStart,
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
      weekStart: weekRange.weekStart,
      weekEnd: weekRange.weekEnd,
      reload,
    }),
    [error, nutritionKpi, phase, reload, summary, weekRange.weekEnd, weekRange.weekStart],
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
