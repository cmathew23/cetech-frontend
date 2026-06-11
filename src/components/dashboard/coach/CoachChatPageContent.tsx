"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import {
  createOrFindChatConversation,
  getCoachChatAthletes,
  type ChatConversationSummary,
  type CoachChatAthlete,
} from "@/lib/api/chat";
import { formatPersonNameForDisplay } from "@/lib/textFormat";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

const EMPTY_STATE_MESSAGE =
  "Chat becomes available after an athlete is actively assigned to you.";

function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
}

export function CoachChatPageContent() {
  const { accessContext, accessGateReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<CoachChatAthlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [conversation, setConversation] = useState<ChatConversationSummary | null>(
    null,
  );
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);

  const coachName = useMemo(() => {
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
    let cancelled = false;

    async function loadAthletes() {
      setLoading(true);
      setLoadError(null);
      try {
        if (process.env.NODE_ENV === "development") {
          console.debug("[CoachChat] GET /api/chat/coach/athletes");
        }
        const athleteRows = await getCoachChatAthletes();
        if (process.env.NODE_ENV === "development") {
          console.debug("[CoachChat] parsed athletes:", athleteRows);
        }
        if (cancelled) return;
        setAthletes(Array.isArray(athleteRows) ? athleteRows : []);
      } catch (error) {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.error("[CoachChat] GET /api/chat/coach/athletes error:", error);
        }
        setAthletes([]);
        setLoadError(
          formatApiError(error, "Could not load chat athletes. Try again shortly."),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAthletes();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedAthleteId === "") {
      setConversation(null);
      setConversationError(null);
      return;
    }

    let cancelled = false;

    async function openConversation() {
      setConversationLoading(true);
      setConversationError(null);
      try {
        if (process.env.NODE_ENV === "development") {
          console.debug("[CoachChat] POST /api/chat/conversations", {
            athleteProfileId: selectedAthleteId,
          });
        }
        const result = await createOrFindChatConversation({
          athleteProfileId: selectedAthleteId,
        });
        if (cancelled) return;
        setConversation(result);
      } catch (error) {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.error("[CoachChat] POST /api/chat/conversations error:", error);
        }
        setConversation(null);
        setConversationError(
          formatApiError(
            error,
            "Could not open the athlete conversation. Try again shortly.",
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
  }, [selectedAthleteId]);

  const selectedAthlete =
    athletes.find((athlete) => athlete.athleteProfileId === selectedAthleteId) ?? null;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Chat with Athlete"
        subtitle="Send and receive text messages with an eligible athlete."
      />

      {loadError ? <Alert variant="danger">{loadError}</Alert> : null}

      <Card accent={false} className="space-y-4">
        {loading || !accessGateReady ? (
          <p className="text-sm text-textSecondary">Loading chat availability…</p>
        ) : athletes.length === 0 ? (
          <p className="text-sm text-textSecondary">{EMPTY_STATE_MESSAGE}</p>
        ) : (
          <FormField
            id="coach-chat-athlete"
            label="Athlete"
            helperText="Choose the athlete you want to chat with."
          >
            <Select
              id="coach-chat-athlete"
              value={selectedAthleteId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setSelectedAthleteId(event.target.value)
              }
            >
              <option value="">Select an athlete</option>
              {athletes.map((athlete) => (
                <option
                  key={athlete.athleteProfileId}
                  value={athlete.athleteProfileId}
                >
                  {formatPersonNameForDisplay(athlete.athleteName)}
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
          athleteName={
            conversation.athleteName ||
            (selectedAthlete
              ? formatPersonNameForDisplay(selectedAthlete.athleteName)
              : "—")
          }
          coachName={conversation.coachName || coachName}
          currentUserRole="COACH"
        />
      ) : null}
    </div>
  );
}
