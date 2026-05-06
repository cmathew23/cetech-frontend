import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const API_BASE = "http://localhost:3000";

const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 900 },
  { name: "768", width: 768, height: 900 },
  { name: "375", width: 375, height: 812 },
];

const pages = [
  { role: "ACADEMY_ADMIN", path: "/admin/dashboard" },
  { role: "ACADEMY_ADMIN", path: "/admin/about-academy" },
  { role: "ACADEMY_ADMIN", path: "/admin/members" },
  { role: "ACADEMY_ADMIN", path: "/admin/invitations" },
  { role: "ACADEMY_ADMIN", path: "/admin/assignments" },
  { role: "ACADEMY_ADMIN", path: "/admin/coaches" },
  { role: "ACADEMY_ADMIN", path: "/admin/athletes" },
  { role: "ACADEMY_ADMIN", path: "/admin/profile-settings" },
  { role: "COACH", path: "/coach/dashboard" },
  { role: "COACH", path: "/coach/invitations" },
  { role: "COACH", path: "/coach/training-plans/ath-1/workflow" },
  { role: "COACH", path: "/coach/athletes/ath-1/level-validation" },
  { role: "ATHLETE", path: "/athlete/dashboard" },
  { role: "ATHLETE", path: "/athlete/invitations" },
  { role: "ATHLETE", path: "/athlete/settings" },
  { role: "ATHLETE", path: "/athlete/profile-planning" },
];

function ok(data) {
  return { success: true, data };
}

function appContextFor(role) {
  return ok({
    user: { userId: "mock-user", roles: [role] },
    activeRole: role,
    academy: {
      hasMembership: true,
      membershipStatus: "ACTIVE",
      trainingEntityId: "entity-1",
      trainingEntityName: "Mock Academy",
    },
    invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
    access: { canAccessDashboard: true, dashboardType: role, reasonCode: "READY" },
    coachSummary: { assignedAthleteCount: 4 },
  });
}

function onboardingFor(role) {
  return ok({
    isAuthenticated: true,
    activeOnboardingRole: role,
    availableRoles: [role],
    hasAthleteProfile: true,
    hasCoachProfile: true,
    activeMembershipCount: 1,
    pendingInvitationCount: 0,
    onboardingStatus: "COMPLETE",
    nextStep: "GO_TO_DASHBOARD",
  });
}

function planningProfileRecord() {
  return {
    athleteContext: {
      dateOfBirth: "2004-01-20T00:00:00.000Z",
      sex: "FEMALE",
    },
    sportContext: {
      primarySport: "Football",
      disciplineOrEvent: "Midfielder",
      validatedLevel: "STATE",
    },
    sportPerformance: {
      highestLevelReached: "National",
      rankingLevel: "Top 50",
    },
    trainingExposure: {
      trainingAgeYears: 6,
      currentWeeklyTrainingExposureHours: 10,
      weeklyAvailabilityDays: 5,
      weeklyAvailabilityHours: 15,
    },
    healthStatus: {
      heightCm: 171,
      weightKg: 62,
      injuryStatus: "No current injury",
    },
    nutritionContext: {
      dietType: "OMNIVORE",
      regionalCuisinePreference: ["North Indian", "Mediterranean"],
      allergiesIntolerances: {
        selected: ["Fish", "Others"],
        othersText: "Nightshades",
        noFoodAllergies: false,
      },
    },
    wearables: {},
    derivedPlanningInputs: {
      derivedAge: 22,
      derivedBmi: 21.2,
    },
    bloodReportParameters: {},
    bodyCompositionParameters: {},
    planningEligibilityStatus: "ELIGIBLE",
    planningInputCompleteness: "COMPLETE",
    missingRequiredFields: [],
    stage: "BASELINE",
    freshnessStatus: "FRESH",
    lastConfirmedAt: "2026-04-01T00:00:00.000Z",
  };
}

function academyAthletes() {
  return ok([
    {
      athleteProfileId: "ath-1",
      userId: "athlete-user-1",
      firstName: "Alice",
      lastName: "Runner",
      email: "alice@example.com",
      sport: "Football",
      level: "STATE",
      membershipStatus: "ACTIVE",
    },
    {
      athleteProfileId: "ath-2",
      userId: "athlete-user-2",
      firstName: "Ben",
      lastName: "Sprint",
      email: "ben@example.com",
      sport: "Tennis",
      level: "NATIONAL",
      membershipStatus: "PENDING",
    },
  ]);
}

function academyCoaches() {
  return ok([
    {
      coachProfileId: "coach-1",
      coachUserId: "coach-user-1",
      firstName: "Carla",
      lastName: "Mentor",
      email: "carla@example.com",
      role: "HEAD_COACH",
      functions: ["PERFORMANCE"],
      membershipStatus: "ACTIVE",
      joinedAt: "2025-12-11T00:00:00.000Z",
    },
    {
      coachProfileId: "coach-2",
      coachUserId: "coach-user-2",
      firstName: "David",
      lastName: "Guide",
      email: "david@example.com",
      role: "ASSISTANT_COACH",
      functions: ["RECOVERY"],
      membershipStatus: "ACTIVE",
      joinedAt: "2025-12-14T00:00:00.000Z",
    },
  ]);
}

