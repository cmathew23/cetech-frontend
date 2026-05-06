"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  acceptInvitation,
  declineInvitation,
  fetchMyInvitations,
  type MyPendingInvitation,
} from "@/lib/api/invitations";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatInviteDateDisplay } from "@/lib/dateTime";
import { formatEnumeratedLabel } from "@/lib/textFormat";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

const LOADING_INVITATIONS = "Loading invitations…";

function formatInvitationError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

function invitationStatusTone(
  status: string,
): "success" | "warning" | "neutral" | "error" | "accent" {
  const s = status.trim().toUpperCase();
  if (s === "ACCEPTED" || s === "ACTIVE") {
    return "success";
  }
  if (s === "PENDING" || s === "INVITED") {
    return "warning";
  }
  if (s === "EXPIRED" || s === "DECLINED" || s === "REJECTED") {
    return "error";
  }
  return "neutral";
}

function primaryInvitationLabel(row: MyPendingInvitation): string {
  const candidate = row.entityName.trim();
  return candidate !== "" ? candidate : "—";
}

/** Matches athlete invitations: actionable rows only while status is pending. */
function isPendingInvitation(status: string): boolean {
  return status.trim().toUpperCase() === "PENDING";
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
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const rows = await fetchMyInvitations();
      setInvitations(rows);
    } catch (e) {
      setInvitations([]);
      setInvitationsError(
        formatInvitationError(e, "Could not load invitations."),
      );
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

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
    if (busyKey !== null) return;
    setActionError(null);
    setActionSuccess(null);
    setBusyKey(`${invitationId}:accept`);
    try {
      await acceptInvitation(invitationId);
      await refreshInvitations();
      setActionSuccess("Invitation accepted.");
      await afterSuccessAlertPaint();
      if (onActionComplete) await onActionComplete();
    } catch (e) {
      setActionError(formatInvitationError(e, "Could not accept invitation."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDecline(invitationId: string) {
    if (busyKey !== null) return;
    setActionError(null);
    setActionSuccess(null);
    setBusyKey(`${invitationId}:decline`);
    try {
      await declineInvitation(invitationId);
      await refreshInvitations();
      setActionSuccess("Invitation declined.");
      await afterSuccessAlertPaint();
      if (onActionComplete) await onActionComplete();
    } catch (e) {
      setActionError(formatInvitationError(e, "Could not decline invitation."));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className={cn("space-y-3", className)}>
      {showTitle ? (
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      ) : null}
      {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
      {actionSuccess ? (
        <Alert variant="success" role="status">
          {actionSuccess}
        </Alert>
      ) : null}
      {invitationsError ? <Alert variant="danger">{invitationsError}</Alert> : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        {invitationsLoading ? (
          <p className="px-6 py-6 text-sm text-slate-500">{LOADING_INVITATIONS}</p>
        ) : null}
        {!invitationsLoading && invitationsError ? (
          <div className="px-6 py-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadInvitations()}
            >
              Try again
            </Button>
          </div>
        ) : null}
        {!invitationsLoading && !invitationsError && invitations.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">{emptyMessage}</p>
        ) : null}
        {!invitationsLoading && !invitationsError && invitations.length > 0 ? (
          <table className="w-full min-w-[700px] border-separate [border-spacing:0_6px] text-left">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wide text-slate-500">
                  Invitation
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((row) => {
                const sentDisplay = formatInviteDateDisplay(row.createdAt);
                const pending = isPendingInvitation(row.status);

                return (
                  <tr key={row.invitationId} className="group align-top">
                    <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                      <div className="space-y-1">
                        <p
                          className="max-w-[22rem] truncate text-sm font-semibold text-slate-900"
                          title={primaryInvitationLabel(row)}
                        >
                          {primaryInvitationLabel(row)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Role: {formatEnumeratedLabel(row.role)} • Sent:{" "}
                          {sentDisplay}
                        </p>
                        {row.inviter.trim() !== "" && row.inviter !== "—" ? (
                          <p className="text-xs text-slate-500">
                            Invited by: {row.inviter}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                      <StatusBadge
                        status={row.status}
                        variant={invitationStatusTone(row.status)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium"
                      >
                        {formatEnumeratedLabel(row.status)}
                      </StatusBadge>
                    </td>
                    <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-5 py-5 text-right group-hover:bg-slate-50/70">
                      {pending ? (
                        <div className="flex flex-wrap items-start justify-end gap-2">
                          <Button
                            type="button"
                            variant="primary"
                            className="px-4 py-2 text-xs sm:text-sm"
                            loading={busyKey === `${row.invitationId}:accept`}
                            disabled={busyKey !== null}
                            onClick={() => void handleAccept(row.invitationId)}
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-4 py-2 text-xs sm:text-sm"
                            loading={busyKey === `${row.invitationId}:decline`}
                            disabled={busyKey !== null}
                            onClick={() =>
                              void handleDecline(row.invitationId)
                            }
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
