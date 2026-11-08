"use client";

import {
  AnalysisResults,
  SavedAnalysesSection,
  fetchPeakFlowSavedAnalyses,
  fetchPeakFlowSavedAnalysis,
  openedAnalysisView,
} from "@/components/dashboard/athlete/PeakFlowSwingPageContent";
import { useCoachSportCode } from "@/components/dashboard/coach/useCoachSportCode";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { isGolfSportCode } from "@/config/dashboardNav";
import { designSystem } from "@/config/design-system";
import {
  fetchCoachPeakFlowAssignmentScope,
  type CoachPeakFlowAthleteOption,
} from "@/lib/api/coachMe";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

export function CoachPeakFlowSwingPageContent() {
  const router = useRouter();
  const { sportCode, ready: sportReady } = useCoachSportCode();
  const blocked = sportReady && !isGolfSportCode(sportCode);
  const [trainingEntityId, setTrainingEntityId] = useState("");
  const [athletes, setAthletes] = useState<CoachPeakFlowAthleteOption[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [analyses, setAnalyses] = useState<Array<Record<string, unknown>>>([]);
  const [analysesLoading, setAnalysesLoading] = useState(false);
  const [analysesError, setAnalysesError] = useState(false);
  const [analysesReload, setAnalysesReload] = useState(0);
  const [openingAnalysisId, setOpeningAnalysisId] = useState<string | null>(null);
  const [openAnalysisErrorId, setOpenAnalysisErrorId] = useState<string | null>(null);
  const [bodyAnalysis, setBodyAnalysis] = useState<object | null>(null);
  const [clubAnalysis, setClubAnalysis] = useState<object | null>(null);
  const [bodyPlaybackUrl, setBodyPlaybackUrl] = useState<string | null>(null);
  const [clubPlaybackUrl, setClubPlaybackUrl] = useState<string | null>(null);
  const [resultsView, setResultsView] = useState<{ tab: string; token: number } | null>(null);
  const openRequestRef = useRef(0);

  useEffect(() => {
    if (!blocked) return;
    router.replace("/coach/dashboard");
  }, [blocked, router]);

  useEffect(() => {
    if (!sportReady || blocked) return;
    let cancelled = false;
    setRosterLoading(true);
    setRosterError(false);
    void fetchCoachPeakFlowAssignmentScope()
      .then((scope) => {
        if (cancelled) return;
        setTrainingEntityId(scope.trainingEntityId);
        setAthletes(scope.athletes);
        setSelectedAthleteId((current) => current || scope.athletes[0]?.athleteId || "");
      })
      .catch(() => {
        if (cancelled) return;
        setRosterError(true);
        setAthletes([]);
        setTrainingEntityId("");
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sportReady, blocked]);

  useEffect(() => {
    if (!sportReady || blocked || selectedAthleteId === "" || trainingEntityId === "") {
      setAnalyses([]);
      setAnalysesLoading(false);
      return;
    }
    let cancelled = false;
    setAnalyses([]);
    setAnalysesLoading(true);
    setAnalysesError(false);
    void fetchPeakFlowSavedAnalyses(selectedAthleteId, trainingEntityId)
      .then((rows) => {
        if (!cancelled) {
          setAnalyses(
            rows.filter(
              (row: Record<string, unknown>) =>
                row.shared === true &&
                (row.analysisType === "BODY" || row.analysisType === "CLUB"),
            ),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setAnalysesError(true);
      })
      .finally(() => {
        if (!cancelled) setAnalysesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sportReady, blocked, selectedAthleteId, trainingEntityId, analysesReload]);

  async function handleOpen(item: { id?: string; analysisType?: string }) {
    if (selectedAthleteId === "" || !item?.id) return;
    const requestId = openRequestRef.current + 1;
    openRequestRef.current = requestId;
    setOpeningAnalysisId(item.id);
    setOpenAnalysisErrorId(null);
    try {
      const detail = await fetchPeakFlowSavedAnalysis(item.id, selectedAthleteId);
      if (openRequestRef.current !== requestId) return;
      if (detail.analysisType !== item.analysisType) {
        throw new Error("Saved analysis could not be opened.");
      }
      const view = openedAnalysisView(detail);
      if (view.tab === "body") {
        setBodyAnalysis(view.result);
        setBodyPlaybackUrl(view.playbackUrl);
      } else if (view.tab === "club") {
        setClubAnalysis(view.result);
        setClubPlaybackUrl(view.playbackUrl);
      } else {
        throw new Error("Saved analysis could not be opened.");
      }
      setResultsView((current) => ({
        tab: view.tab,
        token: (current?.token ?? 0) + 1,
      }));
    } catch {
      if (openRequestRef.current === requestId) setOpenAnalysisErrorId(item.id);
    } finally {
      if (openRequestRef.current === requestId) setOpeningAnalysisId(null);
    }
  }

  if (!sportReady || blocked) return null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader
        title="PeakFlow Swing"
        subtitle="Shared golf swing analyses"
      />
      <section className={cn(designSystem.card.root, designSystem.card.padding.default, "space-y-3")}>
        <label htmlFor="coach-peakflow-athlete" className="text-sm font-medium text-textPrimary">
          Athlete
        </label>
        <Select
          id="coach-peakflow-athlete"
          value={selectedAthleteId}
          disabled={rosterLoading || athletes.length === 0}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            setSelectedAthleteId(event.target.value);
            setBodyAnalysis(null);
            setClubAnalysis(null);
            setBodyPlaybackUrl(null);
            setClubPlaybackUrl(null);
          }}
        >
          {athletes.length === 0 ? <option value="">No athletes available</option> : null}
          {athletes.map((athlete) => (
            <option key={athlete.athleteId} value={athlete.athleteId}>
              {athlete.displayName}
            </option>
          ))}
        </Select>
        {rosterLoading ? <p className="text-sm text-textSecondary">Loading assigned athletes...</p> : null}
        {rosterError ? <Alert variant="danger">Assigned athletes could not be loaded.</Alert> : null}
        {!rosterLoading && !rosterError && trainingEntityId === "" ? (
          <Alert variant="danger">Assigned coach entity is unavailable.</Alert>
        ) : null}
      </section>

      {bodyAnalysis || clubAnalysis ? (
        <AnalysisResults
          bodyAnalysis={bodyAnalysis}
          clubAnalysis={clubAnalysis}
          bodyPlaybackUrl={bodyPlaybackUrl}
          clubPlaybackUrl={clubPlaybackUrl}
          requestedTab={resultsView?.tab ?? null}
          requestedTabToken={resultsView?.token ?? 0}
          readOnly
        />
      ) : null}

      <SavedAnalysesSection
        pending={selectedAthleteId !== "" && trainingEntityId === "" && !rosterLoading}
        loading={analysesLoading}
        error={analysesError}
        analyses={analyses}
        openingAnalysisId={openingAnalysisId}
        openAnalysisErrorId={openAnalysisErrorId}
        showSharing={false}
        onRetry={() => setAnalysesReload((value) => value + 1)}
        onOpen={handleOpen}
      />
    </div>
  );
}
