"use client";

import { AssignmentCoachMultiSelect } from "@/components/dashboard/admin/AssignmentCoachMultiSelect";
import { DeactivateMemberConfirmModal } from "@/components/dashboard/admin/DeactivateMemberConfirmModal";
import { UnassignAssignmentConfirmDialog } from "@/components/dashboard/admin/UnassignAssignmentConfirmDialog";
import { AdminTableSearchInput } from "@/components/dashboard/admin/AdminTableSearchInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { adminPaths } from "@/config/adminNav";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatAdminPersonLabel } from "@/lib/adminPersonLabel";
import {
  formatEnumeratedLabel,
  formatFunctionTokensForDisplay,
  formatPersonNameForDisplay,
  toTitleCaseInput,
} from "@/lib/textFormat";
import { adminTableSearchMatches } from "@/lib/adminTableSearch";
import { formatDateOrDateTime, formatDateTime } from "@/lib/dateTime";
import {
  createAthleteCoachAssignment,
  createEntityInvitation,
  deactivateEntityMember,
  fetchEntityAssignmentCandidates,
  fetchEntityAssignments,
  fetchEntityInvitations,
  fetchEntityMembers,
  fetchMyAcademy,
  INVITATION_STATUS_FILTERS,
  removeAthleteCoachAssignment,
  type InvitationStatusFilter,
  revokeEntityInvitation,
} from "@/lib/api/academyAdmin";
import { fetchMyProfile } from "@/lib/api/profile";
import { fetchMyAcademyAthletes } from "@/lib/api/academyMeAthletes";
import {
  fetchMyAcademyCoaches,
  type AcademyCoachRole,
  type AcademyCoachStructureRow,
} from "@/lib/api/academyMeCoaches";
import { isNormalizedApiError } from "@/lib/apiClient";
import type {
  AthleteAssignmentOption,
  CoachAssignmentOption,
  EntityAssignmentRow,
  EntityMemberRow,
  PendingInvitationRow,
  SelectedAcademy,
} from "@/types/academyAdmin.types";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

export type AcademyAdminWorkspaceSection =
  | "members"
  | "invitations"
  | "assignments";

const LOADING_MEMBERS = "Loading members…";
const LOADING_INVITATIONS = "Loading invitations…";
const LOADING_ROSTER = "Loading roster data…";
const LOADING_ACADEMY_CONTEXT = "Loading academy context…";
const INVITATION_ROLE_COACH = "COACH" as const;
const INVITATION_ROLE_ATHLETE = "ATHLETE" as const;
type InvitationRole = typeof INVITATION_ROLE_COACH | typeof INVITATION_ROLE_ATHLETE;
const INVITATION_FILTER_ALL = "ALL" as const;
type InvitationFilterValue = typeof INVITATION_FILTER_ALL | InvitationStatusFilter;
const ASSIGNMENT_COACH_FILTER_ALL = "" as const;

function formatAdminApiError(e: unknown, fallback: string): string {
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

function isActiveEntityMemberStatus(status: string): boolean {
  return status.trim().toUpperCase() === "ACTIVE";
}

function memberNameForDeactivatePrompt(row: EntityMemberRow): string {
  const name = row.memberDisplayName.trim();
  if (name !== "") return formatPersonNameForDisplay(name);
  const email = row.memberEmailOnly.trim();
  if (email !== "") return email;
  const fallback = row.userEmail.trim();
  if (fallback !== "" && fallback !== "—") {
    return formatPersonNameForDisplay(fallback);
  }
  return "";
}

/** Fallback when roster lookup misses: member row fields from GET /entities/:entityId/members only. Never shows email here — that belongs in the Email column. */
function memberNameColumnText(row: EntityMemberRow): string {
  const name = row.memberDisplayName.trim();
  if (name !== "") return name;
  const emailOnly = row.memberEmailOnly.trim();
  const legacy = row.userEmail.trim();
  // Legacy: adapter may set `userEmail` to "First Last" when nested user has a name (not an email).
  if (legacy !== "" && legacy !== "—" && legacy !== emailOnly) return legacy;
  return "—";
}

/** Same coach name cell as `src/app/admin/coaches/page.tsx` (first+last, else email, else —). */
function coachAdminTableNameCell(c: {
  firstName: string;
  lastName: string;
  email: string;
}): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  if (name.trim() !== "") return name;
  if (c.email.trim() !== "") return c.email.trim();
  return "—";
}

/** Same display strings as Coaches / Athletes admin tables (`GET /academies/me/coaches`, `GET /academies/me/athletes`). */
async function fetchMemberTableNameLookups(): Promise<{
  coachNameByUserId: Record<string, string>;
  athleteNameByUserId: Record<string, string>;
  /** GET /profile/me first+last when members payload omits user names (e.g. current admin row). */
  profileNameByUserId: Record<string, string>;
}> {
  const coachNameByUserId: Record<string, string> = {};
  const athleteNameByUserId: Record<string, string> = {};
  const profileNameByUserId: Record<string, string> = {};
  const [coachesSettled, athletesSettled, profileSettled] =
    await Promise.allSettled([
      fetchMyAcademyCoaches(),
      fetchMyAcademyAthletes(),
      fetchMyProfile(),
    ]);
  if (coachesSettled.status === "fulfilled") {
    for (const c of coachesSettled.value.coaches) {
      coachNameByUserId[c.coachUserId] = coachAdminTableNameCell(c);
    }
  }
  if (athletesSettled.status === "fulfilled") {
    for (const a of athletesSettled.value) {
      athleteNameByUserId[a.userId] = a.displayName;
    }
  }
  if (profileSettled.status === "fulfilled") {
    const p = profileSettled.value;
    const uid = p.userId.trim();
    const combined = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    if (uid !== "" && combined !== "") {
      profileNameByUserId[uid] = combined;
    }
  }
  return { coachNameByUserId, athleteNameByUserId, profileNameByUserId };
}

/**
 * Member Name column: for COACH/ATHLETE, same resolved string as the Coaches/Athletes tables
 * when `row.targetUserId` matches `coachUserId` / `userId` on those roster rows; entity admins use
 * `/profile/me` when the members API omits names; else {@link memberNameColumnText}.
 */
function memberNameTableCell(
  row: EntityMemberRow,
  lookups: {
    coachNameByUserId: Record<string, string>;
    athleteNameByUserId: Record<string, string>;
    profileNameByUserId: Record<string, string>;
  },
): string {
  const uid = row.targetUserId.trim();
  const role = row.role.trim().toUpperCase();
  let resolved = "";
  if (uid !== "") {
    if (role === "COACH") {
      const v = lookups.coachNameByUserId[uid];
      if (v !== undefined) resolved = v;
    }
    if (resolved === "" && role === "ATHLETE") {
      const v = lookups.athleteNameByUserId[uid];
      if (v !== undefined) resolved = v;
    }
    if (
      resolved === "" &&
      (role === "ENTITY_ADMIN" ||
        role === "ACADEMY_ADMIN" ||
        role === "ADMIN")
    ) {
      const v = lookups.profileNameByUserId[uid];
      if (v !== undefined) resolved = v;
    }
  }
  if (resolved === "") {
    resolved = memberNameColumnText(row);
  }
  if (resolved === "—") return "—";
  return formatPersonNameForDisplay(resolved);
}

