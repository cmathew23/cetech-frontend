"use client";

import { useAuth } from "@/hooks/useAuth";
import { fetchMyProfile, type ProfileMe } from "@/lib/api/profile";
import type { AppContextUser } from "@/lib/accessContext";
import { toTitleCaseInput } from "@/lib/textFormat";
import { useEffect, useMemo, useState } from "react";

/** Same name fields as GET /me/app-context `user` (see `parseUser`); never email. */
function coachNameFromAppContextUser(user: AppContextUser | undefined): string {
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

/** Same as Profile Settings: GET /profile/me first + last. */
function coachNameFromProfileMe(profile: ProfileMe | null): string {
  if (!profile) return "";
  const fn = profile.firstName.trim();
  const ln = profile.lastName.trim();
  return [fn, ln].filter((part) => part !== "").join(" ").trim();
}

/**
 * Coach Name / Academy rows for {@link PageHeader} on `/coach/*` routes.
 * Mirrors Athlete header identity pattern (app-context + optional profile/me).
 */
export function CoachHeaderIdentityMetadata() {
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

  const resolvedCoachName = useMemo(() => {
    return (
      coachNameFromAppContextUser(accessContext?.user) ||
      coachNameFromProfileMe(profileMe) ||
      ""
    );
  }, [accessContext?.user, profileMe]);

  const resolvedAcademyName = useMemo(() => {
    const raw = accessContext?.academy?.trainingEntityName?.trim() ?? "";
    return raw !== "" ? toTitleCaseInput(raw) : "";
  }, [accessContext?.academy?.trainingEntityName]);

  const coachDisplay = resolvedCoachName.trim() || "—";
  const academyDisplay = resolvedAcademyName.trim() || "—";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-textSecondary">Coach Name:</span>
        <span className="text-sm font-medium text-textPrimary">{coachDisplay}</span>
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
