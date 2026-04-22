"use client";

import { AdminTableSearchInput } from "@/components/dashboard/admin/AdminTableSearchInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
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
  fetchEntityAssignments,
  fetchMyAcademy,
  getActiveCoachAssignmentsForAthlete,
} from "@/lib/api/academyAdmin";
import {
  fetchMyAcademyCoaches,
  type AcademyCoachStructureRow,
} from "@/lib/api/academyMeCoaches";
import {
  fetchMyAcademyAthletes,
  type AcademyMeAthleteRow,
} from "@/lib/api/academyMeAthletes";
import { formatAdminPersonLabel } from "@/lib/adminPersonLabel";
import { adminTableSearchMatches } from "@/lib/adminTableSearch";
import { ATHLETE_LEVELS } from "@/lib/athlete-levels";
import { SPORT_VALUES } from "@/lib/sports";
import { isNormalizedApiError } from "@/lib/apiClient";
import type { EntityAssignmentRow } from "@/types/academyAdmin.types";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";

const ATHLETE_STATUS_FILTER_ALL = "" as const;
type AthleteStatusFilterValue =
  | typeof ATHLETE_STATUS_FILTER_ALL
  | "active"
  | "pending"
  | "removed";

const ATHLETE_FIELD_FILTER_ALL = "" as const;
/** Select value when sport/level is blank on the row */
const ATHLETE_EMPTY_FIELD_VALUE = "__EMPTY__" as const;

const ATHLETE_COACH_FILTER_ALL = "" as const;
const ATHLETE_COACH_UNASSIGNED = "__UNASSIGNED__" as const;

function membershipStatusUpper(status: string): string {
  return status.trim().toUpperCase();
}

function athleteRowIsActiveStatus(membershipStatus: string): boolean {
  const u = membershipStatusUpper(membershipStatus);
  return u === "ACTIVE" || u === "ACCEPTED";
}

function athleteRowIsRemovedStatus(membershipStatus: string): boolean {
  return membershipStatusUpper(membershipStatus) === "REMOVED";
}

function athleteRowIsPendingStatus(membershipStatus: string): boolean {
  return membershipStatusUpper(membershipStatus) === "PENDING";
}

function athleteMembershipStatusBadgeClass(membershipStatus: string): string {
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
  if (upper === "UNKNOWN" || upper === "")
    return "bg-zinc-100 text-zinc-600 ring-zinc-600/20";
  return "bg-gray-100 text-gray-700 ring-gray-600/20";
}

function formatAthletesPageError(e: unknown, fallback: string): string {
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

function cellText(value: string): string {
  return value.trim() !== "" ? value : "—";
}

function coachStructureRowLabel(c: AcademyCoachStructureRow): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  if (name.trim() !== "") return name.trim();
  if (c.email.trim() !== "") return c.email.trim();
  return "—";
}

/**
 * Assigned Coaches column only: prefer name; stack email beneath when both exist.
 * (Athlete filter and Assignments dropdowns keep `formatAdminPersonLabel`.)
 */
function AssignedCoachCellEntry(props: {
  coachName: string;
  coachEmail: string;
}) {
  const n = props.coachName.trim();
  const e = props.coachEmail.trim();
  if (n !== "" && e !== "") {
    return (
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-textPrimary">{n}</div>
        <div className="text-xs text-textSecondary">{e}</div>
      </div>
    );
  }
  if (e !== "") {
    return <div className="text-sm text-textSecondary">{e}</div>;
  }
  if (n !== "") {
    return <div className="text-sm font-medium text-textPrimary">{n}</div>;
  }
  return <span className="text-textSecondary">—</span>;
}

