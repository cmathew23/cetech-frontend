import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  COACH_ASSIGNED_ATHLETES_TIMEOUT_MS,
  COACH_ME_DASHBOARD_TIMEOUT_MS,
  fetchCoachAssignedAthletes,
  fetchCoachMeDashboard,
  parseAssignedAthleteRow,
} from "@/lib/api/coachMe";

describe("fetchCoachMeDashboard", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("uses an extended timeout instead of the shared 10s client default", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        authority: { academyCoachRole: "HEAD_COACH", functions: ["SKILLS_COACH"] },
        summary: { assignedAthleteCount: 3 },
      },
    });

    await fetchCoachMeDashboard();

    expect(COACH_ME_DASHBOARD_TIMEOUT_MS).toBe(130_000);
    expect(apiRequestMock).toHaveBeenCalledWith("/coach/me/dashboard", {
      method: "GET",
      cache: "no-store",
      timeoutMs: 130_000,
    });
  });
});

describe("fetchCoachAssignedAthletes", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("uses an extended timeout instead of the shared 10s client default", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: { athletes: [] },
    });

    await fetchCoachAssignedAthletes();

    expect(COACH_ASSIGNED_ATHLETES_TIMEOUT_MS).toBe(30_000);
    expect(apiRequestMock).toHaveBeenCalledWith("/coach/me/assigned-athletes", {
      method: "GET",
      cache: "no-store",
      timeoutMs: 30_000,
    });
  });
});

describe("parseAssignedAthleteRow", () => {
  it("parses the new domain-neutral plan fields", () => {
    const row = parseAssignedAthleteRow({
      athleteId: "athlete101",
      assignedFunctions: ["NUTRITION"],
      hasPlanningProfile: true,
      currentGenerationDomain: "NUTRITION",
      currentPlanId: "plan-101",
      currentPlanStatus: "ACTIVE",
      displayPlanStatus: "COMPLETED",
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
      displayPlanStatus: "COMPLETED",
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
      displayPlanStatus: null,
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
