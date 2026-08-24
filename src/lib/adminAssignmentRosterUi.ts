/**
 * Render predicates for Admin Assignments roster/assignment lists.
 * Distinguishes first load (no usable data yet) from background refresh.
 */

export function rosterHasUsableOptions(
  athleteOptionCount: number,
  coachOptionCount: number,
): boolean {
  return athleteOptionCount > 0 || coachOptionCount > 0;
}

/** Full-page roster loading copy: only when nothing usable has loaded yet. */
export function shouldShowInitialRosterLoading(
  rosterLoading: boolean,
  athleteOptionCount: number,
  coachOptionCount: number,
): boolean {
  return rosterLoading && !rosterHasUsableOptions(athleteOptionCount, coachOptionCount);
}

/** Subtle refresh hint while previously loaded roster options stay visible. */
export function shouldShowRosterRefreshing(
  rosterLoading: boolean,
  athleteOptionCount: number,
  coachOptionCount: number,
): boolean {
  return rosterLoading && rosterHasUsableOptions(athleteOptionCount, coachOptionCount);
}

export function shouldShowAssignmentCreateForm(
  entityId: string | null,
  rosterLoading: boolean,
  athleteOptionCount: number,
  coachOptionCount: number,
): boolean {
  if (entityId === null) return false;
  if (shouldShowInitialRosterLoading(rosterLoading, athleteOptionCount, coachOptionCount)) {
    return false;
  }
  return true;
}

export function shouldShowAssignmentRows(
  assignmentsLoading: boolean,
  assignmentCount: number,
): boolean {
  return assignmentCount > 0;
}

export function shouldShowAssignmentsInitialLoading(
  assignmentsLoading: boolean,
  assignmentCount: number,
): boolean {
  return assignmentsLoading && assignmentCount === 0;
}
