"use client";

import { AcademyCoachesEditModal } from "@/components/dashboard/admin/AcademyCoachesEditModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AdminTableSearchInput } from "@/components/dashboard/admin/AdminTableSearchInput";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchAcademyCoachFunctionCatalog,
  fetchMyAcademyCoaches,
  patchMyAcademyCoachStructure,
  type AcademyCoachAssignableRole,
  type AcademyCoachFunctionOption,
  type AcademyCoachRole,
  type AcademyCoachStructureRow,
} from "@/lib/api/academyMeCoaches";
import { adminTableSearchMatches } from "@/lib/adminTableSearch";
import { formatDateTime } from "@/lib/dateTime";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  formatEnumeratedLabel,
  formatFunctionTokensForDisplay,
  formatPersonNameForDisplay,
  toTitleCaseInput,
} from "@/lib/textFormat";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

const COACH_STATUS_FILTER_ALL = "" as const;
/** Active membership: same notion as green badge (ACTIVE / ACCEPTED). */
type CoachStatusFilterValue =
  | typeof COACH_STATUS_FILTER_ALL
  | "active"
  | "pending"
  | "removed";

const COACH_ROLE_FILTER_ALL = "" as const;
type CoachRoleFilterValue =
  | typeof COACH_ROLE_FILTER_ALL
  | "UNASSIGNED"
  | "HEAD_COACH"
  | "ASSISTANT_COACH";

const COACH_FUNCTION_FILTER_ALL = "" as const;

function membershipStatusUpper(status: string): string {
  return status.trim().toUpperCase();
}

function coachRowIsActiveStatus(membershipStatus: string): boolean {
  const u = membershipStatusUpper(membershipStatus);
  return u === "ACTIVE" || u === "ACCEPTED";
}

function coachRowIsRemovedStatus(membershipStatus: string): boolean {
  return membershipStatusUpper(membershipStatus) === "REMOVED";
}

function coachRowIsPendingStatus(membershipStatus: string): boolean {
  return membershipStatusUpper(membershipStatus) === "PENDING";
}

function formatRoleDisplay(role: AcademyCoachRole): string {
  if (role === null) return "Unassigned";
  return toTitleCaseInput(role);
}

function formatFunctionsDisplay(functions: string[]): string {
  return formatFunctionTokensForDisplay(functions);
}

function formatCoachPageError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server !== "") {
        return `Access denied. ${server}`;
      }
      return "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function formatPatchError(e: unknown): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 409) {
      const server = e.message.trim();
      const base =
        "This academy already has a head coach. Change the existing head coach or pick Assistant Coach.";
      return server !== "" ? `${base} (${server})` : base;
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return "Could not save coach.";
}

