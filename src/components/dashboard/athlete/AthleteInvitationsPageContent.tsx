"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { useAuth } from "@/hooks/useAuth";
import type { MyEntityInvitationRow } from "@/lib/api/entityInvitationsMe";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatInviteDateDisplay } from "@/lib/dateTime";
import { routeFromAccessContext } from "@/lib/accessContext";
import { formatEnumeratedLabel } from "@/lib/textFormat";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function isPending(status: string): boolean {
  return status.trim().toUpperCase() === "PENDING";
}

function formatActionError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

function invitationStatusTone(
  status: string,
): "success" | "warning" | "neutral" | "error" | "accent" {
  const s = status.trim().toUpperCase();
  if (s === "ACCEPTED" || s === "ACTIVE") return "success";
  if (s === "PENDING" || s === "INVITED") return "warning";
  if (s === "DECLINED" || s === "REJECTED" || s === "EXPIRED") return "error";
  return "neutral";
}

async function afterSuccessAlertPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

const EMPTY_MESSAGE = "No pending invitations.";

const CARD_SURFACE =
  "overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]";

export function AthleteInvitationsPageContent() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const {
    invitations,
    loading,
    loadError,
    refreshInvitations,
    acceptInvitation,
    declineInvitation,
  } = useAthleteInvitationGate();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...invitations].sort((a, b) => {
        const rank = (s: string) => {
          const u = s.trim().toUpperCase();
          if (u === "PENDING") return 0;
          if (u === "ACCEPTED") return 1;
          return 2;
        };
        return rank(a.status) - rank(b.status);
      }),
    [invitations],
  );

  async function runAccept(id: string, navigateAfter: boolean) {
    setActionError(null);
    setActionSuccess(null);
    setBusyKey(`${id}:accept`);
    try {
      await acceptInvitation(id);
      setActionSuccess("Invitation accepted.");
      await afterSuccessAlertPaint();
      if (navigateAfter) {
        const session = await refreshSession();
        const nextRoute = routeFromAccessContext(session?.accessContext);
        if (nextRoute && nextRoute !== "/athlete/dashboard/invitations") {
          router.replace(nextRoute);
        }
      }
    } catch (e) {
      setActionError(formatActionError(e));
    } finally {
      setBusyKey(null);
    }
  }

  async function runDecline(id: string) {
    setActionError(null);
    setActionSuccess(null);
    setBusyKey(`${id}:decline`);
    try {
      await declineInvitation(id);
      setActionSuccess("Invitation declined.");
      await afterSuccessAlertPaint();
    } catch (e) {
      setActionError(formatActionError(e));
    } finally {
      setBusyKey(null);
    }
  }

  function renderRow(item: MyEntityInvitationRow) {
    const entityLabel =
      item.entityName.trim() !== "" ? item.entityName.trim() : "—";
    const roleLabel =
      item.role.trim() !== "" ? formatEnumeratedLabel(item.role.trim()) : "—";
    const sentDisplay = formatInviteDateDisplay(item.createdAt);

    return (
      <tr key={item.id} className="group align-top">
        <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
          <div className="space-y-1">
            <p
              className="max-w-[22rem] truncate text-sm font-semibold text-slate-900"
              title={entityLabel}
            >
              {entityLabel}
            </p>
            <p className="text-xs text-slate-500">
              Role: {roleLabel} • Sent: {sentDisplay}
            </p>
          </div>
        </td>
        <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
          <StatusBadge
            status={item.status}
            variant={invitationStatusTone(item.status)}
            className="rounded-md px-2.5 py-1 text-xs font-medium"
          >
            {item.status.trim() !== ""
              ? formatEnumeratedLabel(item.status.trim())
              : "—"}
          </StatusBadge>
        </td>
        <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-5 py-5 text-right group-hover:bg-slate-50/70">
          {isPending(item.status) ? (
            <div className="flex flex-wrap items-start justify-end gap-2">
              <Button
                type="button"
                variant="primary"
                className="px-4 py-2 text-xs sm:text-sm"
                loading={busyKey === `${item.id}:accept`}
                disabled={busyKey !== null}
                onClick={() => void runAccept(item.id, true)}
              >
                Accept
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-2 text-xs sm:text-sm"
                loading={busyKey === `${item.id}:decline`}
                disabled={busyKey !== null}
                onClick={() => void runDecline(item.id)}
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
  }

  if (loading) {
    return (
      <div className={CARD_SURFACE}>
        <p className="px-6 py-6 text-sm text-slate-500">Loading invitations…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <Alert variant="danger">{loadError}</Alert>
        <div className={CARD_SURFACE}>
          <div className="px-6 py-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void refreshInvitations()}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionSuccess ? (
        <Alert variant="success" role="status">
          {actionSuccess}
        </Alert>
      ) : null}

      {actionError ? <Alert variant="danger">{actionError}</Alert> : null}

      {sorted.length === 0 ? (
        <div className={CARD_SURFACE}>
          <p className="px-6 py-6 text-sm text-slate-500">{EMPTY_MESSAGE}</p>
        </div>
      ) : (
        <div className={CARD_SURFACE}>
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
            <tbody>{sorted.map(renderRow)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
