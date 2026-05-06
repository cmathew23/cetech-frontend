"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Button } from "@/components/ui/Button";
import type { MyEntityInvitationRow } from "@/lib/api/entityInvitationsMe";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatInviteDateDisplay } from "@/lib/dateTime";
import { useState } from "react";

function formatActionError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

export function AthletePendingInvitationCard({
  invitation,
  onAccept,
  onDecline,
}: {
  invitation: MyEntityInvitationRow;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <DashboardCardShell title="Pending Invitation">
      <div className="space-y-2">
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-sm text-textSecondary">
          Organization:{" "}
          <span className="font-medium text-textPrimary">
            {invitation.entityName.trim() !== "" ? invitation.entityName : "—"}
          </span>
        </p>
        <p className="text-sm text-textSecondary">
          Role:{" "}
          <span className="font-medium text-textPrimary">
            {invitation.role.trim() !== "" ? invitation.role : "—"}
          </span>
        </p>
        <p className="text-sm text-textSecondary">
          Invited:{" "}
          <span className="font-medium text-textPrimary">
            {formatInviteDateDisplay(invitation.createdAt)}
          </span>
        </p>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            loading={busy === "accept"}
            disabled={busy !== null}
            onClick={() =>
              void (async () => {
                setError(null);
                setBusy("accept");
                try {
                  await onAccept();
                } catch (e) {
                  setError(formatActionError(e));
                } finally {
                  setBusy(null);
                }
              })()
            }
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={busy === "decline"}
            disabled={busy !== null}
            onClick={() =>
              void (async () => {
                setError(null);
                setBusy("decline");
                try {
                  await onDecline();
                } catch (e) {
                  setError(formatActionError(e));
                } finally {
                  setBusy(null);
                }
              })()
            }
          >
            Decline
          </Button>
        </div>
      </div>
    </DashboardCardShell>
  );
}
