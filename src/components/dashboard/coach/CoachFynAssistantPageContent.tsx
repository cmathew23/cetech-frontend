"use client";

import {
  FYN_LOADING_MESSAGE_ID,
  FynChatThread,
  type FynChatMessage,
} from "@/components/fyn/FynChatThread";

import { FynComposer } from "@/components/fyn/FynComposer";
import { PageHeader } from "@/components/layout/PageHeader";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { DASHBOARD_PLANNING_FIELD_LABEL_CLASS } from "@/components/dashboard/shared/dashboardTypography";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/Select";
import {
  fetchCoachAssignedAthletes,
  type CoachAssignedAthleteRow,
} from "@/lib/api/coachMe";
import { fetchAthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import {
  fetchFynAssistantHistory,
  queryFynAssistant,
  appendFynAssistantQueryAnswer,
  fynHistoryContainsSubmittedTurn,
} from "@/lib/api/fynAssistant";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

const FYN_LOADING_TEXT = "Fyn is checking your latest training data...";
const FYN_HISTORY_LOAD_WARNING =
  "Could not load recent Fyn history. You can still send a new prompt.";

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
  const latestEntityIdRef = useRef(entityId);
  const latestSelectedAthleteIdRef = useRef(selectedAthleteId);

  useEffect(() => {
    latestEntityIdRef.current = entityId;
    latestSelectedAthleteIdRef.current = selectedAthleteId;
  }, [entityId, selectedAthleteId]);

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
    setTrainingPlanVersionId(null);
    if (entityId === "" || selectedAthleteId.trim() === "") {
      return;
    }

    const requestedEntityId = entityId;
    const requestedAthleteId = selectedAthleteId;
    let cancelled = false;
    const isCurrentSelection = () =>
      latestEntityIdRef.current === requestedEntityId &&
      latestSelectedAthleteIdRef.current === requestedAthleteId;

    void (async () => {
      try {
        const history = await fetchFynAssistantHistory({
          entityId: requestedEntityId,
          athleteId: requestedAthleteId,
          role: "coach",
        });

        if (!cancelled && isCurrentSelection()) {
          setMessages(history.messages);
          setHistoryWarning(null);
        }
      } catch {
        if (!cancelled && isCurrentSelection()) {
          setMessages([]);
          setHistoryWarning(FYN_HISTORY_LOAD_WARNING);
        }
      }

      try {
        const journal = await fetchAthleteWeeklyPlanJournal(
          requestedEntityId,
          requestedAthleteId,
        );
        if (!cancelled && isCurrentSelection()) {
          setTrainingPlanVersionId(journal.domains.SKILLS.versionId?.trim() ?? null);
        }
      } catch {
        if (!cancelled && isCurrentSelection()) setTrainingPlanVersionId(null);
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

  const sendMessage = useCallback(
    async (message: string) => {
      if (entityId === "" || selectedAthleteId.trim() === "") return;

      const requestedEntityId = entityId;
      const requestedAthleteId = selectedAthleteId;
      const requestedTrainingPlanVersionId = trainingPlanVersionId;
      const createdAt = new Date().toISOString();
      const trimmedMessage = message.trim();
      if (trimmedMessage === "") return;
      const isCurrentSelection = () =>
        latestEntityIdRef.current === requestedEntityId &&
        latestSelectedAthleteIdRef.current === requestedAthleteId;

      setSubmitting(true);
      setMessages((current) => [
        ...current,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: trimmedMessage,
          createdAt,
        },
        {
          id: FYN_LOADING_MESSAGE_ID,
          role: "loading",
          text: FYN_LOADING_TEXT,
          createdAt,
        },
      ]);

      try {
        const response = await queryFynAssistant({
          entityId: requestedEntityId,
          athleteId: requestedAthleteId,
          message: trimmedMessage,
          trainingPlanVersionId: requestedTrainingPlanVersionId,
        });

        try {
          const history = await fetchFynAssistantHistory({
            entityId: requestedEntityId,
            athleteId: requestedAthleteId,
            role: "coach",
          });

          if (isCurrentSelection()) {
            if (
              fynHistoryContainsSubmittedTurn(history.messages, trimmedMessage)
            ) {
              setMessages(history.messages);
              setHistoryWarning(null);
            } else {
              setMessages((current) =>
                appendFynAssistantQueryAnswer(current, response),
              );
            }
          }
        } catch {
          if (isCurrentSelection()) {
            setMessages((current) =>
              appendFynAssistantQueryAnswer(current, response),
            );
          }
        }
      } catch (error) {
        const errorText = formatError(error, "Unable to reach Fyn Assistant.");
        if (isCurrentSelection()) {
          setMessages((current) =>
            current.map((entry) =>
              entry.id === FYN_LOADING_MESSAGE_ID
                ? {
                    id: `assistant-error-${Date.now()}`,
                    role: "assistant",
                    text: errorText,
                    createdAt: new Date().toISOString(),
                  }
                : entry,
            ),
          );
        }
      } finally {
        if (isCurrentSelection()) {
          setSubmitting(false);
        }
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

      <Card
        accent={false}
        padding="compact"
        className={cn("space-y-4", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
      >
        <div className="space-y-2">
          <label
            htmlFor="fyn-athlete-select"
            className={DASHBOARD_PLANNING_FIELD_LABEL_CLASS}
          >
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
            <p className="text-sm text-textSecondary">
              Recent chats from the last 72 hours are shown for the selected athlete.
            </p>
            <Alert variant="info" role="status">
              Fyn processes one question at a time. Please wait for a response before sending your next question.
            </Alert>
            <FynComposer
              disabled={submitting}
              placeholder="Ask Fyn a question about this athlete"
              onSubmit={sendMessage}
            />
          </div>
        ) : (
          <p className="text-sm text-textSecondary">
            Select an athlete to start using Fyn Assistant.
          </p>
        )}
      </Card>

      {historyWarning ? <Alert variant="warning">{historyWarning}</Alert> : null}

      <Card
        accent={false}
        padding="compact"
        className={cn("space-y-3", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-textSecondary">
            Choose an athlete and ask Fyn a question.
          </p>
        ) : (
          <FynChatThread messages={messages} emptyState="" />
        )}
      </Card>
    </div>
  );
}
