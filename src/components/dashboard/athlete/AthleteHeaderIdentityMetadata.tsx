"use client";

import { useAuth } from "@/hooks/useAuth";
import { fetchMyProfile, type ProfileMe } from "@/lib/api/profile";
import type { AppContextUser } from "@/lib/accessContext";
import { toTitleCaseInput } from "@/lib/textFormat";
import { useEffect, useMemo, useState } from "react";

/** Same name fields as GET /me/app-context `user` (see `parseUser`); never email. */
function athleteNameFromAppContextUser(user: AppContextUser | undefined): string {
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

/** Same as Profile Settings and Academy Admin: GET /profile/me first + last. */
function athleteNameFromProfileMe(profile: ProfileMe | null): string {
  if (!profile) return "";
  const fn = profile.firstName.trim();
  const ln = profile.lastName.trim();
  return [fn, ln].filter((part) => part !== "").join(" ").trim();
}

/**
 * Athlete dashboard identity rows — matches {@link AdminDashboardHeader} metadata styling.
 * Data: `useAuth` app-context + optional GET /profile/me (same pattern as admin dashboard).
 */
export function AthleteHeaderIdentityMetadata() {
  const { accessContext } = useAuth();
  const [profileMe, setProfileMe] = useState<ProfileMe | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await fetchMyProfile().catch((): null => null);
      if (!cancelled) setProfileMe(p);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedAthleteName = useMemo(() => {
    return (
      athleteNameFromAppContextUser(accessContext?.user) ||
      athleteNameFromProfileMe(profileMe) ||
      ""
    );
  }, [accessContext?.user, profileMe]);

  const resolvedAcademyName = useMemo(() => {
    const raw = accessContext?.academy?.trainingEntityName?.trim() ?? "";
    return raw !== "" ? toTitleCaseInput(raw) : "";
  }, [accessContext?.academy?.trainingEntityName]);

  const athleteDisplay = resolvedAthleteName.trim() || "—";
  const academyDisplay = resolvedAcademyName.trim() || "—";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-textSecondary">Athlete Name:</span>
        <span className="text-sm font-medium text-textPrimary">{athleteDisplay}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-textSecondary">Academy:</span>
        <span
          className="text-sm font-medium text-textPrimary"
          aria-live="polite"
        >
          {academyDisplay}
        </span>
      </div>
    </div>
  );
}