function entityMembers() {
  return ok([
    {
      membershipId: "mem-1",
      role: "ATHLETE",
      status: "ACTIVE",
      joinedAt: "2026-01-01T00:00:00.000Z",
      userId: "athlete-user-1",
      firstName: "Alice",
      lastName: "Runner",
      email: "alice@example.com",
    },
    {
      membershipId: "mem-2",
      role: "COACH",
      status: "ACTIVE",
      joinedAt: "2026-01-02T00:00:00.000Z",
      userId: "coach-user-1",
      firstName: "Carla",
      lastName: "Mentor",
      email: "carla@example.com",
    },
  ]);
}

function entityInvitations() {
  return ok([
    {
      id: "inv-1",
      email: "newcoach@example.com",
      role: "COACH",
      status: "PENDING",
      createdAt: "2026-04-10T00:00:00.000Z",
      entityName: "Mock Academy",
    },
    {
      id: "inv-2",
      email: "newathlete@example.com",
      role: "ATHLETE",
      status: "ACCEPTED",
      createdAt: "2026-04-03T00:00:00.000Z",
      entityName: "Mock Academy",
    },
  ]);
}

function entityAssignments() {
  return ok([
    {
      id: "asg-1",
      athleteId: "ath-1",
      athleteName: "Alice Runner",
      athleteEmail: "alice@example.com",
      coachId: "coach-1",
      coachName: "Carla Mentor",
      coachEmail: "carla@example.com",
      relationshipType: "STANDARD",
      location: "HQ",
      isPrimary: true,
      createdAt: "2026-04-08T00:00:00.000Z",
      status: "ACTIVE",
    },
  ]);
}

function assignmentCandidates() {
  return ok({
    athletes: [
      {
        athleteId: "ath-1",
        displayName: "Alice Runner",
        email: "alice@example.com",
      },
      {
        athleteId: "ath-2",
        displayName: "Ben Sprint",
        email: "ben@example.com",
      },
    ],
    coaches: [
      {
        coachId: "coach-1",
        displayName: "Carla Mentor",
        email: "carla@example.com",
      },
      {
        coachId: "coach-2",
        displayName: "David Guide",
        email: "david@example.com",
      },
    ],
  });
}

