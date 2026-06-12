"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { useAthletePageReady } from "@/components/dashboard/athlete/AthletePageReadyContext";
import { useAuth } from "@/hooks/useAuth";
import {
  createOrFindChatConversation,
  getAthleteChatCoaches,
  type AthleteChatCoach,
  type ChatConversationSummary,
} from "@/lib/api/chat";
import { requestChatUnreadRefresh } from "@/hooks/useChatUnreadCount";
import { formatPersonNameForDisplay } from "@/lib/textFormat";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

const EMPTY_STATE_MESSAGE =
  "Chat becomes available after you are assigned to an active coach.";

function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
}

export function AthleteChatPageContent() {
  const { accessContext, accessGateReady } = useAuth();
  const { markPageReady } = useAthletePageReady();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<AthleteChatCoach[]>([]);
  const [selectedCoachProfileId, setSelectedCoachProfileId] = useState("");
  const [conversation, setConversation] = useState<ChatConversationSummary | null>(
    null,
  );
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [hasLoadedCoachOptions, setHasLoadedCoachOptions] = useState(false);

  const athleteName = useMemo(() => {
    const source =
      accessContext?.user.displayName ||
      accessContext?.user.fullName ||
      accessContext?.user.name ||
      [accessContext?.user.firstName ?? "", accessContext?.user.lastName ?? ""]
        .filter(Boolean)
        .join(" ");
    const trimmed = source?.trim() ?? "";
    return trimmed !== "" ? formatPersonNameForDisplay(trimmed) : "";
  }, [accessContext?.user]);

  useEffect(() => {
    if (!accessGateReady) return;

    let cancelled = false;

    async function loadCoaches() {
      setLoading(true);
      setLoadError(null);
      try {
        console.log("[AthleteChat] GET /api/chat/athlete/coaches");
        const rows = await getAthleteChatCoaches();
        console.log("[AthleteChat] response:", rows);
        if (cancelled) return;
        setCoaches(Array.isArray(rows) ? rows : []);
        setHasLoadedCoachOptions(true);
      } catch (error) {
        if (cancelled) return;
        console.error("[AthleteChat] GET /api/chat/athlete/coaches error:", error);
        setCoaches([]);
        setLoadError(
          formatApiError(error, "Could not load chat coaches. Try again shortly."),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCoaches();

    return () => {
      cancelled = true;
    };
  }, [accessGateReady]);

  useEffect(() => {
    if (!hasLoadedCoachOptions) return;
    markPageReady();
    requestChatUnreadRefresh();
  }, [hasLoadedCoachOptions, markPageReady]);

  useEffect(() => {
    if (selectedCoachProfileId === "") {
      setConversation(null);
      setConversationError(null);
      return;
    }

    let cancelled = false;

    async function openConversation() {
      setConversationLoading(true);
      setConversationError(null);
      try {
        console.log("[AthleteChat] POST /api/chat/conversations", {
          coachProfileId: selectedCoachProfileId,
        });
        const result = await createOrFindChatConversation({
          coachProfileId: selectedCoachProfileId,
        });
        console.log("[AthleteChat] conversation created:", result);
        if (cancelled) return;
        setConversation(result);
      } catch (error) {
        if (cancelled) return;
        console.error("[AthleteChat] POST /api/chat/conversations error:", error);
        setConversation(null);
        setConversationError(
          formatApiError(
            error,
            "Could not open the coach conversation. Try again shortly.",
          ),
        );
      } finally {
        if (!cancelled) setConversationLoading(false);
      }
    }

    void openConversation();

    return () => {
      cancelled = true;
    };
  }, [selectedCoachProfileId]);

  const selectedCoach =
    coaches.find((coach) => coach.coachProfileId === selectedCoachProfileId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat with Coach"
        subtitle="Send and receive text messages with an eligible coach."
        trailing={<AthleteHeaderIdentityMetadata />}
      />

      {loadError ? <Alert variant="danger">{loadError}</Alert> : null}

      <Card accent={false} className="space-y-4">
        {loading || !accessGateReady ? (
          <p className="text-sm text-textSecondary">Loading chat availability…</p>
        ) : coaches.length === 0 ? (
          <p className="text-sm text-textSecondary">{EMPTY_STATE_MESSAGE}</p>
        ) : (
          <FormField
            id="athlete-chat-coach"
            label="Coach"
            helperText="Choose the coach you want to chat with."
          >
            <Select
              id="athlete-chat-coach"
              value={selectedCoachProfileId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setSelectedCoachProfileId(event.target.value)
              }
            >
              <option value="">Select a coach</option>
              {coaches.map((coach) => (
                <option key={coach.coachProfileId} value={coach.coachProfileId}>
                  {formatPersonNameForDisplay(coach.coachName)}
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </Card>

      {conversationError ? <Alert variant="danger">{conversationError}</Alert> : null}

      {conversationLoading ? (
        <Card accent={false}>
          <p className="text-sm text-textSecondary">Opening conversation…</p>
        </Card>
      ) : conversation ? (
        <ChatPanel
          conversationId={conversation.conversationId}
          athleteName={conversation.athleteName || athleteName}
          coachName={
            conversation.coachName ||
            (selectedCoach ? formatPersonNameForDisplay(selectedCoach.coachName) : "—")
          }
          currentUserRole="ATHLETE"
        />
      ) : null}
    </div>
  );
}
