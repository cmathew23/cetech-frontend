import { describe, expect, it } from "vitest";

import {
  athleteSidebarNavItems,
  coachSidebarNavItems,
  isCoachSidebarNavItemActive,
  isCoachTrainingPlanRoute,
  coachPeakFlowSportCode,
  visibleAthleteSidebarNavItems,
  visibleCoachSidebarNavItems,
} from "@/config/dashboardNav";

const TRAINING_PLAN = "/coach/training-plans";
const ATHLETES = "/coach/athletes";
const DASHBOARD = "/coach/dashboard";
const CHAT = "/coach/chat";
const FYN = "/coach/fyn";
const INVITATIONS = "/coach/dashboard/invitations";
const SETTINGS = "/coach/settings";

describe("isCoachSidebarNavItemActive", () => {
  it("marks Training Plan active on the training plan list", () => {
    expect(isCoachSidebarNavItemActive("/coach/training-plans", TRAINING_PLAN)).toBe(
      true,
    );
    expect(isCoachSidebarNavItemActive("/coach/training-plans", ATHLETES)).toBe(false);
  });

  it("marks Training Plan active on athlete-specific training-plan workflow pages", () => {
    const routes = [
      "/coach/training-plans/athlete-1/workflow",
      "/coach/training-plans/athlete-1/workflow?planId=plan-skills&skillsPlanId=plan-skills",
      "/coach/athletes/athlete-1/planning-profile",
      "/coach/athletes/athlete-1/planning-profile?planId=plan-skills&skillsPlanId=plan-skills",
    ];

    for (const route of routes) {
      expect(isCoachTrainingPlanRoute(route)).toBe(true);
      expect(isCoachSidebarNavItemActive(route, TRAINING_PLAN)).toBe(true);
      expect(isCoachSidebarNavItemActive(route, ATHLETES)).toBe(false);
    }
  });

  it("marks Training Plan active for Skills, Nutrition, and S&C review/planning routes", () => {
    const domainReviewRoutes = [
      "/coach/athletes/athlete-1/planning-profile?planId=plan-skills&skillsPlanId=plan-skills",
      "/coach/athletes/athlete-1/planning-profile?planId=plan-nutrition&nutritionPlanId=plan-nutrition",
      "/coach/athletes/athlete-1/planning-profile?planId=plan-sandc&sandCPlanId=plan-sandc",
      "/coach/training-plans/athlete-1/workflow?planId=plan-skills&skillsPlanId=plan-skills",
      "/coach/training-plans/athlete-1/workflow?planId=plan-nutrition&nutritionPlanId=plan-nutrition",
      "/coach/training-plans/athlete-1/workflow?planId=plan-sandc&sandCPlanId=plan-sandc",
      "/coach/athletes/athlete-1/level-validation",
    ];

    for (const route of domainReviewRoutes) {
      expect(isCoachSidebarNavItemActive(route, TRAINING_PLAN)).toBe(true);
      expect(isCoachSidebarNavItemActive(route, ATHLETES)).toBe(false);
    }
  });

  it("marks Athletes active on genuine athlete management/profile routes", () => {
    expect(isCoachSidebarNavItemActive("/coach/athletes", ATHLETES)).toBe(true);
    expect(isCoachSidebarNavItemActive("/coach/athletes", TRAINING_PLAN)).toBe(false);
    expect(isCoachSidebarNavItemActive("/coach/athletes/athlete-1", ATHLETES)).toBe(
      true,
    );
    expect(
      isCoachSidebarNavItemActive("/coach/athletes/athlete-1", TRAINING_PLAN),
    ).toBe(false);
    expect(
      isCoachSidebarNavItemActive("/coach/athletes/athlete-1/profile", ATHLETES),
    ).toBe(true);
    expect(
      isCoachSidebarNavItemActive("/coach/athletes/athlete-1/profile", TRAINING_PLAN),
    ).toBe(false);
  });

  it("leaves Dashboard, Chat, Fyn, and Invitations behavior unchanged", () => {
    expect(isCoachSidebarNavItemActive("/coach/dashboard", DASHBOARD)).toBe(true);
    expect(
      isCoachSidebarNavItemActive("/coach/dashboard/invitations", DASHBOARD),
    ).toBe(false);
    expect(
      isCoachSidebarNavItemActive("/coach/dashboard/invitations", INVITATIONS),
    ).toBe(true);

    expect(isCoachSidebarNavItemActive("/coach/chat", CHAT)).toBe(true);
    expect(isCoachSidebarNavItemActive("/coach/chat/thread-1", CHAT)).toBe(true);
    expect(isCoachSidebarNavItemActive("/coach/fyn", FYN)).toBe(true);

    expect(isCoachSidebarNavItemActive("/coach/training-plans", DASHBOARD)).toBe(
      false,
    );
    expect(isCoachSidebarNavItemActive("/coach/training-plans", CHAT)).toBe(false);
    expect(isCoachSidebarNavItemActive("/coach/training-plans", FYN)).toBe(false);
    expect(
      isCoachSidebarNavItemActive("/coach/athletes/athlete-1/planning-profile", CHAT),
    ).toBe(false);
  });

  it("marks Settings active only on /coach/settings", () => {
    expect(isCoachSidebarNavItemActive("/coach/settings", SETTINGS)).toBe(true);
    expect(isCoachSidebarNavItemActive("/coach/settings", DASHBOARD)).toBe(false);
    expect(isCoachSidebarNavItemActive("/coach/dashboard", SETTINGS)).toBe(false);
  });
});

