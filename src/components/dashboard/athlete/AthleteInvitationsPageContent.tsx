"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import type { MyEntityInvitationRow } from "@/lib/api/entityInvitationsMe";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function statusBadgeClass(status: string): string {
  const u = status.trim().toUpperCase();
  if (u === "PENDING") return "bg-warning/15 text-warning";
  if (u === "ACCEPTED") return "bg-primaryLight text-primaryDark";
  if (u === "DECLINED") return "bg-danger/15 text-danger";
  if (u === "REVOKED" || u === "EXPIRED")
    return "bg-zinc-100 text-zinc-700";
  return "bg-gray-100 text-gray-700";
}

function formatInviteDate(createdAt: string): string {
  const t = createdAt.trim();
  if (t === "") return "—";
  const d = new Date(t);
  return Number.isNaN(d.getTime())
    ? t
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function isPending(status: string): boolean {
  return status.trim().toUpperCase() === "PENDING";
}

function formatActionError(e: unknown): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

async function afterSuccessAlertPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function AthleteInvitationsPageContent() {
  const router = useRouter();
  const {
    invitations,
    loading,
    loadError,
    refreshInvitations,
    refreshMembershipFromServer,
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

  const pendingRows = useMemo(
    () => sorted.filter((item) => isPending(item.status)),
    [sorted],
  );
  const otherRows = useMemo(
    () => sorted.filter((item) => !isPending(item.status)),
    [sorted],
  );
  const hasPending = pendingRows.length > 0;

  async function runAccept(id: string, navigateAfter: boolean) {
    setActionError(null);
    setActionSuccess(null);
    setBusyKey(`${id}:accept`);
    try {
      await acceptInvitation(id);
      setActionSuccess("Invitation accepted.");
      await afterSuccessAlertPaint();
      if (navigateAfter) router.replace("/athlete/dashboard");
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
    return (
      <article
        key={item.id}
        className="rounded-lg border border-border bg-bg p-3 md:p-4"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-textPrimary">
              {item.entityName.trim() !== "" ? item.entityName : "—"}
            </p>
            <p className="text-sm text-textSecondary">
              Role: {item.role.trim() !== "" ? item.role : "—"}
            </p>
            <p className="text-sm text-textSecondary">
              Invited: {formatInviteDate(item.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-medium ${statusBadgeClass(item.status)}`}
          >
            {item.status.trim() !== "" ? item.status : "—"}
          </span>
        </div>
        {isPending(item.status) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              loading={busyKey === `${item.id}:accept`}
              disabled={busyKey !== null}
              onClick={() => void runAccept(item.id, true)}
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={busyKey === `${item.id}:decline`}
              disabled={busyKey !== null}
              onClick={() => void runDecline(item.id)}
            >
              Decline
            </Button>
          </div>
        ) : null}
      </article>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-textSecondary">
        Loading invitations…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert variant="danger">{loadError}</Alert>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            void (async () => {
              await refreshInvitations();
              await refreshMembershipFromServer();
            })()
          }
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionSuccess ? (
        <Alert variant="success" role="status">
          {actionSuccess}
        </Alert>
      ) : null}

      {actionError ? (
        <DashboardCardShell title="Could not update invitation">
          <p className="text-sm text-danger">{actionError}</p>
        </DashboardCardShell>
      ) : null}

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg px-4 py-12 text-center">
          <p className="text-sm text-textSecondary">
            There are no invitations currently.
          </p>
        </div>
      ) : (
        <>
          {hasPending ? (
            <DashboardCardShell
              title="Pending Invitations"
              className="border-warning/35 bg-warning/5"
            >
              <div className="space-y-3">{pendingRows.map(renderRow)}</div>
            </DashboardCardShell>
          ) : null}
          {otherRows.length > 0 ? (
            <DashboardCardShell title="Invitations">
              <div className="space-y-3">{otherRows.map(renderRow)}</div>
            </DashboardCardShell>
          ) : null}
        </>
      )}
    </div>
  );
}
