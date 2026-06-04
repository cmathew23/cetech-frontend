"use client";

import {
  FYN_LOADING_MESSAGE_ID,
  FynChatThread,
  type FynChatMessage,
} from "@/components/fyn/FynChatThread";
import {
  FynPromptButtonBar,
  type FynPromptOption,
} from "@/components/fyn/FynPromptButtonBar";

import { FynComposer } from "@/components/fyn/FynComposer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  fetchCoachAssignedAthletes,
  type CoachAssignedAthleteRow,
} from "@/lib/api/coachMe";
import { fetchAthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import {
  fetchFynAssistantHistory,
  getFynPromptLabel,
  queryFynAssistant,
  type FynAssistantPromptKey,
} from "@/lib/api/fynAssistant";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

const FYN_LOADING_TEXT = "Fyn is checking your latest training data...";
const FYN_HISTORY_LOAD_WARNING =
  "Could not load recent Fyn history. You can still send a new prompt.";

const COACH_FYN_PROMPTS: Array<FynPromptOption<FynAssistantPromptKey>> = [
  { key: "SUMMARIZE_ATHLETE", label: "Summarize athlete" },
  { key: "SHOW_MISSING_LOGS", label: "Show missing logs" },
  { key: "SUMMARIZE_GOLF_METRICS", label: "Summarize Golf Metrics" },
  { key: "COACHING_TALKING_POINTS", label: "Give coaching talking points" },
];

function formatError(error: unknown, fallback: string): string {
  if (isNormalizedApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function CoachFynAssistantPageContent() {
  const { accessContext, accessGateReady } = useAuth();
  const entityId = accessContext?.academy.trainingEntityId?.trim() ?? "";

  const [loadingRoster, setLoadingRoster] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<CoachAssignedAthleteRow[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [trainingPlanVersionId, setTrainingPlanVersionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FynChatMessage[]>([]);
  const [historyWarning, setHistoryWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activePromptKey, setActivePromptKey] =
    useState<FynAssistantPromptKey>("SUMMARIZE_ATHLETE");

  useEffect(() => {
    if (!accessGateReady) return;
    let cancelled = false;
    void (async () => {
      setLoadingRoster(true);
      setRosterError(null);
      try {
        const rows = await fetchCoachAssignedAthletes();
        if (!cancelled) {
          setAthletes(rows);
          if (rows.length > 0) {
            setSelectedAthleteId((current) => current || rows[0]!.athleteId);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setAthletes([]);
          setRosterError(
            formatError(error, "Could not load assigned athletes. Try again shortly."),
          );
        }
      } finally {
        if (!cancelled) setLoadingRoster(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessGateReady]);

  useEffect(() => {
    setMessages([]);
    setHistoryWarning(null);
    setSubmitting(false);
    setActivePromptKey("SUMMARIZE_ATHLETE");
    if (entityId === "" || selectedAthleteId.trim() === "") {
      setTrainingPlanVersionId(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const history = await fetchFynAssistantHistory({
          entityId,
          athleteId: selectedAthleteId,
          role: "coach",
        });
        if (!cancelled) {
          setMessages(history.messages);
          setHistoryWarning(null);
        }
      } catch {
        if (!cancelled) {
          setMessages([]);
          setHistoryWarning(FYN_HISTORY_LOAD_WARNING);
        }
      }

      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, selectedAthleteId);
        if (!cancelled) {
          setTrainingPlanVersionId(journal.domains.SKILLS.versionId?.trim() ?? null);
        }
      } catch {
        if (!cancelled) setTrainingPlanVersionId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityId, selectedAthleteId]);

  const selectedAthlete = useMemo(
    () => athletes.find((athlete) => athlete.athleteId === selectedAthleteId) ?? null,
    [athletes, selectedAthleteId],
  );

  const sendPrompt = useCallback(
    async (promptKey: FynAssistantPromptKey, message?: string) => {
      if (entityId === "" || selectedAthleteId.trim() === "") return;

      const trimmedMessage = message?.trim() ?? "";
      const userText =
        trimmedMessage !== "" ? trimmedMessage : getFynPromptLabel(promptKey, "coach");
      setSubmitting(true);
      setActivePromptKey(promptKey);
      setMessages((current) => [
        ...current,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: userText,
        },
        {
          id: FYN_LOADING_MESSAGE_ID,
          role: "loading",
          text: FYN_LOADING_TEXT,
        },
      ]);

      try {
        const response = await queryFynAssistant({
          entityId,
          athleteId: selectedAthleteId,
          promptKey,
          message: trimmedMessage !== "" ? trimmedMessage : undefined,
          trainingPlanVersionId,
        });

        try {
          const history = await fetchFynAssistantHistory({
            entityId,
            athleteId: selectedAthleteId,
            role: "coach",
          });
          setMessages(history.messages);
        } catch {
          setMessages((current) =>
            current
              .filter((message) => message.id !== FYN_LOADING_MESSAGE_ID)
              .concat({
                id: `assistant-${Date.now()}`,
                role: "assistant",
                text: response.answer,
                warnings: response.warnings,
                usedSources: response.usedSources,
              }),
          );
        }
      } catch (error) {
        const errorText = formatError(error, "Unable to reach Fyn Assistant.");
        setMessages((current) =>
          current.map((entry) =>
            entry.id === FYN_LOADING_MESSAGE_ID
              ? {
                  id: `assistant-error-${Date.now()}`,
                  role: "assistant",
                  text: errorText,
                }
              : entry,
          ),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [entityId, selectedAthleteId, trainingPlanVersionId],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fyn Assistant"
        subtitle="Select an athlete, then ask Fyn for a quick coaching summary."
      />

      <Card accent={false} padding="compact" className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="fyn-athlete-select" className="text-sm font-medium text-textPrimary">
            Athlete
          </label>
          <Select
            id="fyn-athlete-select"
            value={selectedAthleteId}
            disabled={loadingRoster || athletes.length === 0}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedAthleteId(event.target.value)
            }
          >
            {athletes.length === 0 ? (
              <option value="">No athletes available</option>
            ) : null}
            {athletes.map((athlete) => (
              <option key={athlete.athleteId} value={athlete.athleteId}>
                {athlete.displayName}
              </option>
            ))}
          </Select>
        </div>

        {loadingRoster ? (
          <p className="text-sm text-textSecondary">Loading assigned athletes…</p>
        ) : null}
        {rosterError ? <Alert variant="danger">{rosterError}</Alert> : null}

        {selectedAthlete ? (
          <div className="space-y-3">
            <p className="text-sm text-textSecondary">
              Fyn is read-only. Responses are scoped to {selectedAthlete.displayName}.
            </p>
            <FynPromptButtonBar
              prompts={COACH_FYN_PROMPTS}
              disabled={submitting}
              onSelectPrompt={(promptKey) => void sendPrompt(promptKey)}
            />
            <FynComposer
              disabled={submitting}
              placeholder="Ask Fyn a follow-up about this athlete"
              onSubmit={(message) => sendPrompt(activePromptKey, message)}
            />
          </div>
        ) : (
          <p className="text-sm text-textSecondary">
            Select an athlete to start using Fyn Assistant.
          </p>
        )}
      </Card>

      {historyWarning ? <Alert variant="warning">{historyWarning}</Alert> : null}

      <FynChatThread
        messages={messages}
        emptyState="Choose an athlete and start with one of the guided prompts above."
      />
    </div>
  );
}