export default function AdminAthletesPage() {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<AcademyMeAthleteRow[]>([]);
  const [assignments, setAssignments] = useState<EntityAssignmentRow[]>([]);
  const [assignmentsLoadError, setAssignmentsLoadError] = useState<string | null>(
    null,
  );
  const [academyCoaches, setAcademyCoaches] = useState<AcademyCoachStructureRow[]>(
    [],
  );
  const [athleteFilter, setAthleteFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AthleteStatusFilterValue>(ATHLETE_STATUS_FILTER_ALL);
  const [sportFilter, setSportFilter] = useState<string>(ATHLETE_FIELD_FILTER_ALL);
  const [levelFilter, setLevelFilter] = useState<string>(ATHLETE_FIELD_FILTER_ALL);
  const [assignedCoachFilter, setAssignedCoachFilter] = useState<string>(
    ATHLETE_COACH_FILTER_ALL,
  );
  const [athleteTableSearch, setAthleteTableSearch] = useState("");

  /** Canonical sport/level values union any values present on loaded rows (unknown backend strings still filterable). */
  const sportFilterChoices = useMemo(() => {
    const set = new Set<string>(SPORT_VALUES);
    for (const a of athletes) {
      set.add(a.sport.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [athletes]);

  const levelFilterChoices = useMemo(() => {
    const set = new Set<string>([...ATHLETE_LEVELS]);
    for (const a of athletes) {
      set.add(a.level.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [athletes]);

  const athleteProfileIdSet = useMemo(
    () => new Set(athletes.map((a) => a.athleteProfileId)),
    [athletes],
  );

  const coachFilterOptions = useMemo(() => {
    const byId = new Map<string, { coachProfileId: string; label: string }>();
    const emailToCoach = new Map<string, AcademyCoachStructureRow>();
    for (const c of academyCoaches) {
      const em = c.email.trim().toLowerCase();
      if (em !== "") emailToCoach.set(em, c);
    }
    const primaryNameForAssignment = (row: EntityAssignmentRow) => {
      const direct = row.coachName.trim();
      if (direct !== "") return direct;
      const em = row.coachEmail.trim().toLowerCase();
      const match = em !== "" ? emailToCoach.get(em) : undefined;
      if (match) return coachStructureRowLabel(match);
      return "";
    };
    for (const row of assignments) {
      if (row.status.trim().toUpperCase() !== "ACTIVE") continue;
      if (!athleteProfileIdSet.has(row.athleteProfileId)) continue;
      const cid = row.coachProfileId.trim();
      if (cid === "") continue;
      if (!byId.has(cid)) {
        byId.set(cid, {
          coachProfileId: cid,
          label: formatAdminPersonLabel(
            primaryNameForAssignment(row),
            row.coachEmail,
            cid,
          ),
        });
      }
    }
    for (const c of academyCoaches) {
      const cid = c.coachProfileId?.trim();
      if (!cid || byId.has(cid)) continue;
      byId.set(cid, {
        coachProfileId: cid,
        label: formatAdminPersonLabel(
          coachStructureRowLabel(c),
          c.email,
          cid,
        ),
      });
    }
    return [...byId.values()].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [assignments, athleteProfileIdSet, academyCoaches]);

  const hasUnassignedAthlete = useMemo(() => {
    return athletes.some(
      (a) =>
        getActiveCoachAssignmentsForAthlete(a.athleteProfileId, assignments)
          .length === 0,
    );
  }, [athletes, assignments]);

  const athletesAfterSelectFilters = useMemo(() => {
    return athletes.filter((a) => {
      const id = athleteFilter.trim();
      if (id !== "" && a.athleteProfileId !== id) return false;

      if (statusFilter === "active" && !athleteRowIsActiveStatus(a.membershipStatus)) {
        return false;
      }
      if (statusFilter === "pending" && !athleteRowIsPendingStatus(a.membershipStatus)) {
        return false;
      }
      if (statusFilter === "removed" && !athleteRowIsRemovedStatus(a.membershipStatus)) {
        return false;
      }

      if (sportFilter !== ATHLETE_FIELD_FILTER_ALL) {
        const s = a.sport.trim();
        if (sportFilter === ATHLETE_EMPTY_FIELD_VALUE) {
          if (s !== "") return false;
        } else if (s !== sportFilter) {
          return false;
        }
      }

      if (levelFilter !== ATHLETE_FIELD_FILTER_ALL) {
        const lv = a.level.trim();
        if (levelFilter === ATHLETE_EMPTY_FIELD_VALUE) {
          if (lv !== "") return false;
        } else if (lv !== levelFilter) {
          return false;
        }
      }

      if (assignedCoachFilter !== ATHLETE_COACH_FILTER_ALL) {
        const activeForAthlete = getActiveCoachAssignmentsForAthlete(
          a.athleteProfileId,
          assignments,
        );
        if (assignedCoachFilter === ATHLETE_COACH_UNASSIGNED) {
          if (activeForAthlete.length !== 0) return false;
        } else if (
          !activeForAthlete.some(
            (r) => r.coachProfileId.trim() === assignedCoachFilter,
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    athletes,
    athleteFilter,
    statusFilter,
    sportFilter,
    levelFilter,
    assignedCoachFilter,
    assignments,
  ]);

  const visibleAthletes = useMemo(() => {
    return athletesAfterSelectFilters.filter((a) =>
      adminTableSearchMatches(athleteTableSearch, [
        a.displayName,
        a.email,
        a.sport,
        a.level,
      ]),
    );
  }, [athletesAfterSelectFilters, athleteTableSearch]);

  useEffect(() => {
    if (sportFilter === ATHLETE_FIELD_FILTER_ALL) return;
    if (sportFilter === ATHLETE_EMPTY_FIELD_VALUE) {
      if (!sportFilterChoices.includes("")) {
        setSportFilter(ATHLETE_FIELD_FILTER_ALL);
      }
      return;
    }
    if (!sportFilterChoices.includes(sportFilter)) {
      setSportFilter(ATHLETE_FIELD_FILTER_ALL);
    }
  }, [sportFilter, sportFilterChoices]);

  useEffect(() => {
    if (levelFilter === ATHLETE_FIELD_FILTER_ALL) return;
    if (levelFilter === ATHLETE_EMPTY_FIELD_VALUE) {
      if (!levelFilterChoices.includes("")) {
        setLevelFilter(ATHLETE_FIELD_FILTER_ALL);
      }
      return;
    }
    if (!levelFilterChoices.includes(levelFilter)) {
      setLevelFilter(ATHLETE_FIELD_FILTER_ALL);
    }
  }, [levelFilter, levelFilterChoices]);

  useEffect(() => {
    if (assignedCoachFilter === ATHLETE_COACH_FILTER_ALL) return;
    if (assignedCoachFilter === ATHLETE_COACH_UNASSIGNED) {
      if (!hasUnassignedAthlete) {
        setAssignedCoachFilter(ATHLETE_COACH_FILTER_ALL);
      }
      return;
    }
    if (
      !coachFilterOptions.some(
        (o) => o.coachProfileId === assignedCoachFilter,
      )
    ) {
      setAssignedCoachFilter(ATHLETE_COACH_FILTER_ALL);
    }
  }, [assignedCoachFilter, coachFilterOptions, hasUnassignedAthlete]);

  const loadPage = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    setAssignmentsLoadError(null);
    try {
      const [athleteRows, academyCtx, coachesPack] = await Promise.all([
        fetchMyAcademyAthletes(),
        fetchMyAcademy(),
        fetchMyAcademyCoaches().catch(
          (): { coaches: AcademyCoachStructureRow[] } => ({ coaches: [] }),
        ),
      ]);
      setAthletes(athleteRows);
      setAcademyCoaches(coachesPack.coaches);

      const entityId = academyCtx?.entityId?.trim() ?? "";
      if (entityId === "") {
        setAssignments([]);
        setLoadState("ready");
        return;
      }
      try {
        const rows = await fetchEntityAssignments(entityId);
        setAssignments(rows);
      } catch (e) {
        setAssignments([]);
        setAssignmentsLoadError(
          formatAthletesPageError(
            e,
            "Could not load coach assignments for display.",
          ),
        );
      }
      setLoadState("ready");
    } catch (e) {
      setLoadError(
        formatAthletesPageError(e, "Could not load academy athletes."),
      );
      setAthletes([]);
      setAcademyCoaches([]);
      setAssignments([]);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; loadPage is stable
  }, []);

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        Loading athletes…
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <Heading variant="h2">Athletes</Heading>
        <Alert variant="danger">{loadError}</Alert>
        <Button type="button" variant="secondary" onClick={() => void loadPage()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <header>
        <Heading variant="h2">Athletes</Heading>
        <p className="mt-1 text-sm text-textSecondary">
          Academy roster. Coach assignments are read-only here; manage them on
          Assignments.
        </p>
      </header>

      {assignmentsLoadError ? (
        <Alert variant="warning">{assignmentsLoadError}</Alert>
      ) : null}

      {athletes.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-textSecondary">
          No athletes in academy roster.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3">
            <div className="max-w-md">
              <AdminTableSearchInput
                id="admin-athletes-table-search"
                value={athleteTableSearch}
                onChange={setAthleteTableSearch}
                placeholder="Search athletes"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                <label
                  htmlFor="admin-athletes-status-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Status filter
                </label>
                <Select
                  className="w-full"
                  id="admin-athletes-status-filter"
                  value={statusFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value as AthleteStatusFilterValue)
                  }
                >
                  <option value={ATHLETE_STATUS_FILTER_ALL}>All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="removed">Removed</option>
                </Select>
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                <label
                  htmlFor="admin-athletes-sport-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Sport filter
                </label>
                <Select
                  className="w-full"
                  id="admin-athletes-sport-filter"
                  value={sportFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSportFilter(e.target.value)
                  }
                >
                  <option value={ATHLETE_FIELD_FILTER_ALL}>All Sports</option>
                  {sportFilterChoices.map((sv) => (
                    <option
                      key={sv === "" ? ATHLETE_EMPTY_FIELD_VALUE : sv}
                      value={sv === "" ? ATHLETE_EMPTY_FIELD_VALUE : sv}
                    >
                      {sv === "" ? "—" : sv}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                <label
                  htmlFor="admin-athletes-level-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Level filter
                </label>
                <Select
                  className="w-full"
                  id="admin-athletes-level-filter"
                  value={levelFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLevelFilter(e.target.value)
                  }
                >
                  <option value={ATHLETE_FIELD_FILTER_ALL}>All Levels</option>
                  {levelFilterChoices.map((lv) => (
                    <option
                      key={lv === "" ? ATHLETE_EMPTY_FIELD_VALUE : lv}
                      value={lv === "" ? ATHLETE_EMPTY_FIELD_VALUE : lv}
                    >
                      {lv === "" ? "—" : lv}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                <label
                  htmlFor="admin-athletes-coach-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Assigned Coach filter
                </label>
                <Select
                  className="w-full"
                  id="admin-athletes-coach-filter"
                  value={assignedCoachFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setAssignedCoachFilter(e.target.value)
                  }
                >
                  <option value={ATHLETE_COACH_FILTER_ALL}>All Coaches</option>
                  {hasUnassignedAthlete ? (
                    <option value={ATHLETE_COACH_UNASSIGNED}>Unassigned</option>
                  ) : null}
                  {coachFilterOptions.map((o) => (
                    <option key={o.coachProfileId} value={o.coachProfileId}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                <label
                  htmlFor="admin-athletes-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Filter by athlete
                </label>
                <Select
                  className="w-full"
                  id="admin-athletes-filter"
                  value={athleteFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setAthleteFilter(e.target.value)
                  }
                >
                  <option value="">All athletes</option>
                  {athletes.map((a) => (
                    <option key={a.athleteProfileId} value={a.athleteProfileId}>
                      {formatAdminPersonLabel(
                        a.displayName,
                        a.email,
                        a.athleteProfileId,
                      )}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {athletesAfterSelectFilters.length === 0 ? (
            <p className="text-sm text-textSecondary">
              No athletes match the selected filters.
            </p>
          ) : visibleAthletes.length === 0 ? (
            <p className="text-sm text-textSecondary">No results found.</p>
          ) : (
            <Table className="w-full min-w-[920px] table-auto">
            <TableHead>
              <TableRow variant="head">
                <Th>Athlete Name</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Sport</Th>
                <Th>Level</Th>
                <Th>Assigned Coaches</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleAthletes.map((row) => {
                const statusLabel =
                  row.membershipStatus.trim() !== ""
                    ? row.membershipStatus
                    : "—";
                const coachRows = getActiveCoachAssignmentsForAthlete(
                  row.athleteProfileId,
                  assignments,
                );
                return (
                  <TableRow key={row.userId}>
                    <Td className="font-medium text-textPrimary">
                      {cellText(row.displayName)}
                    </Td>
                    <Td>{cellText(row.email)}</Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          athleteMembershipStatusBadgeClass(statusLabel),
                        )}
                      >
                        {statusLabel}
                      </span>
                    </Td>
                    <Td className="text-sm text-textSecondary">
                      {cellText(row.sport)}
                    </Td>
                    <Td className="text-sm text-textSecondary">
                      {cellText(row.level)}
                    </Td>
                    <Td className="text-sm text-textSecondary align-top">
                      {coachRows.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="list-none space-y-2">
                          {coachRows.map((cr) => (
                            <li key={cr.assignmentId}>
                              <AssignedCoachCellEntry
                                coachName={cr.coachName}
                                coachEmail={cr.coachEmail}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </Td>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
