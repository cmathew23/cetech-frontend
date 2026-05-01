"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  acceptInvitation,
  declineInvitation,
  fetchMyInvitations,
  type MyPendingInvitation,
} from "@/lib/api/invitations";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  formatEnumeratedLabel,
  formatPersonNameForDisplay,
} from "@/lib/textFormat";
import { useEffect, useState } from "react";

const LOADING_INVITATIONS = "Loading invitations…";

function formatInvitationError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

export function InvitationInboxSection({
  title = "Invitations",
  className,
  onActionComplete,
  showTitle = true,
  emptyMessage = "No pending invitations.",
}: {
  title?: string;
  className?: string;
  onActionComplete?: () => Promise<void> | void;
  showTitle?: boolean;
  emptyMessage?: string;
}) {
  const [invitations, setInvitations] = useState<MyPendingInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actingInvitationId, setActingInvitationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInvitations() {
      setInvitationsLoading(true);
      setInvitationsError(null);
      try {
        const rows = await fetchMyInvitations();
        if (!cancelled) {
          setInvitations(rows);
        }
      } catch (e) {
        if (!cancelled) {
          setInvitations([]);
          setInvitationsError(
            formatInvitationError(e, "Could not load invitations."),
          );
        }
      } finally {
        if (!cancelled) {
          setInvitationsLoading(false);
        }
      }
    }

    void loadInvitations();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshInvitations() {
    const rows = await fetchMyInvitations();
    setInvitations(rows);
  }

  /** Yield so React can commit the success Alert before optional parent follow-up. */
  async function afterSuccessAlertPaint() {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  async function handleAccept(invitationId: string) {
    if (actingInvitationId !== null) return;
    setActionError(null);
    setActionSuccess(null);
    setActingInvitationId(invitationId);
    try {
      await acceptInvitation(invitationId);
      await refreshInvitations();
      setActionSuccess("Invitation accepted.");
      await afterSuccessAlertPaint();
      if (onActionComplete) await onActionComplete();
    } catch (e) {
      setActionError(formatInvitationError(e, "Could not accept invitation."));
    } finally {
      setActingInvitationId(null);
    }
  }

  async function handleDecline(invitationId: string) {
    if (actingInvitationId !== null) return;
    setActionError(null);
    setActionSuccess(null);
    setActingInvitationId(invitationId);
    try {
      await declineInvitation(invitationId);
      await refreshInvitations();
      setActionSuccess("Invitation declined.");
      await afterSuccessAlertPaint();
      if (onActionComplete) await onActionComplete();
    } catch (e) {
      setActionError(formatInvitationError(e, "Could not decline invitation."));
    } finally {
      setActingInvitationId(null);
    }
  }

  return (
    <section className={className}>
      {showTitle ? (
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      ) : null}
      {actionError ? (
        <Alert variant="danger" className="mt-3">
          {actionError}
        </Alert>
      ) : null}
      {actionSuccess ? (
        <Alert variant="success" className="mt-3" role="status">
          {actionSuccess}
        </Alert>
      ) : null}
      {invitationsError ? (
        <Alert variant="danger" className="mt-3">
          {invitationsError}
        </Alert>
      ) : null}
      {invitationsLoading ? (
        <p className="mt-3 text-sm text-gray-500">{LOADING_INVITATIONS}</p>
      ) : null}
      {!invitationsLoading && !invitationsError && invitations.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyMessage}</p>
      ) : null}
      {!invitationsLoading && !invitationsError && invitations.length > 0 ? (
        <div className="mt-3 space-y-3">
          {invitations.map((row) => (
            <article
              key={row.invitationId}
              className="rounded-md border border-border p-3"
            >
              <div className="space-y-1 text-sm">
                <p className="font-medium text-textPrimary">
                  {row.entityName.trim() !== ""
                    ? formatPersonNameForDisplay(row.entityName.trim())
                    : "—"}
                </p>
                <p className="text-textSecondary">
                  Role: {formatEnumeratedLabel(row.role)}
                </p>
                <p className="text-textSecondary">
                  Status: {formatEnumeratedLabel(row.status)}
                </p>
                <p className="text-textSecondary">Invited by: {row.inviter}</p>
                <p className="text-textSecondary">Invited: {row.createdAt}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  loading={actingInvitationId === row.invitationId}
                  disabled={actingInvitationId !== null}
                  onClick={() => void handleAccept(row.invitationId)}
                >
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={actingInvitationId !== null}
                  onClick={() => void handleDecline(row.invitationId)}
                >
                  Decline
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
