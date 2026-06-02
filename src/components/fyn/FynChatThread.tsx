"use client";

import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { FynAvatar } from "@/components/fyn/FynAvatar";

export const FYN_LOADING_MESSAGE_ID = "__fyn_loading__";

export type FynChatMessage = {
  id: string;
  role: "user" | "assistant" | "loading";
  text: string;
  warnings?: string[];
  usedSources?: {
    plan: boolean;
    adherence: boolean;
    sportMetrics: boolean;
    wearables: boolean;
  };
};

function sourceLabels(usedSources: FynChatMessage["usedSources"]): string[] {
  if (!usedSources) return [];
  const labels: string[] = [];
  if (usedSources.plan) labels.push("Plan");
  if (usedSources.adherence) labels.push("Adherence");
  if (usedSources.sportMetrics) labels.push("Golf Metrics");
  if (usedSources.wearables) labels.push("Wearables");
  return labels;
}

export function FynChatThread({
  messages,
  emptyState,
}: {
  messages: FynChatMessage[];
  emptyState: string;
}) {
  if (messages.length === 0) {
    return (
      <Card accent={false} padding="compact" className="bg-bg">
        <p className="text-sm text-textSecondary">{emptyState}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const sources = sourceLabels(message.usedSources);
        return (
          <Card
            key={message.id}
            accent={false}
            padding="compact"
            className={
              message.role === "assistant" || message.role === "loading"
                ? "bg-bg"
                : "bg-slate-50"
            }
          >
            <div className="flex items-start gap-3">
              {message.role === "assistant" || message.role === "loading" ? (
                <FynAvatar className="mt-0.5 h-8 w-8 sm:h-10 sm:w-10" />
              ) : (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 sm:h-10 sm:w-10 sm:text-sm">
                  You
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-textPrimary">
                    {message.role === "assistant" || message.role === "loading"
                      ? "Fyn"
                      : "You"}
                  </p>
                </div>
                {message.role === "loading" ? (
                  <p className="text-sm text-textPrimary">
                    <span>{message.text}</span>
                    <span className="inline-flex gap-0.5" aria-hidden="true">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse [animation-delay:150ms]">.</span>
                      <span className="animate-pulse [animation-delay:300ms]">.</span>
                    </span>
                  </p>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-textPrimary">
                    {message.text}
                  </p>
                )}
                {message.warnings && message.warnings.length > 0 ? (
                  <div className="space-y-2">
                    {message.warnings.map((warning, index) => (
                      <Alert key={`${message.id}-warning-${index}`} variant="warning">
                        {warning}
                      </Alert>
                    ))}
                  </div>
                ) : null}
                {sources.length > 0 ? (
                  <p className="text-xs text-textSecondary">
                    Used sources: {sources.join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
