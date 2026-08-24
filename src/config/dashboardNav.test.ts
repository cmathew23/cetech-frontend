import { describe, expect, it } from "vitest";

import {
  isCoachSidebarNavItemActive,
  isCoachTrainingPlanRoute,
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
