import { describe, expect, it } from "vitest";

import { parseAssignedAthleteRow } from "@/lib/api/coachMe";

describe("parseAssignedAthleteRow", () => {
  it("parses the new domain-neutral plan fields", () => {
    const row = parseAssignedAthleteRow({
      athleteId: "athlete101",
      assignedFunctions: ["NUTRITION"],
      hasPlanningProfile: true,
      currentGenerationDomain: "NUTRITION",
      currentPlanId: "plan-101",
      currentPlanStatus: "ACTIVE",
      displayName: "Athlete 101",
      email: "athlete101@example.com",
      lifecycle: "ACTIVE",
      membershipStatus: "ACTIVE",
    });

    expect(row).toMatchObject({
      athleteId: "athlete101",
      assignedFunctions: ["NUTRITION"],
      hasPlanningProfile: true,
      currentGenerationDomain: "NUTRITION",
      currentPlanId: "plan-101",
      currentPlanStatus: "ACTIVE",
      skillsPlanId: "plan-101",
      planStatus: "ACTIVE",
      validationStatus: null,
    });
  });

  it("falls back to legacy skills fields when current plan fields are absent", () => {
    const row = parseAssignedAthleteRow({
      athleteId: "athlete102",
      hasPlanningProfile: true,
      skillsPlanId: "legacy-plan-102",
      planStatus: "DRAFT",
      displayName: "Athlete 102",
      email: "athlete102@example.com",
      lifecycle: "ACTIVE",
      membershipStatus: "ACTIVE",
    });

    expect(row).toMatchObject({
      athleteId: "athlete102",
      currentGenerationDomain: null,
      currentPlanId: "legacy-plan-102",
      currentPlanStatus: "DRAFT",
      skillsPlanId: "legacy-plan-102",
      planStatus: "DRAFT",
      validationStatus: null,
    });
  });

  it("parses validationStatus when present", () => {
    const row = parseAssignedAthleteRow({
      athleteId: "athlete103",
      hasPlanningProfile: true,
      displayName: "Athlete 103",
      email: "a@example.com",
      lifecycle: "ACTIVE",
      membershipStatus: "ACTIVE",
      validationStatus: "CONFIRMED",
    });
    expect(row?.validationStatus).toBe("CONFIRMED");
  });

  it("omits validation signal when JSON has no validationStatus key", () => {
    const raw: Record<string, unknown> = {
      athleteId: "athlete104",
      hasPlanningProfile: true,
      displayName: "A",
      email: "b@example.com",
      lifecycle: "ACTIVE",
      membershipStatus: "ACTIVE",
    };
    expect("validationStatus" in raw).toBe(false);
    const row = parseAssignedAthleteRow(raw);
    expect(row?.validationStatus).toBeNull();
  });
});
