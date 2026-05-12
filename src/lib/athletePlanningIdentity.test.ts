import { describe, expect, it } from "vitest";

import {
  parseAccessContextPayload,
  type AccessContextPayload,
} from "@/lib/accessContext";
import { parseAthleteMeProfilePayload } from "@/lib/api/athleteMe";
import { resolveCurrentAthletePlanningIdentifiers } from "@/lib/athletePlanningIdentity";

function accessContext(overrides: Partial<AccessContextPayload> = {}): AccessContextPayload {
  return {
    user: {
      userId: "user-should-not-be-used",
      roles: ["ATHLETE"],
    },
    activeRole: "ATHLETE",
    academy: {
      hasMembership: true,
      membershipStatus: "ACTIVE",
      trainingEntityId: "entity-from-academy",
      trainingEntityName: "Academy",
    },
    invitation: {
      hasPendingInvitation: false,
      pendingInvitationCount: 0,
    },
    access: {
      canAccessDashboard: true,
      dashboardType: "ATHLETE",
      reasonCode: "READY",
    },
    coachSummary: {
      assignedAthleteCount: 0,
    },
    athleteProfile: null,
    assignedCoaches: [],
    ...overrides,
  };
}

describe("resolveCurrentAthletePlanningIdentifiers", () => {
  it("resolves real athlete planning ids from app-context entity and athletes/me id", () => {
    const appContextResponse = {
      data: {
        user: {
          userId: "f19d2ade-93e1-4074-89ed-ca90f59f5647",
          roles: ["ATHLETE"],
        },
        activeRole: "ATHLETE",
        academy: {
          hasMembership: true,
          membershipStatus: "ACTIVE",
          trainingEntityId: "05953c37-5808-4390-859a-c1b6df11659a",
          trainingEntityName: "Academy",
        },
        invitation: {
          hasPendingInvitation: false,
          pendingInvitationCount: 0,
        },
        access: {
          canAccessDashboard: true,
          dashboardType: "ATHLETE",
          reasonCode: "READY",
        },
        coachSummary: {
          assignedAthleteCount: 0,
        },
      },
    };
    const athletesMeResponse = {
      id: "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426",
      userId: "f19d2ade-93e1-4074-89ed-ca90f59f5647",
      sport: "GOLF",
      level: "BEGINNER",
      lifecycle: "ACTIVE",
      coachId: null,
      academyId: null,
    };

    const resolved = resolveCurrentAthletePlanningIdentifiers(
      parseAccessContextPayload(appContextResponse.data),
      parseAthleteMeProfilePayload(athletesMeResponse),
    );

    expect(resolved.status).toBe("ready");
    if (resolved.status === "ready") {
      expect(resolved.ids).toMatchObject({
        entityId: "05953c37-5808-4390-859a-c1b6df11659a",
        athleteId: "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426",
      });
      expect(resolved.ids.athleteId).not.toBe("f19d2ade-93e1-4074-89ed-ca90f59f5647");
    }
  });

  it("parses athlete membership/profile identifiers from app-context", () => {
    const parsed = parseAccessContextPayload({
      user: { userId: "user-id", roles: ["ATHLETE"] },
      activeRole: "ATHLETE",
      academy: {
        hasMembership: true,
        membershipStatus: "ACTIVE",
        trainingEntityId: "academy-entity",
        trainingEntityName: "Academy",
      },
      access: {
        canAccessDashboard: true,
        dashboardType: "ATHLETE",
        reasonCode: "READY",
      },
      activeAthleteMembership: {
        membershipId: "membership-1",
        membershipStatus: "ACTIVE",
        trainingEntityId: "athlete-entity",
        athleteProfile: {
          id: "athlete-profile-id",
        },
      },
    });

    expect(parsed.athleteProfile).toMatchObject({
      athleteProfileId: "athlete-profile-id",
      trainingEntityId: "athlete-entity",
      membershipId: "membership-1",
      membershipStatus: "ACTIVE",
    });
  });

  it("uses AthleteProfile.id from app-context instead of the user id", () => {
    const resolved = resolveCurrentAthletePlanningIdentifiers(
      accessContext({
        athleteProfile: {
          athleteProfileId: "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426",
          trainingEntityId: "05953c37-5808-4390-859a-c1b6df11659a",
          trainingEntityName: "Academy",
          membershipId: "membership-should-not-be-used",
          membershipStatus: "ACTIVE",
        },
      }),
      null,
    );

    expect(resolved).toEqual({
      status: "ready",
      ids: {
        entityId: "05953c37-5808-4390-859a-c1b6df11659a",
        athleteProfileId: "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426",
        athleteId: "18f84b0f-f34e-4eb9-adb4-18ba3bc7e426",
      },
    });
  });

  it("falls back to GET /athletes/me profile id but never to user id", () => {
    const resolved = resolveCurrentAthletePlanningIdentifiers(accessContext(), {
      athleteProfileId: "athlete-profile-from-athletes-me",
    });

    expect(resolved.status).toBe("ready");
    if (resolved.status === "ready") {
      expect(resolved.ids).toMatchObject({
        entityId: "entity-from-academy",
        athleteId: "athlete-profile-from-athletes-me",
      });
      expect(resolved.ids.athleteId).not.toBe("user-should-not-be-used");
    }
  });

  it("does not use stale coach dashboard context on athlete routes", () => {
    const resolved = resolveCurrentAthletePlanningIdentifiers(
      accessContext({
        activeRole: "COACH",
        access: {
          canAccessDashboard: true,
          dashboardType: "COACH",
          reasonCode: "READY",
        },
        athleteProfile: {
          athleteProfileId: "athlete-profile-id",
          trainingEntityId: "coach-entity-id",
          trainingEntityName: "Coach Academy",
          membershipId: "",
          membershipStatus: "ACTIVE",
        },
      }),
      { athleteProfileId: "athlete-profile-id" },
    );

    expect(resolved).toEqual({
      status: "not_ready",
      reason: "not_athlete_context",
    });
  });

  it("requires a profile id before endpoints can be called", () => {
    expect(resolveCurrentAthletePlanningIdentifiers(accessContext(), null)).toEqual({
      status: "not_ready",
      reason: "missing_athlete_profile",
    });
  });
});
