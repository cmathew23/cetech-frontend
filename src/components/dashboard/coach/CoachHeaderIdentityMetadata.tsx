"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyAcademyCoaches,
  type AcademyCoachStructureRow,
} from "@/lib/api/academyMeCoaches";
import { fetchMyProfile, type ProfileMe } from "@/lib/api/profile";
import type { AppContextUser } from "@/lib/accessContext";
import { toTitleCaseInput } from "@/lib/textFormat";
import { useEffect, useMemo, useState } from "react";

const coachHeaderNameCache = new Map<string, string>();

/** Same name fields as GET /me/app-context `user` (see `parseUser`); never email. */
export function coachNameFromAppContextUser(user: AppContextUser | undefined): string {
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
export function coachNameFromProfileMe(profile: ProfileMe | null): string {
  if (!profile) return "";
  const fn = profile.firstName.trim();
  const ln = profile.lastName.trim();
  return [fn, ln].filter((part) => part !== "").join(" ").trim();
}

export function coachNameFromAcademyCoachRow(
  coach: Pick<AcademyCoachStructureRow, "firstName" | "lastName"> | null,
): string {
  if (!coach) return "";
  return [coach.firstName.trim(), coach.lastName.trim()]
    .filter((part) => part !== "")
    .join(" ")
    .trim();
}

export function findCurrentAcademyCoachRow(input: {
  coaches: AcademyCoachStructureRow[];
  currentCoachUserId: string;
  currentCoachEmail?: string;
}): AcademyCoachStructureRow | null {
  const userId = input.currentCoachUserId.trim();
  const email = input.currentCoachEmail?.trim().toLowerCase() ?? "";
  return (
    input.coaches.find((coach) => userId !== "" && coach.coachUserId === userId) ??
    input.coaches.find(
      (coach) => email !== "" && coach.email.trim().toLowerCase() === email,
    ) ??
    null
  );
}

export function coachHeaderIdentityCacheKey(input: {
  currentCoachUserId: string;
  currentCoachEmail?: string;
}): string {
  const userId = input.currentCoachUserId.trim();
  if (userId !== "") return `user:${userId}`;
  const email = input.currentCoachEmail?.trim().toLowerCase() ?? "";
  return email !== "" ? `email:${email}` : "";
}

export function resolveCoachHeaderName(input: {
  appContextUser: AppContextUser | undefined;
  profileMe: ProfileMe | null;
  academyCoachName: string;
  cachedCoachName?: string;
}): string {
  return (
    coachNameFromAppContextUser(input.appContextUser) ||
    coachNameFromProfileMe(input.profileMe) ||
    input.academyCoachName.trim() ||
    input.cachedCoachName?.trim() ||
    ""
  );
}

/**
 * Coach Name / Academy rows for {@link PageHeader} on `/coach/*` routes.
 * Mirrors Athlete header identity pattern (app-context + optional profile/me).
 */
export function CoachHeaderIdentityMetadata() {
  const { accessContext, accessGateReady } = useAuth();
  const [profileMe, setProfileMe] = useState<ProfileMe | null>(null);
  const [academyCoachName, setAcademyCoachName] = useState("");
  const [identityFetchLoading, setIdentityFetchLoading] = useState(false);
  const currentCoachUserId = accessContext?.user.userId?.trim() ?? "";
  const currentCoachEmail = accessContext?.user.email?.trim() ?? "";
  const appContextUser = accessContext?.user;
  const identityCacheKey = coachHeaderIdentityCacheKey({
    currentCoachUserId,
    currentCoachEmail,
  });
  const cachedCoachName =
    identityCacheKey !== "" ? (coachHeaderNameCache.get(identityCacheKey) ?? "") : "";

  useEffect(() => {
    let cancelled = false;
    if (!accessGateReady || identityCacheKey === "") {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      setIdentityFetchLoading(true);

      const [profileResult, coachesResult] = await Promise.allSettled([
        fetchMyProfile(),
        currentCoachUserId !== "" ? fetchMyAcademyCoaches() : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const coachesPayload =
        coachesResult.status === "fulfilled" ? coachesResult.value : null;
      const currentCoach = coachesPayload
        ? findCurrentAcademyCoachRow({
            coaches: coachesPayload.coaches,
            currentCoachUserId,
            currentCoachEmail:
              currentCoachEmail ||
              (profileResult.status === "fulfilled" ? profileResult.value.email : ""),
          })
        : null;
      const nextProfileMe =
        profileResult.status === "fulfilled" ? profileResult.value : null;
      const nextAcademyCoachName = coachNameFromAcademyCoachRow(currentCoach);
      const nextResolvedCoachName = resolveCoachHeaderName({
        appContextUser,
        profileMe: nextProfileMe,
        academyCoachName: nextAcademyCoachName,
        cachedCoachName: coachHeaderNameCache.get(identityCacheKey) ?? "",
      });

      setProfileMe(nextProfileMe);
      setAcademyCoachName(nextAcademyCoachName);
      if (nextResolvedCoachName !== "") {
        coachHeaderNameCache.set(identityCacheKey, nextResolvedCoachName);
      }
      setIdentityFetchLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    appContextUser,
    accessGateReady,
    currentCoachEmail,
    currentCoachUserId,
    identityCacheKey,
  ]);

  const resolvedCoachName = useMemo(() => {
    return resolveCoachHeaderName({
      appContextUser,
      profileMe,
      academyCoachName,
      cachedCoachName,
    });
  }, [academyCoachName, appContextUser, cachedCoachName, profileMe]);

  useEffect(() => {
    if (resolvedCoachName !== "" && identityCacheKey !== "") {
      coachHeaderNameCache.set(identityCacheKey, resolvedCoachName);
    }
  }, [identityCacheKey, resolvedCoachName]);

  const resolvedAcademyName = useMemo(() => {
    const raw = accessContext?.academy?.trainingEntityName?.trim() ?? "";
    return raw !== "" ? toTitleCaseInput(raw) : "";
  }, [accessContext?.academy?.trainingEntityName]);

  const coachDisplay = resolvedCoachName.trim() || "—";
  const identityLoading = !accessGateReady || identityFetchLoading;
  const coachDisplayText = coachDisplay === "—" && identityLoading ? "Loading…" : coachDisplay;
  const academyDisplay = resolvedAcademyName.trim() || "—";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-textSecondary">Coach Name:</span>
        <span className="text-sm font-medium text-textPrimary">{coachDisplayText}</span>
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