function memberEmailColumnText(row: EntityMemberRow): string {
  const e = row.memberEmailOnly.trim();
  if (e !== "") return e;
  return "—";
}

const MEMBER_ROLE_FILTER_ALL = "" as const;
const MEMBER_ROLE_FILTER_ATHLETE = "ATHLETE" as const;
const MEMBER_ROLE_FILTER_COACH = "COACH" as const;
const MEMBER_ROLE_FILTER_ENTITY_ADMIN = "ENTITY_ADMIN" as const;

const MEMBER_STATUS_FILTER_ALL = "" as const;
const MEMBER_STATUS_FILTER_ACTIVE = "ACTIVE" as const;
const MEMBER_STATUS_FILTER_REMOVED = "REMOVED" as const;

type MemberRoleFilterValue =
  | typeof MEMBER_ROLE_FILTER_ALL
  | typeof MEMBER_ROLE_FILTER_ATHLETE
  | typeof MEMBER_ROLE_FILTER_COACH
  | typeof MEMBER_ROLE_FILTER_ENTITY_ADMIN;

type MemberStatusFilterValue =
  | typeof MEMBER_STATUS_FILTER_ALL
  | typeof MEMBER_STATUS_FILTER_ACTIVE
  | typeof MEMBER_STATUS_FILTER_REMOVED;

