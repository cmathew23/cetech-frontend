/** Academy admin App Router paths (shared sidebar + links). */
export const adminPaths = {
  dashboard: "/admin/dashboard",
  aboutAcademy: "/admin/about-academy",
  members: "/admin/members",
  invitations: "/admin/invitations",
  assignments: "/admin/assignments",
  coaches: "/admin/coaches",
  athletes: "/admin/athletes",
  profileSettings: "/admin/profile-settings",
} as const;

/** Assignments UI keys the athlete `<select>` by `athleteProfileId` (AthleteProfile.id). */
export function adminAssignmentsPathForAthleteProfile(
  athleteProfileId: string,
): string {
  const id = athleteProfileId.trim();
  if (id === "") return adminPaths.assignments;
  const q = new URLSearchParams({ athleteProfileId: id });
  return `${adminPaths.assignments}?${q.toString()}`;
}
