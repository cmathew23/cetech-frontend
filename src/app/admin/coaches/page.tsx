"use client";

import { AcademyCoachesEditModal } from "@/components/dashboard/admin/AcademyCoachesEditModal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { AdminTableSearchInput } from "@/components/dashboard/admin/AdminTableSearchInput";
import { Heading } from "@/components/ui/Heading";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
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
import { isNormalizedApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
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
  if (role === "HEAD_COACH") return "Head Coach";
  if (role === "ASSISTANT_COACH") return "Assistant Coach";
  return "Unassigned";
}

function coachMembershipStatusBadgeClass(membershipStatus: string): string {
  const upper = membershipStatus.trim().toUpperCase();
  if (upper === "PENDING")
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  if (upper === "ACCEPTED" || upper === "ACTIVE")
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
  if (upper === "DECLINED")
    return "bg-rose-50 text-rose-800 ring-rose-600/20";
  if (upper === "REVOKED")
    return "bg-orange-50 text-orange-800 ring-orange-600/20";
  if (upper === "EXPIRED")
    return "bg-zinc-100 text-zinc-700 ring-zinc-600/20";
  if (upper === "UNKNOWN")
    return "bg-zinc-100 text-zinc-600 ring-zinc-600/20";
  return "bg-gray-100 text-gray-700 ring-gray-600/20";
}

function formatFunctionsDisplay(functions: string[]): string {
  if (functions.length === 0) return "None";
  return functions.join(", ");
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
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        Loading coaches…
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <Heading variant="h2">Coaches</Heading>
        <Alert variant="danger">{loadError}</Alert>
        <Button type="button" variant="secondary" onClick={() => void loadCoaches()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <header>
        <Heading variant="h2">Coaches</Heading>
        <p className="mt-1 text-sm text-textSecondary">
          Manage coach roles and functions for your academy.
        </p>
      </header>

      {coaches.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-textSecondary">
          No coaches in academy.
        </p>
      ) : (
        <>
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
            <p className="text-sm text-textSecondary">
              No coaches match the selected filters.
            </p>
          ) : visibleCoaches.length === 0 ? (
            <p className="text-sm text-textSecondary">No results found.</p>
          ) : (
            <Table className="w-full min-w-[760px] table-auto">
          <TableHead>
            <TableRow variant="head">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th>Role</Th>
              <Th>Functions</Th>
              <Th className="text-right">Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleCoaches.map((row) => {
              const name = [row.firstName, row.lastName].filter(Boolean).join(" ");
              const nameCell =
                name.trim() !== ""
                  ? name
                  : row.email.trim() !== ""
                    ? row.email
                    : "—";
              return (
                <TableRow key={row.coachUserId}>
                  <Td className="font-medium text-textPrimary">
                    {nameCell}
                  </Td>
                  <Td>{row.email.trim() !== "" ? row.email : "—"}</Td>
                  <Td>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                        coachMembershipStatusBadgeClass(row.membershipStatus),
                      )}
                    >
                      {row.membershipStatus}
                    </span>
                  </Td>
                  <Td className="text-xs text-textMuted">{row.joinedAt}</Td>
                  <Td>{formatRoleDisplay(row.role)}</Td>
                  <Td className="max-w-[200px] break-words text-textSecondary">
                    {formatFunctionsDisplay(row.functions)}
                  </Td>
                  <Td className="text-right">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSaveError(null);
                        setEditing(row);
                      }}
                    >
                      Edit
                    </Button>
                  </Td>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
          )}
        </>
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