describe("PeakConnect module labels", () => {
  it("uses PeakConnect for coach and athlete chat sidebar items", () => {
    expect(
      coachSidebarNavItems.find((item) => item.href === "/coach/chat")?.label,
    ).toBe("PeakConnect");
    expect(
      athleteSidebarNavItems.find((item) => item.href === "/athlete/chat")?.label,
    ).toBe("PeakConnect");
  });

  it("adds PeakFlow Swing to the athlete sidebar", () => {
    expect(
      athleteSidebarNavItems.find((item) => item.href === "/athlete/peakflow-swing")
        ?.label,
    ).toBe("PeakFlow Swing");
  });

  it("shows PeakFlow Swing only when sportCode is GOLF", () => {
    expect(
      visibleAthleteSidebarNavItems("GOLF").some(
        (item) => item.href === "/athlete/peakflow-swing",
      ),
    ).toBe(true);

    for (const sportCode of ["TENNIS", "CRICKET", "", null, undefined]) {
      const items = visibleAthleteSidebarNavItems(sportCode);
      expect(items.some((item) => item.href === "/athlete/peakflow-swing")).toBe(false);
      expect(items.some((item) => item.href === "/athlete/dashboard")).toBe(true);
    }
  });

  it("adds PeakFlow Swing to the golf coach sidebar", () => {
    expect(
      coachSidebarNavItems.find((item) => item.href === "/coach/peakflow-swing")?.label,
    ).toBe("PeakFlow Swing");
    expect(coachSidebarNavItems[1]?.href).toBe("/coach/peakflow-swing");
    expect(coachPeakFlowSportCode(["TENNIS", "GOLF"])).toBe("GOLF");
    expect(coachPeakFlowSportCode(["TENNIS"])).toBe("TENNIS");
    expect(coachPeakFlowSportCode([])).toBe("");

    expect(
      visibleCoachSidebarNavItems("GOLF").some((item) => item.href === "/coach/peakflow-swing"),
    ).toBe(true);
    expect(
      visibleCoachSidebarNavItems("").some((item) => item.href === "/coach/peakflow-swing"),
    ).toBe(true);
    expect(
      visibleCoachSidebarNavItems(null).some((item) => item.href === "/coach/peakflow-swing"),
    ).toBe(true);
    expect(
      visibleCoachSidebarNavItems("TENNIS").some((item) => item.href === "/coach/peakflow-swing"),
    ).toBe(false);
    expect(
      visibleCoachSidebarNavItems("TENNIS").some((item) => item.href === "/coach/dashboard"),
    ).toBe(true);
    expect(isCoachSidebarNavItemActive("/coach/peakflow-swing", "/coach/peakflow-swing")).toBe(true);
    expect(isCoachSidebarNavItemActive("/coach/peakflow-swing", "/coach/dashboard")).toBe(false);
  });

  it("adds a Competitions item to the athlete sidebar", () => {
    expect(
      athleteSidebarNavItems.find((item) => item.href === "/athlete/competitions")
        ?.label,
    ).toBe("Competitions");
    expect(
      coachSidebarNavItems.find((item) => item.href === "/coach/competitions"),
    ).toBeUndefined();
  });
});