async function fulfill(route, status, body) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function handleApi(route, role) {
  const req = route.request();
  const url = new URL(req.url());
  const method = req.method();
  const pathname = url.pathname;

  if (pathname === "/auth/me" && method === "GET") {
    return fulfill(route, 200, ok({ userId: "mock-user", roles: [role] }));
  }
  if (pathname === "/me/app-context" && method === "GET") {
    return fulfill(route, 200, appContextFor(role));
  }
  if (pathname === "/onboarding/status" && method === "GET") {
    return fulfill(route, 200, onboardingFor(role));
  }
  if (pathname === "/entities/invitations/me" && method === "GET") {
    return fulfill(route, 200, ok(entityInvitations().data));
  }
  if (pathname === "/athletes/me" && method === "GET") {
    return fulfill(route, 200, ok({ sport: "Football", level: "STATE" }));
  }
  if (pathname === "/profile/me" && method === "GET") {
    return fulfill(
      route,
      200,
      ok({
        userId: "mock-user",
        firstName: "Morgan",
        lastName: role === "ACADEMY_ADMIN" ? "Admin" : role === "COACH" ? "Coach" : "Athlete",
        email: `${role.toLowerCase()}@example.com`,
        phone: "123456789",
        addressLine1: "Road 1",
        city: "Pune",
        state: "MH",
        country: "IN",
      }),
    );
  }
  if (pathname === "/profile/me" && method === "PATCH") {
    return fulfill(
      route,
      200,
      ok({
        userId: "mock-user",
        firstName: "Morgan",
        lastName: "Updated",
        email: `${role.toLowerCase()}@example.com`,
        phone: "123456789",
        addressLine1: "Road 1",
        city: "Pune",
        state: "MH",
        country: "IN",
      }),
    );
  }

  if (pathname === "/coach/me/dashboard" && method === "GET") {
    return fulfill(
      route,
      200,
      ok({
        trainingEntityName: "Mock Academy",
        authority: {
          academyCoachRole: "HEAD_COACH",
          functions: ["PERFORMANCE", "RECOVERY"],
        },
        releaseGate: {
          hasHeadCoachConfigured: true,
          trainingPlanReleaseMode: "DIRECT_RELEASE",
        },
        assignedAthleteCount: 2,
      }),
    );
  }
  if (pathname === "/coach/me/assigned-athletes" && method === "GET") {
    return fulfill(
      route,
      200,
      ok([
        {
          athleteId: "ath-1",
          hasPlanningProfile: true,
          displayName: "Alice Runner",
          email: "alice@example.com",
          lifecycle: "ACTIVE",
          membershipStatus: "ACTIVE",
        },
      ]),
    );
  }

  if (pathname === "/academies/me" && method === "GET") {
    return fulfill(
      route,
      200,
      ok({
        academyId: "academy-1",
        entityId: "entity-1",
        name: "Mock Academy",
        address: "Street 1",
        phone: "123456789",
        email: "academy@example.com",
      }),
    );
  }
  if (pathname === "/academies/me" && method === "PATCH") {
    return fulfill(
      route,
      200,
      ok({
        academyId: "academy-1",
        entityId: "entity-1",
        name: "Mock Academy",
        address: "Street 1",
        phone: "123456789",
        email: "academy@example.com",
      }),
    );
  }
  if (pathname === "/academies/me/athletes" && method === "GET") {
    return fulfill(route, 200, academyAthletes());
  }
  if (pathname === "/academies/me/coaches" && method === "GET") {
    return fulfill(route, 200, academyCoaches());
  }
  if (pathname === "/academies/me/coach-functions" && method === "GET") {
    return fulfill(
      route,
      200,
      ok([
        { value: "PERFORMANCE", label: "Performance" },
        { value: "RECOVERY", label: "Recovery" },
      ]),
    );
  }

  if (pathname === "/entities/entity-1/members" && method === "GET") {
    return fulfill(route, 200, entityMembers());
  }
  if (pathname === "/entities/entity-1/invitations" && method === "GET") {
    return fulfill(route, 200, entityInvitations());
  }
  if (pathname === "/entities/entity-1/assignment-candidates" && method === "GET") {
    return fulfill(route, 200, assignmentCandidates());
  }
  if (pathname === "/entities/entity-1/assignments" && method === "GET") {
    return fulfill(route, 200, entityAssignments());
  }

  if (
    pathname === "/entities/entity-1/athletes/ath-1/planning-profile" &&
    method === "GET"
  ) {
    return fulfill(route, 200, ok(planningProfileRecord()));
  }
  if (
    pathname ===
      "/entities/entity-1/athletes/ath-1/training-plan-generation/level-validation" &&
    method === "GET"
  ) {
    return fulfill(
      route,
      200,
      ok({
        age: 22,
        ageBand: "U23",
        highestLevelReached: "National",
        rankingLevel: "Top 50",
        baseSuggestedLevel: "STATE",
        rankingOverrideApplied: false,
        finalSuggestedLevel: "STATE",
        validatedLevel: "STATE",
        validationStatus: "CONFIRMED",
        reasons: ["Sample reason"],
      }),
    );
  }
  if (
    pathname ===
      "/entities/entity-1/athletes/ath-1/training-plan-generation/level-validation" &&
    method === "POST"
  ) {
    return fulfill(route, 200, ok({}));
  }

  if (pathname === "/entities/entity-1/athlete-planning-profile/me" && method === "GET") {
    return fulfill(route, 200, ok(planningProfileRecord()));
  }
  if (
    pathname === "/entities/entity-1/athlete-planning-profile/me" &&
    (method === "POST" || method === "PATCH")
  ) {
    const body = JSON.parse(req.postData() || "{}");
    return fulfill(route, 200, ok({ ...planningProfileRecord(), ...body }));
  }

  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    return fulfill(route, 200, ok({}));
  }

  return fulfill(route, 200, ok({}));
}

async function run() {
  const outDir = path.resolve("test-results/responsive-audit");
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const pageConfig of pages) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        localStorage.setItem("token", "responsive-token");
      });
      await page.route(`${API_BASE}/**`, async (route) =>
        handleApi(route, pageConfig.role),
      );

      const fullPath = `${BASE_URL}${pageConfig.path}`;
      let status = "ok";
      let error = null;
      try {
        await page.goto(fullPath, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(400);

        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const maxWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
          return {
            viewport: window.innerWidth,
            scrollWidth: maxWidth,
            hasOverflow: maxWidth > window.innerWidth + 1,
          };
        });

        if (metrics.hasOverflow) {
          status = "overflow";
          error = `overflow: scrollWidth=${metrics.scrollWidth}, viewport=${metrics.viewport}`;
        }
      } catch (e) {
        status = "error";
        error = e instanceof Error ? e.message : String(e);
      }

      const fileSafe = `${pageConfig.role}_${pageConfig.path.replaceAll("/", "_")}_${viewport.name}`.replaceAll(
        /[^a-zA-Z0-9_-]/g,
        "",
      );
      const screenshotPath = path.join(outDir, `${fileSafe}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        role: pageConfig.role,
        path: pageConfig.path,
        viewport: viewport.name,
        status,
        error,
        screenshot: screenshotPath,
      });

      await context.close();
    }
  }

  await browser.close();
  const resultPath = path.join(outDir, "results.json");
  await fs.writeFile(resultPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Wrote responsive audit results to ${resultPath}`);

  const failures = results.filter((r) => r.status !== "ok");
  if (failures.length > 0) {
    console.log("Responsive failures:");
    for (const row of failures) {
      console.log(
        `${row.role} ${row.path} @ ${row.viewport}px -> ${row.status}${row.error ? ` (${row.error})` : ""}`,
      );
    }
    process.exitCode = 1;
  }
}

await run();
