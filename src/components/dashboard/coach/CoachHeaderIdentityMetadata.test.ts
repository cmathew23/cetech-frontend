import { describe, expect, it } from "vitest";

import {
  coachHeaderIdentityCacheKey,
  coachNameFromAcademyCoachRow,
  coachNameFromAppContextUser,
  coachNameFromProfileMe,
  findCurrentAcademyCoachRow,
  resolveCoachHeaderName,
} from "@/components/dashboard/coach/CoachHeaderIdentityMetadata";

describe("CoachHeaderIdentityMetadata name helpers", () => {
  it("reads the coach name from app context user fields", () => {
    expect(
      coachNameFromAppContextUser({
        userId: "coach-1",
        roles: ["COACH"],
        firstName: "Kendra",
        lastName: "James",
      }),
    ).toBe("Kendra James");

    expect(
      coachNameFromAppContextUser({
        userId: "coach-1",
        roles: ["COACH"],
        displayName: "Jim Albus",
      }),
    ).toBe("Jim Albus");
  });

  it("reads the coach name from profile/me fields", () => {
    expect(
      coachNameFromProfileMe({
        userId: "coach-1",
        email: "coach@example.com",
        firstName: "Kendra",
        lastName: "James",
        phone: "",
        addressLine1: "",
        city: "",
        state: "",
        country: "",
      }),
    ).toBe("Kendra James");
  });

  it("reads the coach name from the current academy coach row", () => {
    expect(
      coachNameFromAcademyCoachRow({
        firstName: "Kendra",
        lastName: "James",
      }),
    ).toBe("Kendra James");
  });

  it("finds the current academy coach row by user id or email", () => {
    const coaches = [
      {
        coachUserId: "coach-a",
        firstName: "Jim",
        lastName: "Albus",
        email: "jim@example.com",
        membershipStatus: "ACTIVE",
        joinedAt: "—",
        role: "HEAD_COACH" as const,
        functions: [],
      },
      {
        coachUserId: "coach-b",
        firstName: "Kendra",
        lastName: "James",
        email: "kendra@example.com",
        membershipStatus: "ACTIVE",
        joinedAt: "—",
        role: "ASSISTANT_COACH" as const,
        functions: ["NUTRITION_COACH"],
      },
    ];

    expect(
      findCurrentAcademyCoachRow({
        coaches,
        currentCoachUserId: "coach-b",
      })?.firstName,
    ).toBe("Kendra");
    expect(
      findCurrentAcademyCoachRow({
        coaches,
        currentCoachUserId: "",
        currentCoachEmail: "jim@example.com",
      })?.firstName,
    ).toBe("Jim");
  });

  it("returns an empty string when no name source is available", () => {
    expect(coachNameFromAppContextUser(undefined)).toBe("");
    expect(coachNameFromProfileMe(null)).toBe("");
    expect(coachNameFromAcademyCoachRow(null)).toBe("");
  });

  it("uses app context as the stable header source before async fallbacks", () => {
    expect(
      resolveCoachHeaderName({
        appContextUser: {
          userId: "coach-1",
          roles: ["COACH"],
          firstName: "Kendra",
          lastName: "James",
        },
        profileMe: {
          userId: "coach-1",
          email: "coach@example.com",
          firstName: "Profile",
          lastName: "Name",
          phone: "",
          addressLine1: "",
          city: "",
          state: "",
          country: "",
        },
        academyCoachName: "Academy Name",
        cachedCoachName: "Cached Name",
      }),
    ).toBe("Kendra James");
  });

  it("falls back to cached current-coach identity without returning an empty name", () => {
    expect(
      resolveCoachHeaderName({
        appContextUser: { userId: "coach-1", roles: ["COACH"] },
        profileMe: null,
        academyCoachName: "",
        cachedCoachName: "Kendra James",
      }),
    ).toBe("Kendra James");
  });

  it("keys cached coach identity by user id before email", () => {
    expect(
      coachHeaderIdentityCacheKey({
        currentCoachUserId: "coach-1",
        currentCoachEmail: "kendra@example.com",
      }),
    ).toBe("user:coach-1");
    expect(
      coachHeaderIdentityCacheKey({
        currentCoachUserId: "",
        currentCoachEmail: "Kendra@Example.com",
      }),
    ).toBe("email:kendra@example.com");
  });
});