function AssignmentPartyCell({
  name,
  email,
  fallbackId,
  role,
  functions,
}: {
  name: string;
  email: string;
  fallbackId: string;
  role?: string | null;
  functions?: string[];
}) {
  const n = name.trim();
  const e = email.trim();
  const roleText = role?.trim() ?? "";
  const fnClean = (functions ?? []).map((f) => f.trim()).filter((f) => f !== "");
  const roleLabel = roleText !== "" ? formatEnumeratedLabel(roleText) : "";
  const functionText =
    fnClean.length > 0 ? formatFunctionTokensForDisplay(fnClean) : "";
  const roleFunctionLine =
    [roleLabel, functionText].filter((part) => part !== "").join(" • ");
  if (n === "" && e === "") {
    return <span className="text-xs text-slate-500">{fallbackId}</span>;
  }
  if (n === "") {
    return (
      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-900">{e}</div>
        {roleFunctionLine !== "" ? (
          <div className="text-xs text-slate-500">{roleFunctionLine}</div>
        ) : null}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-slate-900">
        {formatPersonNameForDisplay(n)}
      </div>
      <div className="text-xs text-slate-500">{e !== "" ? e : "—"}</div>
      {roleFunctionLine !== "" ? (
        <div className="text-xs text-slate-500">{roleFunctionLine}</div>
      ) : null}
    </div>
  );
}

function formatAssignmentCoachRole(role: AcademyCoachRole): string {
  if (role === null) return "";
  return toTitleCaseInput(role);
}

/** Single-line native select option text: name · email · role · functions (roster from GET /academies/me/coaches). */
function formatCoachAssignmentDropdownLabel(
  input: {
    coachProfileId: string;
    displayName: string;
    displayEmail: string;
  },
  roster: {
    byProfileId: Map<string, { roleLabel: string; functions: string[] }>;
    byEmail: Map<string, { roleLabel: string; functions: string[] }>;
  },
): string {
  const pid = input.coachProfileId.trim();
  const name = input.displayName.trim();
  const email = input.displayEmail.trim();

  const segments: string[] = [];
  if (name !== "") segments.push(formatPersonNameForDisplay(name));
  if (email !== "") segments.push(email);
  if (segments.length === 0) {
    segments.push(pid !== "" ? pid : "—");
  }

  const detail =
    (pid !== "" ? roster.byProfileId.get(pid) : undefined) ??
    (email !== "" ? roster.byEmail.get(email.toLowerCase()) : undefined);

  if (detail) {
    const roleText = detail.roleLabel.trim();
    const fnClean = detail.functions
      .map((f) => f.trim())
      .filter((f) => f !== "");
    const fnText =
      fnClean.length > 0 ? formatFunctionTokensForDisplay(fnClean) : "";
    if (roleText !== "") segments.push(roleText);
    if (fnText !== "") segments.push(fnText);
    if (roleText === "" && fnText === "") {
      segments.push("Role/function not set");
    }
  }

  return segments.join(" · ");
}

/** Name (or first line) + remaining metadata for multi-select row layout. */
function formatCoachAssignmentOptionLines(
  input: {
    coachProfileId: string;
    displayName: string;
    displayEmail: string;
  },
  roster: {
    byProfileId: Map<string, { roleLabel: string; functions: string[] }>;
    byEmail: Map<string, { roleLabel: string; functions: string[] }>;
  },
): { primary: string; secondary: string } {
  const pid = input.coachProfileId.trim();
  const name = input.displayName.trim();
  const email = input.displayEmail.trim();

  const segments: string[] = [];
  if (name !== "") segments.push(formatPersonNameForDisplay(name));
  if (email !== "") segments.push(email);
  if (segments.length === 0) {
    segments.push(pid !== "" ? pid : "—");
  }

  const detail =
    (pid !== "" ? roster.byProfileId.get(pid) : undefined) ??
    (email !== "" ? roster.byEmail.get(email.toLowerCase()) : undefined);

  if (detail) {
    const roleText = detail.roleLabel.trim();
    const fnClean = detail.functions
      .map((f) => f.trim())
      .filter((f) => f !== "");
    const fnText =
      fnClean.length > 0 ? formatFunctionTokensForDisplay(fnClean) : "";
    if (roleText !== "") segments.push(roleText);
    if (fnText !== "") segments.push(fnText);
    if (roleText === "" && fnText === "") {
      segments.push("Role/function not set");
    }
  }

  const primary = segments[0] ?? "—";
  const secondary = segments.slice(1).join(" · ");
  return { primary, secondary };
}

const SECTION_TITLES: Record<AcademyAdminWorkspaceSection, string> = {
  members: "Members",
  invitations: "Invitations",
  assignments: "Assignments",
};

const SECTION_SUBTITLES: Record<AcademyAdminWorkspaceSection, string> = {
  members: "View and manage entity members, roles, and status.",
  invitations: "Send invitations and track their status.",
  assignments: "Create and remove athlete–coach assignments.",
};

type AcademyAdminWorkspacePageProps = {
  section: AcademyAdminWorkspaceSection;
  /** Assignments: `athleteProfileId` from URL query (read on client); must match an option id after roster load. */
  initialAthleteProfileId?: string;
};

export function AcademyAdminWorkspacePage({
  section,
  initialAthleteProfileId = "",
}: AcademyAdminWorkspacePageProps) {
  const { user: authUser } = useAuth();
  const [selectedAcademy, setSelectedAcademy] = useState<SelectedAcademy | null>(
    null,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [members, setMembers] = useState<EntityMemberRow[]>([]);
  const [memberTableNameLookups, setMemberTableNameLookups] = useState<{
    coachNameByUserId: Record<string, string>;
    athleteNameByUserId: Record<string, string>;
    profileNameByUserId: Record<string, string>;
  }>({
    coachNameByUserId: {},
    athleteNameByUserId: {},
    profileNameByUserId: {},
  });
  const [invitations, setInvitations] = useState<PendingInvitationRow[]>([]);
  const [assignments, setAssignments] = useState<EntityAssignmentRow[]>([]);
  const [athleteOptions, setAthleteOptions] = useState<AthleteAssignmentOption[]>(
    [],
  );
  const [coachOptions, setCoachOptions] = useState<CoachAssignmentOption[]>([]);
  const [academyCoachRows, setAcademyCoachRows] = useState<AcademyCoachStructureRow[]>(
    [],
  );

  const [membersLoading, setMembersLoading] = useState(false);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>(
    INVITATION_ROLE_COACH,
  );
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [invitationFilter, setInvitationFilter] =
    useState<InvitationFilterValue>(INVITATION_FILTER_ALL);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersSuccess, setMembersSuccess] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<EntityMemberRow | null>(
    null,
  );
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [memberRoleFilter, setMemberRoleFilter] =
    useState<MemberRoleFilterValue>(MEMBER_ROLE_FILTER_ALL);
  const [memberStatusFilter, setMemberStatusFilter] =
    useState<MemberStatusFilterValue>(MEMBER_STATUS_FILTER_ALL);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [athletesError, setAthletesError] = useState<string | null>(null);
  const [coachesError, setCoachesError] = useState<string | null>(null);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(
    null,
  );
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokingInvitationId, setRevokingInvitationId] = useState<
    string | null
  >(null);
  const [academyContextLoading, setAcademyContextLoading] = useState(true);
  const [academyContextMissing, setAcademyContextMissing] = useState(false);
  const [academyContextError, setAcademyContextError] = useState<string | null>(
    null,
  );
  const [assignmentAthleteProfileId, setAssignmentAthleteProfileId] =
    useState("");
  const [assignmentSelectedCoachIds, setAssignmentSelectedCoachIds] =
    useState<string[]>([]);
  const [assignmentCoachFilter, setAssignmentCoachFilter] = useState<string>(
    ASSIGNMENT_COACH_FILTER_ALL,
  );
  const [removingAssignmentKey, setRemovingAssignmentKey] = useState<string | null>(
    null,
  );
  const [unassignModalOpen, setUnassignModalOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<{
    athleteProfileId: string;
    coachProfileId: string;
    athletePromptName: string;
  } | null>(null);
  /** Filters the current section table only; cleared when switching workspace section. */
  const [workspaceListSearch, setWorkspaceListSearch] = useState("");

  /** Incrementing this causes the assignment candidates useEffect to re-fetch. */
  const [candidatesRefreshKey, setCandidatesRefreshKey] = useState(0);

  /** Avoid re-applying URL preset when `athleteOptions` identity changes without navigation intent. */
  const assignmentAthletePresetKeyRef = useRef<string | null>(null);

  const rosterLoading = athletesLoading || coachesLoading;
  const academyIdForRoster = selectedAcademy?.academyId ?? null;
  const needsAcademyCopy =
    "No academy context loaded. Complete academy onboarding first, then return here.";
  const showNoAcademyContext =
    !academyContextLoading && academyContextMissing && academyContextError === null;
  const hasAthleteOptions = athleteOptions.length > 0;
  const hasCoachOptions = coachOptions.length > 0;
  const assignmentAthleteIdTrimmed = assignmentAthleteProfileId.trim();

  const assignmentCoachesToCreate = useMemo(() => {
    if (assignmentAthleteIdTrimmed === "") return [];
    return assignmentSelectedCoachIds.filter((coachProfileId) => {
      return !assignments.some(
        (row) =>
          row.athleteProfileId === assignmentAthleteIdTrimmed &&
          row.coachProfileId === coachProfileId &&
          row.status.trim().toUpperCase() === "ACTIVE",
      );
    });
  }, [assignmentAthleteIdTrimmed, assignmentSelectedCoachIds, assignments]);

  const someSelectedCoachesAlreadyAssigned =
    assignmentSelectedCoachIds.length > 0 &&
    assignmentCoachesToCreate.length < assignmentSelectedCoachIds.length;

  const rosterIncludesRemovedMember = useMemo(
    () =>
      members.some(
        (m) =>
          m.status.trim().toUpperCase() === MEMBER_STATUS_FILTER_REMOVED,
      ),
    [members],
  );

  const membersAfterRoleStatusFilters = useMemo(() => {
    return members.filter((row) => {
      if (memberRoleFilter !== MEMBER_ROLE_FILTER_ALL) {
        if (row.role.trim().toUpperCase() !== memberRoleFilter) return false;
      }
      if (memberStatusFilter !== MEMBER_STATUS_FILTER_ALL) {
        if (row.status.trim().toUpperCase() !== memberStatusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [members, memberRoleFilter, memberStatusFilter]);

  const visibleMembers = useMemo(() => {
    return membersAfterRoleStatusFilters.filter((row) =>
      adminTableSearchMatches(workspaceListSearch, [
        memberNameTableCell(row, memberTableNameLookups),
        memberEmailColumnText(row),
        row.role,
        row.status,
      ]),
    );
  }, [
    membersAfterRoleStatusFilters,
    workspaceListSearch,
    memberTableNameLookups,
  ]);

  const visibleInvitations = useMemo(() => {
    return invitations.filter((row) =>
      adminTableSearchMatches(workspaceListSearch, [
        row.email,
        row.role,
        row.status,
        row.entityName ?? "",
      ]),
    );
  }, [invitations, workspaceListSearch]);

  const visibleAssignments = useMemo(() => {
    return assignments.filter((row) => {
      if (
        assignmentCoachFilter !== ASSIGNMENT_COACH_FILTER_ALL &&
        row.coachProfileId.trim() !== assignmentCoachFilter
      ) {
        return false;
      }
      return adminTableSearchMatches(workspaceListSearch, [
        row.athleteName,
        row.coachName,
      ]);
    });
  }, [assignments, workspaceListSearch, assignmentCoachFilter]);

  const assignmentCoachDetails = useMemo(() => {
    const byProfileId = new Map<
      string,
      { roleLabel: string; functions: string[] }
    >();
    const byEmail = new Map<
      string,
      { roleLabel: string; functions: string[] }
    >();
    for (const row of academyCoachRows) {
      const detail = {
        roleLabel: formatAssignmentCoachRole(row.role),
        functions: row.functions,
      };
      const coachProfileId = row.coachProfileId?.trim() ?? "";
      if (coachProfileId !== "") {
        byProfileId.set(coachProfileId, detail);
      }
      const email = row.email.trim().toLowerCase();
      if (email !== "") {
        byEmail.set(email, detail);
      }
    }
    return { byProfileId, byEmail };
  }, [academyCoachRows]);

  const assignmentCoachFilterOptions = useMemo(() => {
    const byId = new Map<string, { coachProfileId: string; label: string }>();
    const roster = assignmentCoachDetails;
    for (const row of assignments) {
      const coachProfileId = row.coachProfileId.trim();
      if (coachProfileId === "" || byId.has(coachProfileId)) continue;
      byId.set(coachProfileId, {
        coachProfileId,
        label: formatCoachAssignmentDropdownLabel(
          {
            coachProfileId,
            displayName: row.coachName,
            displayEmail: row.coachEmail,
          },
          roster,
        ),
      });
    }
    for (const opt of coachOptions) {
      if (byId.has(opt.coachProfileId)) continue;
      byId.set(opt.coachProfileId, {
        coachProfileId: opt.coachProfileId,
        label: formatCoachAssignmentDropdownLabel(opt, roster),
      });
    }
    return [...byId.values()].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [assignments, coachOptions, assignmentCoachDetails]);

  useEffect(() => {
    setWorkspaceListSearch("");
  }, [section]);

  useEffect(() => {
    if (assignmentCoachFilter === ASSIGNMENT_COACH_FILTER_ALL) return;
    if (
      !assignmentCoachFilterOptions.some(
        (option) => option.coachProfileId === assignmentCoachFilter,
      )
    ) {
      setAssignmentCoachFilter(ASSIGNMENT_COACH_FILTER_ALL);
    }
  }, [assignmentCoachFilter, assignmentCoachFilterOptions]);

  useEffect(() => {
    let cancelled = false;
    async function hydrateAcademyContext() {
      setAcademyContextLoading(true);
      setAcademyContextMissing(false);
      setAcademyContextError(null);
      try {
        const ctx = await fetchMyAcademy();
        if (cancelled) return;
        if (ctx) {
          setSelectedAcademy({
            academyId: ctx.academyId,
            name: ctx.name,
          });
          setSelectedEntityId(ctx.entityId);
          setAcademyContextMissing(false);
        } else {
          setAcademyContextMissing(true);
        }
      } catch (e) {
        if (!cancelled) {
          setAcademyContextMissing(false);
          setAcademyContextError(
            formatAdminApiError(e, "Could not load academy context."),
          );
        }
      } finally {
        if (!cancelled) {
          setAcademyContextLoading(false);
        }
      }
    }
    void hydrateAcademyContext();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAssignmentAthleteProfileId("");
    setAssignmentSelectedCoachIds([]);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    setRevokeError(null);
    assignmentAthletePresetKeyRef.current = null;
  }, [academyIdForRoster, selectedEntityId]);

  useEffect(() => {
    assignmentAthletePresetKeyRef.current = null;
  }, [initialAthleteProfileId]);

  useEffect(() => {
    if (section !== "assignments" || !selectedEntityId) {
      setAthleteOptions([]);
      setCoachOptions([]);
      setAthletesError(null);
      setCoachesError(null);
      setAthletesLoading(false);
      setCoachesLoading(false);
      return;
    }
    const entityId = selectedEntityId;
    let cancelled = false;
    async function loadAssignmentOptions() {
      setAthletesLoading(true);
      setAthletesError(null);
      setCoachesLoading(true);
      setCoachesError(null);
      try {
        const [{ athletes, coaches }, coachesResult] = await Promise.all([
          fetchEntityAssignmentCandidates(entityId),
          fetchMyAcademyCoaches().catch(
            (): { coaches: AcademyCoachStructureRow[] } => ({ coaches: [] }),
          ),
        ]);
        if (!cancelled) {
          setAthleteOptions(athletes);
          setCoachOptions(coaches);
          setAcademyCoachRows(coachesResult.coaches);
        }
      } catch (e) {
        if (!cancelled) {
          setAthleteOptions([]);
          setCoachOptions([]);
          setAcademyCoachRows([]);
          const msg = formatAdminApiError(
            e,
            "Could not load assignment candidates for this entity.",
          );
          setAthletesError(msg);
          setCoachesError(msg);
        }
      } finally {
        if (!cancelled) {
          setAthletesLoading(false);
          setCoachesLoading(false);
        }
      }
    }
    void loadAssignmentOptions();
    return () => {
      cancelled = true;
    };
  }, [section, selectedEntityId, candidatesRefreshKey]);

  useEffect(() => {
    if (section !== "assignments" || !selectedEntityId) return;

    function refreshCandidatesFromWindowEvent() {
      setCandidatesRefreshKey((key) => key + 1);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshCandidatesFromWindowEvent();
      }
    }

    window.addEventListener("focus", refreshCandidatesFromWindowEvent);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshCandidatesFromWindowEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [section, selectedEntityId]);

  useEffect(() => {
    if (section !== "assignments") return;
    const wanted = initialAthleteProfileId.trim();
    if (wanted === "") return;
    if (athleteOptions.length === 0) return;
    if (!selectedEntityId) return;
    const presetKey = `${wanted}:${selectedEntityId}`;
    if (assignmentAthletePresetKeyRef.current === presetKey) return;
    const exists = athleteOptions.some((o) => o.athleteProfileId === wanted);
    if (!exists) return;
    setAssignmentAthleteProfileId(wanted);
    assignmentAthletePresetKeyRef.current = presetKey;
  }, [
    section,
    initialAthleteProfileId,
    athleteOptions,
    selectedEntityId,
  ]);

  useEffect(() => {
    if (section !== "members") {
      setMembersSuccess(null);
      setDeactivateTarget(null);
      setDeactivateError(null);
    }
  }, [section]);

  useEffect(() => {
    if (section !== "members" || !selectedEntityId) {
      setMembers([]);
      setMemberTableNameLookups({
        coachNameByUserId: {},
        athleteNameByUserId: {},
        profileNameByUserId: {},
      });
      setMembersError(null);
      return;
    }
    setMemberRoleFilter(MEMBER_ROLE_FILTER_ALL);
    setMemberStatusFilter(MEMBER_STATUS_FILTER_ALL);
    const entityId = selectedEntityId;
    let cancelled = false;
    async function loadMembers() {
      setMembersLoading(true);
      setMembersError(null);
      try {
        const [rows, lookups] = await Promise.all([
          fetchEntityMembers(entityId),
          fetchMemberTableNameLookups(),
        ]);
        if (!cancelled) {
          setMembers(rows);
          setMemberTableNameLookups(lookups);
        }
      } catch (e) {
        if (!cancelled) {
          setMembers([]);
          setMemberTableNameLookups({
            coachNameByUserId: {},
            athleteNameByUserId: {},
            profileNameByUserId: {},
          });
          setMembersError(
            formatAdminApiError(e, "Could not load members for this entity."),
          );
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }
    void loadMembers();
    return () => {
      cancelled = true;
    };
  }, [section, selectedEntityId]);

  useEffect(() => {
    if (section !== "assignments" || !selectedEntityId) {
      setAssignments([]);
      setAcademyCoachRows([]);
      setAssignmentsError(null);
      setAssignmentsLoading(false);
      return;
    }
    const entityId = selectedEntityId;
    let cancelled = false;
    async function loadAssignments() {
      setAssignmentsLoading(true);
      setAssignmentsError(null);
      try {
        const rows = await fetchEntityAssignments(entityId);
        if (!cancelled) setAssignments(rows);
      } catch (e) {
        if (!cancelled) {
          setAssignments([]);
          setAssignmentsError(
            formatAdminApiError(e, "Could not load assignments for this entity."),
          );
        }
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }
    }
    void loadAssignments();
    return () => {
      cancelled = true;
    };
  }, [section, selectedEntityId]);

  useEffect(() => {
    if (section !== "invitations" || !selectedEntityId) {
      setInvitations([]);
      setInvitationsError(null);
      return;
    }
    const entityId = selectedEntityId;
    let cancelled = false;
    async function loadInvitations() {
      setInvitationsLoading(true);
      setInvitationsError(null);
      try {
        const rows = await fetchEntityInvitations(
          entityId,
          invitationFilter === INVITATION_FILTER_ALL ? undefined : invitationFilter,
        );
        if (!cancelled) setInvitations(rows);
      } catch (e) {
        if (!cancelled) {
          setInvitations([]);
          setInvitationsError(
            formatAdminApiError(
              e,
              "Could not load invitations for this entity.",
            ),
          );
        }
      } finally {
        if (!cancelled) setInvitationsLoading(false);
      }
    }
    void loadInvitations();
    return () => {
      cancelled = true;
    };
  }, [section, selectedEntityId, invitationFilter]);

  function clearInvitationAssignmentFeedback() {
    setRevokeError(null);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    setInviteError(null);
    setInviteSuccess(null);
  }

  function memberRowShowsDeactivate(row: EntityMemberRow): boolean {
    if (!isActiveEntityMemberStatus(row.status)) return false;
    if (row.targetUserId.trim() === "") return false;
    const selfId = authUser?.id?.trim() ?? "";
    if (selfId !== "" && row.targetUserId.trim() === selfId) return false;
    return true;
  }

  function openDeactivateMember(row: EntityMemberRow) {
    setMembersSuccess(null);
    setDeactivateError(null);
    setDeactivateTarget(row);
  }

  function closeDeactivateMemberModal() {
    if (deactivateSubmitting) return;
    setDeactivateTarget(null);
    setDeactivateError(null);
  }

  async function handleConfirmDeactivateMember() {
    if (!selectedEntityId || !deactivateTarget) return;
    const targetUserId = deactivateTarget.targetUserId.trim();
    if (targetUserId === "") return;
    setDeactivateSubmitting(true);
    setDeactivateError(null);
    try {
      await deactivateEntityMember(selectedEntityId, targetUserId);
      const [rows, lookups] = await Promise.all([
        fetchEntityMembers(selectedEntityId),
        fetchMemberTableNameLookups(),
      ]);
      setMembers(rows);
      setMemberTableNameLookups(lookups);
      setMembersSuccess("Member deactivated.");
      setDeactivateTarget(null);
    } catch (e) {
      setDeactivateError(
        formatAdminApiError(e, "Could not deactivate member."),
      );
    } finally {
      setDeactivateSubmitting(false);
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (!selectedEntityId || revokingInvitationId !== null) return;
    const ok = window.confirm(
      "Revoke this invitation? The invitee will no longer be able to accept it.",
    );
    if (!ok) return;
    setRevokeError(null);
    setRevokingInvitationId(invitationId);
    try {
      await revokeEntityInvitation(invitationId);
      const rows = await fetchEntityInvitations(
        selectedEntityId,
        invitationFilter === INVITATION_FILTER_ALL ? undefined : invitationFilter,
      );
      setInvitations(rows);
    } catch (e) {
      setRevokeError(
        formatAdminApiError(e, "Could not revoke invitation."),
      );
    } finally {
      setRevokingInvitationId(null);
    }
  }

  async function handleCreateInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEntityId || inviteSubmitting) return;
    const email = inviteEmail.trim();
    if (email === "") return;
    setInviteSubmitting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      await createEntityInvitation({
        entityId: selectedEntityId,
        email,
        role: inviteRole,
      });
      const rows = await fetchEntityInvitations(
        selectedEntityId,
        invitationFilter === INVITATION_FILTER_ALL ? undefined : invitationFilter,
      );
      setInvitations(rows);
      setCandidatesRefreshKey((key) => key + 1);
      setInviteEmail("");
      setInviteSuccess(
        inviteRole === INVITATION_ROLE_COACH
          ? "Coach invitation sent."
          : "Athlete invitation sent.",
      );
    } catch (e) {
      setInviteError(
        formatAdminApiError(e, "Could not send invitation."),
      );
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEntityId || assignmentSubmitting) return;
    const athleteProfileId = assignmentAthleteProfileId.trim();
    if (athleteProfileId === "" || assignmentSelectedCoachIds.length === 0) {
      return;
    }

    const toCreate = assignmentCoachesToCreate;
    if (toCreate.length === 0) {
      setAssignmentError(
        "All selected coaches already have an active assignment with this athlete.",
      );
      setAssignmentSuccess(null);
      return;
    }

    setAssignmentSubmitting(true);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    const errors: string[] = [];
    let successes = 0;
    try {
      for (const coachProfileId of toCreate) {
        try {
          await createAthleteCoachAssignment({
            entityId: selectedEntityId,
            athleteProfileId,
            coachProfileId,
            isPrimary: false,
          });
          successes += 1;
        } catch (err) {
          errors.push(formatAdminApiError(err, "Could not create assignment."));
        }
      }

      const rows = await fetchEntityAssignments(selectedEntityId);
      setAssignments(rows);
      setCandidatesRefreshKey((key) => key + 1);

      if (errors.length === 0) {
        setAssignmentSuccess(
          successes === 1
            ? "Assignment saved."
            : `${successes} assignments saved.`,
        );
        setAssignmentSelectedCoachIds([]);
      } else if (successes > 0) {
        setAssignmentError("Some assignments could not be completed.");
        setAssignmentSuccess(
          `${successes} assignment${successes !== 1 ? "s" : ""} saved.`,
        );
        setAssignmentSelectedCoachIds([]);
      } else {
        setAssignmentError(
          errors[0] ?? "Could not create assignments.",
        );
      }
    } catch (e) {
      setAssignmentError(
        formatAdminApiError(e, "Could not refresh assignments."),
      );
    } finally {
      setAssignmentSubmitting(false);
    }
  }

  function openUnassignAssignmentModal(row: EntityAssignmentRow) {
    setAssignmentError(null);
    const raw = row.athleteName.trim();
    setUnassignTarget({
      athleteProfileId: row.athleteProfileId,
      coachProfileId: row.coachProfileId,
      athletePromptName:
        raw !== "" ? formatPersonNameForDisplay(raw) : "",
    });
    setUnassignModalOpen(true);
  }

  function closeUnassignAssignmentModal() {
    if (removingAssignmentKey !== null) return;
    setUnassignModalOpen(false);
    setUnassignTarget(null);
  }

  async function performRemoveAssignment(
    athleteProfileId: string,
    coachProfileId: string,
  ) {
    if (!selectedEntityId || removingAssignmentKey !== null) return;
    const key = `${athleteProfileId}:${coachProfileId}`;
    setRemovingAssignmentKey(key);
    setAssignmentError(null);
    setAssignmentSuccess(null);
    try {
      await removeAthleteCoachAssignment(
        selectedEntityId,
        athleteProfileId,
        coachProfileId,
      );
      const rows = await fetchEntityAssignments(selectedEntityId);
      setAssignments(rows);
      setCandidatesRefreshKey((k) => k + 1);
      setAssignmentSuccess("Assignment removed.");
      setUnassignModalOpen(false);
      setUnassignTarget(null);
    } catch (e) {
      setAssignmentError(
        formatAdminApiError(e, "Could not remove assignment."),
      );
    } finally {
      setRemovingAssignmentKey(null);
    }
  }

  function onAssignmentAthleteChange(value: string) {
    setAssignmentAthleteProfileId(value);
    setAssignmentError(null);
    setAssignmentSuccess(null);
  }

  function toggleAssignmentCoach(coachProfileId: string, checked: boolean) {
    setAssignmentError(null);
    setAssignmentSuccess(null);
    setAssignmentSelectedCoachIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(coachProfileId);
      } else {
        next.delete(coachProfileId);
      }
      return [...next];
    });
  }

  if (
    academyContextLoading &&
    selectedAcademy === null &&
    !academyContextError
  ) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        {LOADING_ACADEMY_CONTEXT}
      </div>
    );
  }

  if (academyContextError) {
    return (
      <div className="max-w-lg">
        <Alert variant="danger">{academyContextError}</Alert>
      </div>
    );
  }

  if (showNoAcademyContext) {
    return (
      <div className="max-w-lg space-y-3">
        <PageHeader title={SECTION_TITLES[section]} subtitle={needsAcademyCopy} />
        <Link
          href={adminPaths.aboutAcademy}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Go to About Academy
        </Link>
      </div>
    );
  }

  if (!selectedAcademy || !selectedEntityId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        {LOADING_ACADEMY_CONTEXT}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <PageHeader
        title={SECTION_TITLES[section]}
        subtitle={SECTION_SUBTITLES[section]}
        actions={
          <Link
            href={adminPaths.dashboard}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Dashboard overview
          </Link>
        }
      />

      <Card className="space-y-4" accent={false}>
        {section === "members" ? (
          <div>
            {membersSuccess ? (
              <Alert variant="success" className="mb-4" role="status">
                {membersSuccess}
              </Alert>
            ) : null}
            {membersError ? (
              <Alert variant="danger" className="mb-4">
                {membersError}
              </Alert>
            ) : null}
            {membersLoading ? (
              <p className="text-sm text-textSecondary">{LOADING_MEMBERS}</p>
            ) : null}
            {!membersLoading &&
            !membersError &&
            selectedEntityId !== null &&
            members.length === 0 ? (
              <p className="text-sm text-textSecondary">No members yet.</p>
            ) : null}
            {!membersLoading && !membersError && members.length > 0 ? (
              <>
                <div className="mb-4 max-w-md">
                  <AdminTableSearchInput
                    id="admin-workspace-members-search"
                    value={workspaceListSearch}
                    onChange={setWorkspaceListSearch}
                    placeholder="Search members"
                  />
                </div>
                <div className="mb-4 space-y-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:max-w-2xl">
                    <div className="flex min-w-0 flex-col gap-1">
                      <label
                        htmlFor="admin-members-role-filter"
                        className="text-xs font-medium text-textPrimary"
                      >
                        Role filter
                      </label>
                      <Select
                        id="admin-members-role-filter"
                        value={memberRoleFilter}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          setMemberRoleFilter(
                            e.target.value as MemberRoleFilterValue,
                          )
                        }
                      >
                        <option value={MEMBER_ROLE_FILTER_ALL}>All Roles</option>
                        <option value={MEMBER_ROLE_FILTER_ATHLETE}>Athlete</option>
                        <option value={MEMBER_ROLE_FILTER_COACH}>Coach</option>
                        <option value={MEMBER_ROLE_FILTER_ENTITY_ADMIN}>
                          Entity Admin
                        </option>
                      </Select>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <label
                        htmlFor="admin-members-status-filter"
                        className="text-xs font-medium text-textPrimary"
                      >
                        Status filter
                      </label>
                      <Select
                        id="admin-members-status-filter"
                        value={memberStatusFilter}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          setMemberStatusFilter(
                            e.target.value as MemberStatusFilterValue,
                          )
                        }
                      >
                        <option value={MEMBER_STATUS_FILTER_ALL}>
                          All Statuses
                        </option>
                        <option value={MEMBER_STATUS_FILTER_ACTIVE}>Active</option>
                        <option value={MEMBER_STATUS_FILTER_REMOVED}>
                          Removed
                        </option>
                      </Select>
                    </div>
                  </div>
                  {!rosterIncludesRemovedMember ? (
                    <p className="max-w-2xl text-xs text-textSecondary">
                      The current roster response does not include any members
                      with status Removed; choosing &quot;Removed&quot; may show an
                      empty table until the API returns such rows.
                    </p>
                  ) : null}
                </div>
                {membersAfterRoleStatusFilters.length === 0 ? (
                  <p className="text-sm text-textSecondary">
                    No members match the selected filters.
                  </p>
                ) : visibleMembers.length === 0 ? (
                  <p className="text-sm text-textSecondary">No results found.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    <table className="w-full min-w-[680px] border-separate [border-spacing:0_6px] text-left">
                      <thead className="bg-slate-50/70">
                        <tr>
                          <th className="px-6 py-3 text-xs font-medium tracking-wide text-slate-500">
                            Member
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                            Role
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                            Status
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500">
                            Joined
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleMembers.map((row) => (
                          <tr key={row.membershipId} className="group align-top">
                            <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                              <div className="space-y-1">
                                <p className="max-w-[18rem] truncate text-sm font-semibold text-slate-900" title={memberNameTableCell(row, memberTableNameLookups)}>
                                  {memberNameTableCell(row, memberTableNameLookups)}
                                </p>
                                <p className="max-w-[20rem] truncate text-xs text-slate-500" title={memberEmailColumnText(row)}>
                                  {memberEmailColumnText(row)}
                                </p>
                              </div>
                            </td>
                            <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                              <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {formatEnumeratedLabel(row.role)}
                              </span>
                            </td>
                            <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                              <StatusBadge
                                status={row.status}
                                className="rounded-md px-2.5 py-1 text-xs font-medium"
                              >
                                {formatEnumeratedLabel(row.status)}
                              </StatusBadge>
                            </td>
                            <td className="border-y border-slate-100 bg-white px-4 py-5 text-xs text-slate-500 group-hover:bg-slate-50/70">
                              {formatDateOrDateTime(row.joinedAt)}
                            </td>
                            <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-5 py-5 text-right group-hover:bg-slate-50/70">
                              {memberRowShowsDeactivate(row) ? (
                                <div className="flex items-start justify-end">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    className="px-4 py-2 text-xs sm:text-sm"
                                    onClick={() => openDeactivateMember(row)}
                                  >
                                    Deactivate
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : null}
          </div>
        ) : null}

        {section === "invitations" ? (
          <div>
            {inviteError ? (
              <Alert variant="danger" className="mb-4">
                {inviteError}
              </Alert>
            ) : null}
            {inviteSuccess ? (
              <Alert variant="success" className="mb-4" role="status">
                {inviteSuccess}
              </Alert>
            ) : null}
            {invitationsError ? (
              <Alert variant="danger" className="mb-4">
                {invitationsError}
              </Alert>
            ) : null}
            {revokeError ? (
              <Alert variant="danger" className="mb-4">
                {revokeError}
              </Alert>
            ) : null}
            {invitationsLoading ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <p className="px-6 py-6 text-sm text-slate-500">
                  {LOADING_INVITATIONS}
                </p>
              </div>
            ) : null}
            {!invitationsLoading &&
            !invitationsError &&
            selectedEntityId !== null ? (
              <div className="mb-4 space-y-3">
                <div className="max-w-md">
                  <AdminTableSearchInput
                    id="admin-workspace-invitations-search"
                    value={workspaceListSearch}
                    onChange={setWorkspaceListSearch}
                    placeholder="Search invitations"
                  />
                </div>
                <form
                  className="grid max-w-3xl gap-3 sm:grid-cols-[1fr_auto_auto]"
                  onSubmit={(e) => void handleCreateInvitation(e)}
                >
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="invite-email"
                      className="text-xs font-medium text-textPrimary"
                    >
                      Invite by email
                    </label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setInviteEmail(e.target.value)
                      }
                      placeholder="user@example.com"
                      disabled={inviteSubmitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="invite-role"
                      className="text-xs font-medium text-textPrimary"
                    >
                      Role
                    </label>
                    <Select
                      id="invite-role"
                      value={inviteRole}
                      disabled={inviteSubmitting}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setInviteRole(e.target.value as InvitationRole)
                      }
                    >
                      <option value={INVITATION_ROLE_COACH}>Coach</option>
                      <option value={INVITATION_ROLE_ATHLETE}>Athlete</option>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      className="px-4 py-2 text-xs sm:text-sm"
                      loading={inviteSubmitting}
                      disabled={inviteSubmitting || inviteEmail.trim() === ""}
                    >
                      Send invite
                    </Button>
                  </div>
                </form>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="invitation-filter"
                    className="text-xs font-medium text-textPrimary"
                  >
                    Status filter
                  </label>
                  <Select
                    id="invitation-filter"
                    value={invitationFilter}
                    disabled={invitationsLoading}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      clearInvitationAssignmentFeedback();
                      setInvitationFilter(e.target.value as InvitationFilterValue);
                    }}
                  >
                    <option value={INVITATION_FILTER_ALL}>All</option>
                    {INVITATION_STATUS_FILTERS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : null}
            {!invitationsLoading &&
            !invitationsError &&
            selectedEntityId !== null &&
            invitations.length === 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <p className="px-6 py-6 text-sm text-slate-500">
                  {invitationFilter === INVITATION_FILTER_ALL
                    ? "No invitations found."
                    : `No ${invitationFilter.toLowerCase()} invitations found.`}
                </p>
              </div>
            ) : null}
            {!invitationsLoading && !invitationsError && invitations.length > 0 ? (
              visibleInvitations.length === 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <p className="px-6 py-6 text-sm text-slate-500">No results found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
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
                      {visibleInvitations.map((row) => (
                        <tr key={row.invitationId} className="group align-top">
                          <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                            <div className="space-y-1">
                              <p className="max-w-[22rem] truncate text-sm font-semibold text-slate-900" title={row.email}>
                                {row.email}
                              </p>
                              <p className="text-xs text-slate-500">
                                Role: {formatEnumeratedLabel(row.role)} • Sent: {formatDateTime(row.createdAt, "—")}
                              </p>
                              {row.entityName?.trim() ? (
                                <p className="max-w-[22rem] truncate text-xs text-slate-500">
                                  Entity: {formatPersonNameForDisplay(row.entityName.trim())}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                            <StatusBadge
                              status={row.status}
                              className="rounded-md px-2.5 py-1 text-xs font-medium"
                            >
                              {formatEnumeratedLabel(row.status)}
                            </StatusBadge>
                          </td>
                          <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-5 py-5 text-right group-hover:bg-slate-50/70">
                            {row.status.trim().toUpperCase() === "PENDING" ? (
                              <div className="flex items-start justify-end">
                                <Button
                                  type="button"
                                  variant="danger"
                                  className="px-4 py-2 text-xs sm:text-sm"
                                  loading={revokingInvitationId === row.invitationId}
                                  disabled={revokingInvitationId !== null}
                                  onClick={() =>
                                    void handleRevokeInvitation(row.invitationId)
                                  }
                                >
                                  Revoke
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}
          </div>
        ) : null}

        {section === "assignments" ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="max-w-md flex-1">
                  <AdminTableSearchInput
                    id="admin-workspace-assignments-search"
                    value={workspaceListSearch}
                    onChange={setWorkspaceListSearch}
                    placeholder="Search assignments"
                    disabled={assignmentsLoading}
                  />
                </div>
                {selectedEntityId ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-4 py-2 text-xs sm:text-sm"
                    disabled={rosterLoading}
                    onClick={() => setCandidatesRefreshKey((k) => k + 1)}
                  >
                    Refresh candidates
                  </Button>
                ) : null}
              </div>
              <div className="flex w-full min-w-0 max-w-xs flex-col gap-1">
                <label
                  htmlFor="admin-workspace-assignments-coach-filter"
                  className="text-xs font-medium text-textPrimary"
                >
                  Coach filter
                </label>
                <Select
                  className="w-full"
                  id="admin-workspace-assignments-coach-filter"
                  value={assignmentCoachFilter}
                  disabled={assignmentsLoading}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setAssignmentCoachFilter(e.target.value)
                  }
                >
                  <option value={ASSIGNMENT_COACH_FILTER_ALL}>All Coaches</option>
                  {assignmentCoachFilterOptions.map((option) => (
                    <option
                      key={option.coachProfileId}
                      value={option.coachProfileId}
                    >
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {athletesError ? (
              <Alert variant="danger" className="mb-4">
                {athletesError}
              </Alert>
            ) : null}
            {coachesError ? (
              <Alert variant="danger" className="mb-4">
                {coachesError}
              </Alert>
            ) : null}
            {assignmentError ? (
              <Alert variant="danger" className="mb-4">
                {assignmentError}
              </Alert>
            ) : null}
            {assignmentSuccess ? (
              <Alert variant="success" className="mb-4" role="status">
                {assignmentSuccess}
              </Alert>
            ) : null}
            {assignmentsError ? (
              <Alert variant="danger" className="mb-4">
                {assignmentsError}
              </Alert>
            ) : null}
            {assignmentsLoading ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <p className="px-6 py-6 text-sm text-slate-500">Loading assignments...</p>
              </div>
            ) : null}
            {!assignmentsLoading &&
            !assignmentsError &&
            selectedEntityId !== null &&
            assignments.length === 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <p className="px-6 py-6 text-sm text-slate-500">
                  No coach-athlete assignments yet. Memberships do not create assignments automatically.
                </p>
              </div>
            ) : null}
            {!assignmentsLoading &&
            !assignmentsError &&
            selectedEntityId !== null &&
            assignments.length > 0 ? (
              visibleAssignments.length === 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <p className="px-6 py-6 text-sm text-slate-500">No results found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <table className="w-full min-w-[760px] border-separate [border-spacing:0_6px] text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-slate-500">Athlete</th>
                        <th className="px-6 py-3 text-xs font-medium text-slate-500">Coach</th>
                        <th className="px-3 py-3 text-[11px] font-medium text-slate-400">Primary</th>
                        <th className="px-4 py-3 text-xs font-medium text-slate-500">Details</th>
                        <th className="px-3 py-3 text-[11px] font-medium text-slate-400">Assigned</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAssignments.map((row) => {
                        const rowKey = `${row.athleteProfileId}:${row.coachProfileId}`;
                        return (
                          <tr key={row.assignmentId} className="group align-top">
                            <td className="rounded-l-xl border-y border-l border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                              <AssignmentPartyCell
                                name={row.athleteName}
                                email={row.athleteEmail}
                                fallbackId={row.athleteProfileId}
                              />
                            </td>
                            <td className="border-y border-slate-100 bg-white px-6 py-5 group-hover:bg-slate-50/70">
                              <AssignmentPartyCell
                                name={row.coachName}
                                email={row.coachEmail}
                                fallbackId={row.coachProfileId}
                                role={
                                  assignmentCoachDetails.byProfileId.get(
                                    row.coachProfileId,
                                  )?.roleLabel ??
                                  assignmentCoachDetails.byEmail.get(
                                    row.coachEmail.trim().toLowerCase(),
                                  )?.roleLabel ??
                                  ""
                                }
                                functions={
                                  assignmentCoachDetails.byProfileId.get(
                                    row.coachProfileId,
                                  )?.functions ??
                                  assignmentCoachDetails.byEmail.get(
                                    row.coachEmail.trim().toLowerCase(),
                                  )?.functions ??
                                  []
                                }
                              />
                            </td>
                            <td className="border-y border-slate-100 bg-white px-3 py-5 group-hover:bg-slate-50/70">
                              {row.isPrimary ? (
                                <span className="text-xs text-slate-500">
                                  Primary
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="border-y border-slate-100 bg-white px-4 py-5 group-hover:bg-slate-50/70">
                              <span className="text-xs text-slate-500">
                                Relationship:{" "}
                                {formatEnumeratedLabel(
                                  row.relationshipType?.trim() || "STANDARD",
                                )}{" "}
                                • Assigned: {formatDateTime(row.createdAt)}
                              </span>
                            </td>
                            <td className="border-y border-slate-100 bg-white px-3 py-5 text-xs text-slate-400 group-hover:bg-slate-50/70">
                              —
                            </td>
                            <td className="rounded-r-xl border-y border-r border-slate-100 bg-white px-5 py-5 text-right group-hover:bg-slate-50/70">
                              <div className="flex items-start justify-end">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="px-4 py-2 text-xs sm:text-sm"
                                  loading={removingAssignmentKey === rowKey}
                                  disabled={removingAssignmentKey !== null}
                                  onClick={() =>
                                    openUnassignAssignmentModal(row)
                                  }
                                >
                                  Unassign
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}
            {rosterLoading ? (
              <p className="text-sm text-textSecondary">{LOADING_ROSTER}</p>
            ) : null}
            {!rosterLoading &&
            selectedEntityId !== null &&
            !hasAthleteOptions &&
            !hasCoachOptions ? (
              <p className="text-sm text-textSecondary">
                No athletes or coaches with linked profiles are available for
                this entity.
              </p>
            ) : null}
            {!rosterLoading &&
            selectedEntityId !== null &&
            hasCoachOptions &&
            !hasAthleteOptions ? (
              <p className="text-sm text-textSecondary">
                Coaches are available, but no athletes with linked profiles in
                this entity are ready for assignment yet.
              </p>
            ) : null}
            {!rosterLoading &&
            selectedEntityId !== null &&
            hasAthleteOptions &&
            !hasCoachOptions ? (
              <p className="text-sm text-textSecondary">
                Athletes are available, but no coaches with linked profiles in
                this entity are ready for assignment yet.
              </p>
            ) : null}
            {!rosterLoading && selectedEntityId !== null ? (
              <form
                className="flex max-w-xl flex-col gap-4"
                onSubmit={(e) => void handleCreateAssignment(e)}
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="assignment-athlete"
                    className="text-xs font-medium text-textPrimary"
                  >
                    Athlete (profile)
                  </label>
                  <Select
                    id="assignment-athlete"
                    value={assignmentAthleteProfileId}
                    disabled={
                      assignmentSubmitting || athleteOptions.length === 0
                    }
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      onAssignmentAthleteChange(e.target.value)
                    }
                  >
                    <option value="">Select athlete</option>
                    {athleteOptions.map((opt) => (
                      <option
                        key={opt.athleteProfileId}
                        value={opt.athleteProfileId}
                      >
                        {formatAdminPersonLabel(
                          opt.displayName,
                          opt.displayEmail,
                          opt.athleteProfileId,
                        )}
                      </option>
                    ))}
                  </Select>
                  {!hasAthleteOptions ? (
                    <p className="text-xs text-textSecondary">
                      No assignable athletes with linked profiles are available yet.
                    </p>
                  ) : null}
                </div>
                <fieldset className="flex flex-col gap-1 border-0 p-0">
                  <legend className="text-xs font-medium text-textPrimary">
                    Coaches
                  </legend>
                  <AssignmentCoachMultiSelect
                    id="assignment-coaches"
                    coachOptions={coachOptions}
                    selectedCoachProfileIds={assignmentSelectedCoachIds}
                    disabled={
                      assignmentSubmitting || coachOptions.length === 0
                    }
                    getOptionLines={(opt) =>
                      formatCoachAssignmentOptionLines(
                        opt,
                        assignmentCoachDetails,
                      )
                    }
                    onToggle={toggleAssignmentCoach}
                  />
                  <p className="text-xs text-textSecondary">
                    {assignmentSelectedCoachIds.length === 0
                      ? "No coaches selected"
                      : assignmentSelectedCoachIds.length === 1
                        ? "1 coach selected"
                        : `${assignmentSelectedCoachIds.length} coaches selected`}
                  </p>
                  {!hasCoachOptions ? (
                    <p className="text-xs text-textSecondary">
                      No assignable coaches with linked profiles are available yet.
                    </p>
                  ) : null}
                </fieldset>
                {someSelectedCoachesAlreadyAssigned ? (
                  <p className="text-xs text-warning">
                    Some selected coaches already have an active assignment with
                    this athlete. Those will be skipped.
                  </p>
                ) : null}
                <Button
                  type="submit"
                  variant="primary"
                  loading={assignmentSubmitting}
                  disabled={
                    assignmentSubmitting ||
                    assignmentAthleteProfileId.trim() === "" ||
                    assignmentSelectedCoachIds.length === 0
                  }
                >
                  {assignmentSelectedCoachIds.length <= 1
                    ? "Assign coach to athlete"
                    : "Assign coaches to athlete"}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>

      <DeactivateMemberConfirmModal
        open={deactivateTarget !== null}
        memberPromptName={
          deactivateTarget ? memberNameForDeactivatePrompt(deactivateTarget) : ""
        }
        submitting={deactivateSubmitting}
        error={deactivateError}
        onClose={closeDeactivateMemberModal}
        onConfirm={handleConfirmDeactivateMember}
      />

      <UnassignAssignmentConfirmDialog
        open={unassignModalOpen}
        onClose={closeUnassignAssignmentModal}
        athletePromptName={unassignTarget?.athletePromptName ?? ""}
        submitting={
          unassignTarget !== null &&
          removingAssignmentKey ===
            `${unassignTarget.athleteProfileId}:${unassignTarget.coachProfileId}`
        }
        onConfirm={() => {
          if (!unassignTarget) return;
          void performRemoveAssignment(
            unassignTarget.athleteProfileId,
            unassignTarget.coachProfileId,
          );
        }}
      />
    </div>
  );
}
