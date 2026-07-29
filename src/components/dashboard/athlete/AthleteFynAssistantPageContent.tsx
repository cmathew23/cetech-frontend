"use client";

import {
  FYN_LOADING_MESSAGE_ID,
  FynChatThread,
  type FynChatMessage,
} from "@/components/fyn/FynChatThread";

import { FynComposer } from "@/components/fyn/FynComposer";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  fetchFynAssistantHistory,
  queryFynAssistant,
} from "@/lib/api/fynAssistant";
import { fetchAthleteWeeklyPlanJournal } from "@/lib/api/coachAthletePlanningReadiness";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useCallback, useEffect, useState } from "react";

const FYN_LOADING_TEXT = "Fyn is checking your latest training data...";
const FYN_HISTORY_LOAD_WARNING =
  "Could not load recent Fyn history. You can still send a new prompt.";

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

  const sendMessage = useCallback(
    async (message: string) => {
      if (entityId === "" || athleteId === "") return;

      const createdAt = new Date().toISOString();
      const trimmedMessage = message.trim();
      if (trimmedMessage === "") return;
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
          entityId,
          athleteId,
          message: trimmedMessage,
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
                createdAt: new Date().toISOString(),
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
                  createdAt: new Date().toISOString(),
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

      <Card
        accent={false}
        padding="compact"
        className={cn("space-y-4", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
      >
        <div className="space-y-3">
          <p className="text-sm text-textSecondary">
            Ask Fyn a question. Fyn is read-only in this view.
          </p>
          <p className="text-sm text-textSecondary">
            Recent chats from the last 72 hours are shown here.
          </p>
          <FynComposer
            disabled={submitting || planningIds.phase !== "ready"}
            placeholder="Ask Fyn a question"
            onSubmit={sendMessage}
          />
        </div>
      </Card>

      {historyWarning ? <Alert variant="warning">{historyWarning}</Alert> : null}

      <Card
        accent={false}
        padding="compact"
        className={cn("space-y-3", DASHBOARD_MAJOR_OUTER_CARD_CLASS)}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-textSecondary">
            Ask Fyn a question to start a conversation.
          </p>
        ) : (
          <FynChatThread messages={messages} emptyState="" />
        )}
      </Card>
    </div>
  );
}
