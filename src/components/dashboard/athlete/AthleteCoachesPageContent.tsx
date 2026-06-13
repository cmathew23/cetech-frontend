"use client";

import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { AppContextAssignedCoach } from "@/lib/accessContext";
import { formatEnumeratedLabel, formatPersonNameForDisplay } from "@/lib/textFormat";
import { useMemo } from "react";

const COACHES_TABLE_CARD = cn(
  "overflow-x-auto rounded-2xl border bg-white",
  DASHBOARD_MAJOR_OUTER_CARD_CLASS,
);

const BADGE_SOFT = "rounded-md px-2.5 py-1 text-xs font-medium";

function coachDisplayName(c: AppContextAssignedCoach): string {
  return c.coachName.trim() !== ""
    ? formatPersonNameForDisplay(c.coachName)
    : "—";
}

function coachSecondaryLine(c: AppContextAssignedCoach): string {
  const email = c.email.trim();
  if (email !== "") return email;
  const role = c.coachRole.trim();
  if (role !== "") return formatEnumeratedLabel(role);
  return "—";
}

export function AthleteCoachesPageContent() {
  const { accessGateReady, accessContext } = useAuth();

  const coaches = useMemo(
    () => accessContext?.assignedCoaches ?? [],
    [accessContext?.assignedCoaches],
  );

  const loading = !accessGateReady;

  return (
    <>
      {loading ? (
        <div className={COACHES_TABLE_CARD}>
          <p className="px-6 py-6 text-sm text-slate-500">Loading coaches…</p>
        </div>
      ) : coaches.length === 0 ? (
        <div className={COACHES_TABLE_CARD}>
          <p className="px-6 py-6 text-sm text-slate-500">
            No coaches assigned yet.
          </p>
        </div>
      ) : (
        <div className={COACHES_TABLE_CARD}>
          <table className="w-full min-w-[640px] border-separate [border-spacing:0_6px] text-left">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wide text-slate-500">
                  Coach
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500">
                  Academy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500">
                  Phone
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((c, idx) => {
                const name = coachDisplayName(c);
                const secondary = coachSecondaryLine(c);
                const hasEmail = c.email.trim() !== "";
                const hasRole = c.coachRole.trim() !== "";
                const roleLabel = formatEnumeratedLabel(c.coachRole);
                const functionLabel = formatEnumeratedLabel(c.coachFunction);
                const roleDuplicatedInSubtitle = !hasEmail && hasRole;

                return (
                  <tr key={`${c.coachId}-${idx}`} className="group align-top">
                    <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                      <div className="space-y-1">
                        <p
                          className="max-w-[22rem] truncate text-sm font-normal text-slate-900"
                          title={name}
                        >
                          {name}
                        </p>
                        <p
                          className="max-w-[22rem] truncate text-xs text-slate-500"
                          title={secondary}
                        >
                          {secondary}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {!roleDuplicatedInSubtitle ? (
                            <StatusBadge variant="neutral" className={BADGE_SOFT}>
                              {roleLabel}
                            </StatusBadge>
                          ) : null}
                          <StatusBadge variant="neutral" className={BADGE_SOFT}>
                            {functionLabel}
                          </StatusBadge>
                        </div>
                      </div>
                    </td>
                    <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                      <p className="max-w-[16rem] text-sm text-slate-700">
                        {c.trainingEntityName}
                      </p>
                    </td>
                    <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                      <p className="text-sm text-slate-600">
                        {c.phone ?? "Unavailable"}
                      </p>
                    </td>
                    <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-5 py-5 group-hover:bg-slate-50/70">
                      <StatusBadge
                        status={c.status}
                        className={BADGE_SOFT}
                      >
                        {formatEnumeratedLabel(c.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
