import { describe, expect, it } from "vitest";

import { parseAccessContextPayload } from "@/lib/accessContext";

describe("parseAccessContextPayload assignedCoaches phone", () => {
  it("reads assignedCoaches[].phone from the existing profile phone field", () => {
    const parsed = parseAccessContextPayload({
      user: { userId: "athlete-1", roles: ["ATHLETE"] },
      activeRole: "ATHLETE",
      academy: {
        hasMembership: true,
        membershipStatus: "ACTIVE",
        trainingEntityId: "entity-1",
        trainingEntityName: "Academy",
      },
      invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
      access: {
        canAccessDashboard: true,
        dashboardType: "ATHLETE",
        reasonCode: "READY",
      },
      coachSummary: { assignedAthleteCount: 0 },
      assignedCoaches: [
        {
          coachId: "coach-1",
          coachName: "Kendra James",
          coachRole: "HEAD_COACH",
          coachFunction: "SKILLS",
          email: "kendra@example.com",
          phone: "555-0100",
          trainingEntityId: "entity-1",
          trainingEntityName: "Academy",
          status: "ACTIVE",
        },
      ],
    });

    expect(parsed.assignedCoaches).toHaveLength(1);
    expect(parsed.assignedCoaches[0]?.phone).toBe("555-0100");
  });

  it("treats missing or blank assigned-coach phone as null", () => {
    const parsed = parseAccessContextPayload({
      user: { userId: "athlete-1", roles: ["ATHLETE"] },
      activeRole: "ATHLETE",
      academy: {
        hasMembership: true,
        membershipStatus: "ACTIVE",
        trainingEntityId: "entity-1",
        trainingEntityName: "Academy",
      },
      invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
      access: {
        canAccessDashboard: true,
        dashboardType: "ATHLETE",
        reasonCode: "READY",
      },
      coachSummary: { assignedAthleteCount: 0 },
      assignedCoaches: [
        {
          coachId: "coach-1",
          coachName: "Kendra James",
          coachRole: "HEAD_COACH",
          coachFunction: "SKILLS",
          email: "kendra@example.com",
          trainingEntityId: "entity-1",
          trainingEntityName: "Academy",
          status: "ACTIVE",
        },
        {
          coachId: "coach-2",
          coachName: "Alex Rivera",
          coachRole: "ASSISTANT_COACH",
          coachFunction: "NUTRITION",
          email: "alex@example.com",
          phone: "   ",
          trainingEntityId: "entity-1",
          trainingEntityName: "Academy",
          status: "ACTIVE",
        },
      ],
    });

    expect(parsed.assignedCoaches[0]?.phone).toBeNull();
    expect(parsed.assignedCoaches[1]?.phone).toBeNull();
  });
});