export default function AdminCoachesPage() {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<AcademyCoachStructureRow[]>([]);
  const [coachFunctionOptions, setCoachFunctionOptions] = useState<
    AcademyCoachFunctionOption[]
  >([]);

  const [editing, setEditing] = useState<AcademyCoachStructureRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<CoachStatusFilterValue>(COACH_STATUS_FILTER_ALL);
  const [roleFilter, setRoleFilter] =
    useState<CoachRoleFilterValue>(COACH_ROLE_FILTER_ALL);
  const [functionFilter, setFunctionFilter] = useState<string>(
    COACH_FUNCTION_FILTER_ALL,
  );
  const [coachTableSearch, setCoachTableSearch] = useState("");

  const coachesAfterSelectFilters = useMemo(() => {
    return coaches.filter((row) => {
      if (statusFilter === "active" && !coachRowIsActiveStatus(row.membershipStatus)) {
        return false;
      }
      if (statusFilter === "pending" && !coachRowIsPendingStatus(row.membershipStatus)) {
        return false;
      }
      if (statusFilter === "removed" && !coachRowIsRemovedStatus(row.membershipStatus)) {
        return false;
      }
      if (roleFilter !== COACH_ROLE_FILTER_ALL) {
        if (roleFilter === "UNASSIGNED" && row.role !== null) return false;
        if (roleFilter !== "UNASSIGNED" && row.role !== roleFilter) return false;
      }
      if (functionFilter !== COACH_FUNCTION_FILTER_ALL) {
        if (!row.functions.includes(functionFilter)) return false;
      }
      return true;
    });
  }, [coaches, statusFilter, roleFilter, functionFilter]);

  const visibleCoaches = useMemo(() => {
    return coachesAfterSelectFilters.filter((row) => {
      const nameJoined = [row.firstName, row.lastName].filter(Boolean).join(" ");
      const displayName =
        nameJoined.trim() !== ""
          ? nameJoined
          : row.email.trim() !== ""
            ? row.email
            : "";
      return adminTableSearchMatches(coachTableSearch, [
        displayName,
        row.email,
        row.membershipStatus,
        formatFunctionsDisplay(row.functions),
        formatRoleDisplay(row.role),
      ]);
    });
  }, [coachesAfterSelectFilters, coachTableSearch]);

  useEffect(() => {
    if (
      functionFilter !== COACH_FUNCTION_FILTER_ALL &&
      !coachFunctionOptions.some((o) => o.value === functionFilter)
    ) {
      setFunctionFilter(COACH_FUNCTION_FILTER_ALL);
    }
  }, [coachFunctionOptions, functionFilter]);

  const loadCoaches = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const [coachesResult, catalog] = await Promise.all([
        fetchMyAcademyCoaches(),
        fetchAcademyCoachFunctionCatalog(),
      ]);
      setCoaches(coachesResult.coaches);
      setCoachFunctionOptions(
        [...catalog].sort((a, b) => a.label.localeCompare(b.label)),
      );
      setLoadState("ready");
    } catch (e) {
      setLoadError(
        formatCoachPageError(e, "Could not load academy coaches."),
      );
      setCoaches([]);
      setCoachFunctionOptions([]);
      setLoadState("error");
    }
  }, []);

  /** Refetch coach rows after PATCH without full-page loading. */
  const refetchCoachesAfterSave = useCallback(async () => {
    try {
      const { coaches: rows } = await fetchMyAcademyCoaches();
      setCoaches(rows);
    } catch (e) {
      setLoadError(
        formatCoachPageError(e, "Could not refresh coaches after save."),
      );
    }
  }, []);

  useEffect(() => {
    void loadCoaches();
  }, [loadCoaches]);

  async function handleSave(input: {
    role: AcademyCoachAssignableRole;
    functions: string[];
  }) {
    if (!editing) return;
    if (process.env.NEXT_PUBLIC_DEBUG_COACH_ROLE === "1") {
      console.debug("[AcademyCoachRole] page handleSave input", {
        coachUserId: editing.coachUserId,
        role: input.role,
        functions: input.functions,
      });
    }
    setSaving(true);
    setSaveError(null);
    try {
      await patchMyAcademyCoachStructure(editing.coachUserId, input);
      setEditing(null);
      await refetchCoachesAfterSave();
    } catch (e) {
      setSaveError(formatPatchError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <p className="px-6 py-6 text-sm text-slate-500">Loading coaches…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <PageHeader
          title="Coaches"
          subtitle="Manage coach roles and functions for your academy."
        />
        <Alert variant="danger">{loadError}</Alert>
        <Button type="button" variant="secondary" onClick={() => void loadCoaches()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <PageHeader
        title="Coaches"
        subtitle="Manage coach roles and functions for your academy."
      />

      {coaches.length === 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="px-6 py-6 text-sm text-slate-500">No coaches in academy.</p>
        </div>
      ) : (
        <Card className="space-y-4" accent={false}>
          <div className="mb-4 flex flex-col gap-3">
            <div className="max-w-md">
              <AdminTableSearchInput
                id="admin-coaches-table-search"
                value={coachTableSearch}
                onChange={setCoachTableSearch}
                placeholder="Search coaches"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex w-full min-w-0 max-w-xs flex-1 flex-col gap-1">
                <label
                  htmlFor="admin-coaches-status-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Status filter
                </label>
                <Select
                  className="w-full"
                  id="admin-coaches-status-filter"
                  value={statusFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value as CoachStatusFilterValue)
                  }
                >
                  <option value={COACH_STATUS_FILTER_ALL}>All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="removed">Removed</option>
                </Select>
              </div>
              <div className="flex w-full min-w-0 max-w-xs flex-1 flex-col gap-1">
                <label
                  htmlFor="admin-coaches-role-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Role filter
                </label>
                <Select
                  className="w-full"
                  id="admin-coaches-role-filter"
                  value={roleFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setRoleFilter(e.target.value as CoachRoleFilterValue)
                  }
                >
                  <option value={COACH_ROLE_FILTER_ALL}>All Roles</option>
                  <option value="HEAD_COACH">Head Coach</option>
                  <option value="ASSISTANT_COACH">Assistant Coach</option>
                  <option value="UNASSIGNED">Unassigned</option>
                </Select>
              </div>
              <div className="flex w-full min-w-0 max-w-xs flex-1 flex-col gap-1">
                <label
                  htmlFor="admin-coaches-function-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Function filter
                </label>
                <Select
                  className="w-full"
                  id="admin-coaches-function-filter"
                  value={functionFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setFunctionFilter(e.target.value)
                  }
                  disabled={coachFunctionOptions.length === 0}
                >
                  <option value={COACH_FUNCTION_FILTER_ALL}>All Functions</option>
                  {coachFunctionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {coachFunctionOptions.length === 0 ? (
              <p className="text-xs text-textSecondary">
                Function catalog did not load; assign functions via Edit after it
                is available, or retry loading the page.
              </p>
            ) : null}
          </div>

          {coachesAfterSelectFilters.length === 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <p className="px-6 py-6 text-sm text-slate-500">
                No coaches match the selected filters.
              </p>
            </div>
          ) : visibleCoaches.length === 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <p className="px-6 py-6 text-sm text-slate-500">No results found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <table className="w-full min-w-[760px] border-separate [border-spacing:0_6px] text-left">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wide text-slate-500">
                      Coach
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                      Role
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                      Function
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                      Joined
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCoaches.map((row) => {
                    const name = [row.firstName, row.lastName].filter(Boolean).join(" ");
                    const rawName = name.trim();
                    const nameDisplay =
                      rawName !== ""
                        ? formatPersonNameForDisplay(rawName)
                        : row.email.trim() !== ""
                          ? row.email.trim()
                          : "—";
                    const roleDisplay = formatRoleDisplay(row.role);
                    const functionDisplayRaw = formatFunctionsDisplay(row.functions);
                    const functionDisplay =
                      functionDisplayRaw === "None" ? "—" : functionDisplayRaw;
                    return (
                      <tr key={row.coachUserId} className="group align-top">
                        <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                          <div className="space-y-1">
                            <p className="max-w-[18rem] truncate text-sm font-semibold text-slate-900" title={nameDisplay}>
                              {nameDisplay}
                            </p>
                            <p className="max-w-[20rem] truncate text-xs text-slate-500" title={row.email.trim() !== "" ? row.email : "—"}>
                              {row.email.trim() !== "" ? row.email : "—"}
                            </p>
                          </div>
                        </td>
                        <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                          <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {roleDisplay}
                          </span>
                        </td>
                        <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                          <span className="inline-flex max-w-[16rem] rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {functionDisplay}
                          </span>
                        </td>
                        <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                          <StatusBadge status={row.membershipStatus} className="rounded-md px-2.5 py-1 text-xs font-medium">
                            {formatEnumeratedLabel(row.membershipStatus)}
                          </StatusBadge>
                        </td>
                        <td className="border-y border-slate-100 bg-white px-4 py-5 text-xs text-slate-500 group-hover:bg-slate-50/70">
                          {formatDateTime(row.joinedAt, "—")}
                        </td>
                        <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-5 py-5 text-right group-hover:bg-slate-50/70">
                          <div className="flex items-start justify-end">
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-4 py-2 text-xs sm:text-sm"
                              onClick={() => {
                                setSaveError(null);
                                setEditing(row);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <AcademyCoachesEditModal
        open={editing !== null}
        coach={editing}
        functionCatalog={coachFunctionOptions}
        saving={saving}
        saveError={saveError}
        onClose={() => {
          if (!saving) {
            setEditing(null);
            setSaveError(null);
          }
        }}
        onSave={handleSave}
      />
    </div>
  );
}
