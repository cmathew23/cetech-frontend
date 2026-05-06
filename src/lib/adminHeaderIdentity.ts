import type { AppContextUser } from "@/lib/accessContext";
import type { MyAcademyProfile } from "@/lib/api/academyAdmin";
import type { ProfileMe } from "@/lib/api/profile";
import { toTitleCaseInput } from "@/lib/textFormat";

export function adminNameFromAcademyProfile(profile: MyAcademyProfile): string {
  const read = (value?: string) => value?.trim() ?? "";
  const extra = profile as MyAcademyProfile & {
    admin?: { name?: string; fullName?: string; displayName?: string };
    settingsProfile?: { name?: string; fullName?: string; displayName?: string };
  };
  const candidates = [
    profile.user,
    profile.currentUser,
    profile.profile,
    extra.admin,
    extra.settingsProfile,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved =
      read(candidate.name) ||
      read(candidate.fullName) ||
      read(candidate.displayName);
    if (resolved !== "") return resolved;
  }
  return "";
}

/** GET /me/app-context `user` (see `parseUser`); never email. */
export function adminNameFromAppContextUser(
  user: AppContextUser | undefined,
): string {
  if (!user) return "";
  const read = (value?: string) => value?.trim() ?? "";
  const fromSingle =
    read(user.name) || read(user.fullName) || read(user.displayName);
  if (fromSingle !== "") return fromSingle;
  return [read(user.firstName), read(user.lastName)]
    .filter((part) => part !== "")
    .join(" ")
    .trim();
}

/** GET /profile/me first + last (Profile Settings). */
export function adminNameFromProfileMe(profile: ProfileMe | null): string {
  if (!profile) return "";
  const fn = profile.firstName.trim();
  const ln = profile.lastName.trim();
  return [fn, ln].filter((part) => part !== "").join(" ").trim();
}

export function resolveAdminDisplayName(
  accessUser: AppContextUser | undefined,
  academyProfile: MyAcademyProfile | null,
  profileMe: ProfileMe | null,
): string {
  return (
    adminNameFromAppContextUser(accessUser) ||
    (academyProfile ? adminNameFromAcademyProfile(academyProfile) : "") ||
    adminNameFromProfileMe(profileMe) ||
    ""
  );
}

/** Academy label from GET /academies/me `name` (same as dashboard header). */
export function resolveAcademyHeaderDisplayName(
  academyProfile: MyAcademyProfile | null,
): string {
  const raw = academyProfile?.name?.trim() ?? "";
  return raw !== "" ? toTitleCaseInput(raw) : "";
}
