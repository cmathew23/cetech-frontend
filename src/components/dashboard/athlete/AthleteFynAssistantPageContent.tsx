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
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  fetchFynAssistantHistory,
  getFynPromptLabel,
  queryFynAssistant,
  type FynAssistantPromptKey,
} from "@/lib/api/fynAssistant";
import { fetchAthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useCallback, useEffect, useState } from "react";

const FYN_LOADING_TEXT = "Fyn is checking your latest training data...";
const FYN_HISTORY_LOAD_WARNING =
  "Could not load recent Fyn history. You can still send a new prompt.";

const ATHLETE_FYN_PROMPTS: Array<FynPromptOption<FynAssistantPromptKey>> = [
  { key: "EXPLAIN_TODAYS_PLAN", label: "Explain today’s plan" },
  { key: "SUMMARIZE_MY_WEEK", label: "Summarize my week" },
  { key: "WHAT_HAVE_I_MISSED", label: "What have I missed?" },
  { key: "EXPLAIN_GOLF_METRICS", label: "Explain my Golf Metrics" },
];

function formatLoadError(error: unknown): string {
  if (isNormalizedApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Unable to reach Fyn Assistant.";
}

export function AthleteFynAssistantPageContent() {
  const { accessContext, accessGateReady, invitationAccessLocked } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers({ accessContext, accessGateReady });
  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";

  const [messages, setMessages] = useState<FynChatMessage[]>([]);
  const [historyWarning, setHistoryWarning] = useState<string | null>(null);
  const [trainingPlanVersionId, setTrainingPlanVersionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activePromptKey, setActivePromptKey] =
    useState<FynAssistantPromptKey>("SUMMARIZE_MY_WEEK");

  useEffect(() => {
    if (planningIds.phase !== "ready" || entityId === "" || athleteId === "") return;
    let cancelled = false;
    void (async () => {
      try {
        const journal = await fetchAthleteWeeklyPlanJournal(entityId, athleteId);
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
  }, [athleteId, entityId, planningIds.phase]);

  useEffect(() => {
    if (planningIds.phase !== "ready" || entityId === "" || athleteId === "") return;

    let cancelled = false;
    void (async () => {
      try {
        const history = await fetchFynAssistantHistory({
          entityId,
          athleteId,
          role: "athlete",
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
    })();

    return () => {
      cancelled = true;
    };
  }, [athleteId, entityId, planningIds.phase]);

  const sendPrompt = useCallback(
    async (promptKey: FynAssistantPromptKey, message?: string) => {
      if (entityId === "" || athleteId === "") return;

      const trimmedMessage = message?.trim() ?? "";
      const userLabel =
        trimmedMessage !== "" ? trimmedMessage : getFynPromptLabel(promptKey, "athlete");
      setSubmitting(true);
      setActivePromptKey(promptKey);
      setMessages((current) => [
        ...current,
        {
          id: `user-${Date.now()}`,
          role: "user",
          text: userLabel,
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
          athleteId,
          promptKey,
          message: trimmedMessage !== "" ? trimmedMessage : undefined,
          trainingPlanVersionId,
        });

        try {
          const history = await fetchFynAssistantHistory({
            entityId,
            athleteId,
            role: "athlete",
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
      } catch (nextError) {
        const errorText = formatLoadError(nextError);
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
    [athleteId, entityId, trainingPlanVersionId],
  );

  if (invitationAccessLocked) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Fyn Assistant"
          subtitle="Accept your academy invitation to unlock Fyn Assistant."
        />
        <Alert variant="warning">
          Fyn Assistant becomes available after you accept your academy invitation.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fyn Assistant"
        subtitle="Ask Fyn for simple explanations of your plan, week, and Golf Metrics."
      />

      <Card accent={false} padding="compact" className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-textSecondary">
            Choose a prompt or ask a short follow-up. Fyn is read-only in this view.
          </p>
          <FynPromptButtonBar
            prompts={ATHLETE_FYN_PROMPTS}
            disabled={submitting || planningIds.phase !== "ready"}
            onSelectPrompt={(promptKey) => void sendPrompt(promptKey)}
          />
          <FynComposer
            disabled={submitting || planningIds.phase !== "ready"}
            placeholder="Ask Fyn a follow-up"
            onSubmit={(message) => sendPrompt(activePromptKey, message)}
          />
        </div>
      </Card>

      {historyWarning ? <Alert variant="warning">{historyWarning}</Alert> : null}

      <FynChatThread
        messages={messages}
        emptyState="Start with one of the guided prompts above to get a simple answer from Fyn."
      />
    </div>
  );
}
