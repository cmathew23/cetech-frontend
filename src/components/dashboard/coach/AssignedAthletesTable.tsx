"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CoachAssignedAthleteRow } from "@/lib/api/coachMe";
import { formatEnumeratedLabel, formatPersonNameForDisplay } from "@/lib/textFormat";
import { useMemo, useState } from "react";

/** Stable filter values (not derived from roster data) */
const ROSTER_STATUS_FILTER_OPTIONS = ["all", "active", "pending", "inactive"] as const;
type RosterStatusFilter = (typeof ROSTER_STATUS_FILTER_OPTIONS)[number];

const ROSTER_FILTER_LABELS: Record<RosterStatusFilter, string> = {
  all: "All",
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
};

/**
 * Buckets for lifecycle (Athlete status) and membershipStatus (Membership) independently.
 * Unknown, null-equivalent, or empty → inactive.
 */
function bucketRosterStatusField(raw: string): Exclude<RosterStatusFilter, "all"> {
  const u = raw.trim().toUpperCase();
  if (u === "" || u === "—") return "inactive";
  if (["ACTIVE", "ACCEPTED", "COMPLETED"].includes(u)) return "active";
  if (["PENDING", "WAITLISTED", "IN_PROGRESS"].includes(u)) return "pending";
  if (
    ["DECLINED", "EXPIRED", "REMOVED", "REVOKED", "ARCHIVED", "INACTIVE"].includes(u)
  ) {
    return "inactive";
  }
  return "inactive";
}

function matchesRosterFilter(
  raw: string,
  choice: RosterStatusFilter,
  bucket: (value: string) => Exclude<RosterStatusFilter, "all">,
): boolean {
  if (choice === "all") return true;
  return bucket(raw) === choice;
}

export function AssignedAthletesTable({
  loading,
  error,
  athletes,
}: {
  loading: boolean;
  error: string | null;
  athletes: CoachAssignedAthleteRow[];
}) {
  const [lifecycleFilter, setLifecycleFilter] = useState<RosterStatusFilter>("all");
  const [membershipFilter, setMembershipFilter] = useState<RosterStatusFilter>("all");

  const filteredAthletes = useMemo(() => {
    return athletes.filter(
      (row) =>
        matchesRosterFilter(row.lifecycle, lifecycleFilter, bucketRosterStatusField) &&
        matchesRosterFilter(
          row.membershipStatus,
          membershipFilter,
          bucketRosterStatusField,
        ),
    );
  }, [athletes, lifecycleFilter, membershipFilter]);

  if (loading) {
    return <p className="px-6 py-6 text-sm text-slate-500">Loading assigned athletes…</p>;
  }
  if (error) {
    return (
      <p className="px-6 py-6 text-sm text-slate-500">
        Could not load assigned athletes.
      </p>
    );
  }
  if (athletes.length === 0) {
    return <p className="px-6 py-6 text-sm text-slate-500">No athletes assigned yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex min-w-[10rem] flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Athlete status</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-primary/35 focus-visible:ring-2"
            value={lifecycleFilter}
            onChange={(e) => setLifecycleFilter(e.target.value as RosterStatusFilter)}
          >
            {ROSTER_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {ROSTER_FILTER_LABELS[opt]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[10rem] flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-600">Membership</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-primary/35 focus-visible:ring-2"
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value as RosterStatusFilter)}
          >
            {ROSTER_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {ROSTER_FILTER_LABELS[opt]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredAthletes.length === 0 ? (
        <p className="rounded-xl border border-slate-200/70 bg-white px-6 py-5 text-sm text-slate-500">
          No athletes match the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <table className="w-full min-w-[460px] border-separate [border-spacing:0_6px] text-left">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wide text-slate-500">
                  Athlete
                </th>
                <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                  Athlete status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wide text-slate-500">
                  Membership
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAthletes.map((row, index) => (
                <tr key={`${row.email}-${index}`} className="group align-top">
                  <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                    <div className="space-y-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {row.displayName.trim() !== ""
                          ? formatPersonNameForDisplay(row.displayName)
                          : "—"}
                      </span>
                      <span
                        className="block max-w-[20rem] truncate text-xs text-slate-500"
                        title={row.email}
                      >
                        {row.email}
                      </span>
                    </div>
                  </td>
                  <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                    <StatusBadge
                      status={row.lifecycle}
                      className="rounded-md px-2.5 py-1 text-xs font-medium"
                    >
                      {formatEnumeratedLabel(row.lifecycle)}
                    </StatusBadge>
                  </td>
                  <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                    <StatusBadge
                      status={row.membershipStatus}
                      className="rounded-md px-2.5 py-1 text-xs font-medium"
                    >
                      {formatEnumeratedLabel(row.membershipStatus)}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
