import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const API_BASE = "http://localhost:3000";

const ALL_VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 900 },
  { name: "768", width: 768, height: 900 },
  { name: "375", width: 375, height: 812 },
];

const MOBILE_VIEWPORT = [{ name: "375", width: 375, height: 812 }];

const SCENARIOS = [
  { name: "extreme", viewports: ALL_VIEWPORTS },
  { name: "empty", viewports: MOBILE_VIEWPORT },
  { name: "error", viewports: MOBILE_VIEWPORT },
  { name: "loading", viewports: MOBILE_VIEWPORT },
];

const PAGES = [
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
  { role: "COACH", path: "/coach/athletes/ath-1/planning-profile" },
  { role: "COACH", path: "/coach/athletes/ath-1/level-validation" },
  { role: "ATHLETE", path: "/athlete/dashboard" },
  { role: "ATHLETE", path: "/athlete/invitations" },
  { role: "ATHLETE", path: "/athlete/settings" },
  { role: "ATHLETE", path: "/athlete/profile-planning" },
];

function ok(data) {
  return { success: true, data };
}

function longToken(prefix, index, length = 40) {
  const seed = `${prefix}_${index}_`;
  return `${seed}${"x".repeat(Math.max(0, length - seed.length))}`;
}

function longName(prefix, index) {
  return `${longToken(prefix, index, 26)} ${longToken("Surname", index, 24)}`;
}

function longEmail(prefix, index) {
  return `${longToken(prefix, index, 30).toLowerCase()}@${longToken("maildomain", index, 18).toLowerCase()}.example.com`;
}

function longAcademyName() {
  return `${longToken("GlobalAcademyPerformanceCenter", 1, 30)} ${longToken("RegionalHighPerformanceCampus", 2, 30)}`;
}

function appContextFor(role) {
  return ok({
    user: { userId: "mock-user", roles: [role] },
    activeRole: role,
    academy: {
      hasMembership: true,
      membershipStatus: "ACTIVE",
      trainingEntityId: "entity-1",
      trainingEntityName: longAcademyName(),
    },
    invitation: { hasPendingInvitation: true, pendingInvitationCount: 28 },
    access: { canAccessDashboard: true, dashboardType: role, reasonCode: "READY" },
    coachSummary: { assignedAthleteCount: 44 },
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
    pendingInvitationCount: 28,
    onboardingStatus: "COMPLETE",
    nextStep: "GO_TO_DASHBOARD",
  });
}

function planningProfileRecordExtreme() {
  return {
    athleteContext: {
      dateOfBirth: "2000-04-12T00:00:00.000Z",
      sex: "FEMALE",
    },
    sportContext: {
      primarySport: "Ultra Marathon Multi Stage Trail Running",
      disciplineOrEvent:
        "Long Distance Mixed Terrain Endurance Event Category With Extended Naming",
      validatedLevel: "NATIONAL",
    },
    sportPerformance: {
      highestLevelReached:
        "National Championship Finalist Across Multiple Categories",
      rankingLevel: "Top 10 National Circuit",
    },
    trainingExposure: {
      trainingAgeYears: 12,
      currentWeeklyTrainingExposureHours: 21,
      weeklyAvailabilityDays: 6,
      weeklyAvailabilityHours: 25,
    },
    healthStatus: {
      heightCm: 174,
      weightKg: 64,
      injuryStatus:
        "Recovered from overuse injury, currently full return to training with monitored load",
    },
    nutritionContext: {
      dietType: "OMNIVORE",
      regionalCuisinePreference: [
        "North Indian",
        "South Indian",
        "West Indian",
        "East Indian",
        "Continental",
        "Asian",
        "Mediterranean",
        "Middle Eastern",
        "Latin American",
      ],
      allergiesIntolerances: {
        selected: ["Fish", "Nuts", "Sesame seeds", "Others"],
        othersText:
          "Nightshades intolerance with delayed gastrointestinal symptoms after mixed meal exposure and high spice combinations",
        noFoodAllergies: false,
      },
    },
    wearables: {},
    derivedPlanningInputs: {
      derivedAge: 26,
      derivedBmi: 21.1,
    },
    bloodReportParameters: {
      hemoglobin: 13.2,
      vitaminD: 34,
      vitaminB12: 400,
      ferritin: 55,
      crp: 0.9,
    },
    bodyCompositionParameters: {
      bodyFatPercent: 18,
      skeletalLeanMass: 31,
      skeletalFatMass: 12,
      visceralFat: 7,
      bmr: 1430,
      muscleMass: 49,
    },
    planningEligibilityStatus: "ELIGIBLE",
    planningInputCompleteness: "COMPLETE",
    missingRequiredFields: [],
    stage: "BASELINE",
    freshnessStatus: "FRESH",
    lastConfirmedAt: "2026-04-01T00:00:00.000Z",
  };
}

function academyAthletesExtreme() {
  return ok(
    Array.from({ length: 40 }, (_, i) => {
      const idx = i + 1;
      return {
        athleteProfileId: `ath-${idx}`,
        userId: `athlete-user-${idx}`,
        firstName: longToken("AthleteFirstName", idx, 24),
        lastName: longToken("AthleteLastName", idx, 22),
        email: longEmail("athleteaddress", idx),
        sport:
          idx % 2 === 0
            ? "Association Football Multi Position Development"
            : "Track and Field Long Distance Endurance",
        level: idx % 3 === 0 ? "NATIONAL" : "STATE",
        membershipStatus: idx % 5 === 0 ? "PENDING" : "ACTIVE",
      };
    }),
  );
}

function academyCoachesExtreme() {
  return ok(
    Array.from({ length: 28 }, (_, i) => {
      const idx = i + 1;
      return {
        coachProfileId: `coach-${idx}`,
        coachUserId: `coach-user-${idx}`,
        firstName: longToken("CoachFirstName", idx, 24),
        lastName: longToken("CoachLastName", idx, 22),
        email: longEmail("coachaddress", idx),
        role: idx % 5 === 0 ? "ASSISTANT_COACH" : "HEAD_COACH",
        functions:
          idx % 2 === 0
            ? ["PERFORMANCE", "RECOVERY", "NUTRITION"]
            : ["PERFORMANCE", "PSYCHOLOGY"],
        membershipStatus: idx % 6 === 0 ? "PENDING" : "ACTIVE",
        joinedAt: "2026-01-01T00:00:00.000Z",
      };
    }),
  );
}

function entityMembersExtreme() {
  const athletes = Array.from({ length: 30 }, (_, i) => {
    const idx = i + 1;
    return {
      membershipId: `member-ath-${idx}`,
      role: "ATHLETE",
      status: idx % 7 === 0 ? "REMOVED" : "ACTIVE",
      joinedAt: "2026-01-01T00:00:00.000Z",
      userId: `athlete-user-${idx}`,
      firstName: longToken("AthleteGivenName", idx, 24),
      lastName: longToken("AthleteFamilyName", idx, 24),
      email: longEmail("athletemember", idx),
    };
  });
  const coaches = Array.from({ length: 20 }, (_, i) => {
    const idx = i + 1;
    return {
      membershipId: `member-coach-${idx}`,
      role: "COACH",
      status: idx % 6 === 0 ? "PENDING" : "ACTIVE",
      joinedAt: "2026-01-03T00:00:00.000Z",
      userId: `coach-user-${idx}`,
      firstName: longToken("CoachGivenName", idx, 22),
      lastName: longToken("CoachFamilyName", idx, 22),
      email: longEmail("coachmember", idx),
    };
  });
  return ok([...athletes, ...coaches]);
}

function entityInvitationsExtreme() {
  return ok(
    Array.from({ length: 36 }, (_, i) => {
      const idx = i + 1;
      return {
        id: `inv-${idx}`,
        email: longEmail("invitee", idx),
        role: idx % 2 === 0 ? "ATHLETE" : "COACH",
        status:
          idx % 4 === 0 ? "ACCEPTED" : idx % 5 === 0 ? "DECLINED" : "PENDING",
        createdAt: "2026-04-10T00:00:00.000Z",
        entityName: longAcademyName(),
      };
    }),
  );
}

function entityAssignmentsExtreme() {
  return ok(
    Array.from({ length: 42 }, (_, i) => {
      const idx = i + 1;
      return {
        id: `asg-${idx}`,
        athleteId: `ath-${(idx % 30) + 1}`,
        athleteName: longName("AssignedAthleteName", idx),
        athleteEmail: longEmail("assignedathlete", idx),
        coachId: `coach-${(idx % 20) + 1}`,
        coachName: longName("AssignedCoachName", idx),
        coachEmail: longEmail("assignedcoach", idx),
        relationshipType: "STANDARD",
        location: "HIGH_PERFORMANCE_HUB",
        isPrimary: idx % 3 === 0,
        createdAt: "2026-04-08T00:00:00.000Z",
        status: "ACTIVE",
      };
    }),
  );
}

function assignmentCandidatesExtreme() {
  return ok({
    athletes: Array.from({ length: 30 }, (_, i) => {
      const idx = i + 1;
      return {
        athleteId: `ath-${idx}`,
        displayName: longName("CandidateAthleteName", idx),
        email: longEmail("candidateathlete", idx),
      };
    }),
    coaches: Array.from({ length: 20 }, (_, i) => {
      const idx = i + 1;
      return {
        coachId: `coach-${idx}`,
        displayName: longName("CandidateCoachName", idx),
        email: longEmail("candidatecoach", idx),
      };
    }),
  });
}

async function fulfill(route, status, body, delayMs = 0) {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function emptyByPath(pathname, method, role) {
  if (pathname === "/auth/me" && method === "GET") {
    return { status: 200, body: ok({ userId: "mock-user", roles: [role] }) };
  }
  if (pathname === "/me/app-context" && method === "GET") {
    const app = appContextFor(role);
    app.data.invitation.pendingInvitationCount = 0;
    return { status: 200, body: app };
  }
  if (pathname === "/onboarding/status" && method === "GET") {
    return { status: 200, body: onboardingFor(role) };
  }
  if (pathname === "/entities/invitations/me" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/athletes/me" && method === "GET") {
    return { status: 200, body: ok({ sport: "", level: "" }) };
  }
  if (pathname === "/profile/me" && method === "GET") {
    return {
      status: 200,
      body: ok({
        userId: "mock-user",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        addressLine1: "",
        city: "",
        state: "",
        country: "",
      }),
    };
  }
  if (pathname === "/profile/me" && method === "PATCH") {
    return {
      status: 200,
      body: ok({
        userId: "mock-user",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        addressLine1: "",
        city: "",
        state: "",
        country: "",
      }),
    };
  }
  if (pathname === "/coach/me/dashboard" && method === "GET") {
    return {
      status: 200,
      body: ok({
        trainingEntityName: "",
        authority: { academyCoachRole: "", functions: [] },
        releaseGate: {
          hasHeadCoachConfigured: false,
          trainingPlanReleaseMode: "",
        },
        assignedAthleteCount: 0,
      }),
    };
  }
  if (pathname === "/coach/me/assigned-athletes" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/academies/me" && method === "GET") {
    return { status: 200, body: ok(null) };
  }
  if (pathname === "/academies/me" && method === "PATCH") {
    return { status: 200, body: ok(null) };
  }
  if (pathname === "/academies/me/athletes" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/academies/me/coaches" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/academies/me/coach-functions" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/entities/entity-1/members" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/entities/entity-1/invitations" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/entities/entity-1/assignment-candidates" && method === "GET") {
    return { status: 200, body: ok({ athletes: [], coaches: [] }) };
  }
  if (pathname === "/entities/entity-1/assignments" && method === "GET") {
    return { status: 200, body: ok([]) };
  }
  if (pathname === "/entities/entity-1/athletes/ath-1/planning-profile" && method === "GET") {
    return { status: 200, body: ok({}) };
  }
  if (
    pathname ===
      "/entities/entity-1/athletes/ath-1/training-plan-generation/level-validation" &&
    method === "GET"
  ) {
    return {
      status: 200,
      body: ok({
        age: null,
        ageBand: null,
        highestLevelReached: null,
        rankingLevel: null,
        baseSuggestedLevel: null,
        rankingOverrideApplied: null,
        finalSuggestedLevel: null,
        validatedLevel: null,
        validationStatus: null,
        reasons: [],
      }),
    };
  }
  if (pathname === "/entities/entity-1/athlete-planning-profile/me" && method === "GET") {
    return { status: 404, body: { success: false, message: "not found" } };
  }
  return { status: 200, body: ok({}) };
}

function errorByPath(pathname, method, role) {
  if (pathname === "/auth/me" && method === "GET") {
    return { status: 200, body: ok({ userId: "mock-user", roles: [role] }) };
  }
  if (pathname === "/me/app-context" && method === "GET") {
    return { status: 200, body: appContextFor(role) };
  }
  if (pathname === "/onboarding/status" && method === "GET") {
    return { status: 200, body: onboardingFor(role) };
  }
  if (pathname === "/entities/invitations/me" && method === "GET") {
    return { status: 500, body: { success: false, message: "stress error" } };
  }
  if (method === "GET") {
    return { status: 500, body: { success: false, message: "stress error" } };
  }
  return { status: 200, body: ok({}) };
}

function extremeByPath(pathname, method, role) {
  if (pathname === "/auth/me" && method === "GET") {
    return { status: 200, body: ok({ userId: "mock-user", roles: [role] }) };
  }
  if (pathname === "/me/app-context" && method === "GET") {
    return { status: 200, body: appContextFor(role) };
  }
  if (pathname === "/onboarding/status" && method === "GET") {
    return { status: 200, body: onboardingFor(role) };
  }
  if (pathname === "/entities/invitations/me" && method === "GET") {
    return { status: 200, body: ok(entityInvitationsExtreme().data) };
  }
  if (pathname === "/athletes/me" && method === "GET") {
    return {
      status: 200,
      body: ok({
        sport:
          "Association Football Multi Position Development Pathway With Long Naming",
        level: "NATIONAL",
      }),
    };
  }
  if (pathname === "/profile/me" && method === "GET") {
    return {
      status: 200,
      body: ok({
        userId: "mock-user",
        firstName: longToken("ProfileGivenName", 1, 25),
        lastName: longToken("ProfileFamilyName", 1, 25),
        email: longEmail("profileowner", 1),
        phone: "999999999999",
        addressLine1:
          "Building 401, High Performance Residency Block, Long Address Corridor",
        city: "PuneMetropolitanLongCityName",
        state: "MaharashtraStateLongName",
        country: "RepublicOfIndiaLongCountryLabel",
      }),
    };
  }
  if (pathname === "/profile/me" && method === "PATCH") {
    return extremeByPath("/profile/me", "GET", role);
  }
  if (pathname === "/coach/me/dashboard" && method === "GET") {
    return {
      status: 200,
      body: ok({
        trainingEntityName: longAcademyName(),
        authority: {
          academyCoachRole: "HEAD_COACH",
          functions: ["PERFORMANCE", "RECOVERY", "PSYCHOLOGY", "NUTRITION"],
        },
        releaseGate: {
          hasHeadCoachConfigured: true,
          trainingPlanReleaseMode: "DIRECT_RELEASE",
        },
        assignedAthleteCount: 42,
      }),
    };
  }
  if (pathname === "/coach/me/assigned-athletes" && method === "GET") {
    return {
      status: 200,
      body: ok(
        Array.from({ length: 28 }, (_, i) => {
          const idx = i + 1;
          return {
            athleteId: `ath-${idx}`,
            hasPlanningProfile: true,
            displayName: longName("CoachAssignedAthlete", idx),
            email: longEmail("coachassignedathlete", idx),
            lifecycle: idx % 2 === 0 ? "ACTIVE" : "TRANSITION",
            membershipStatus: idx % 3 === 0 ? "PENDING" : "ACTIVE",
          };
        }),
      ),
    };
  }
  if (pathname === "/academies/me" && method === "GET") {
    return {
      status: 200,
      body: ok({
        academyId: "academy-1",
        entityId: "entity-1",
        name: longAcademyName(),
        address:
          "Ultra Long Address Road Segment For Academy Headquarters Campus Block C Wing",
        phone: "123456789123",
        email: longEmail("academycontact", 1),
      }),
    };
  }
  if (pathname === "/academies/me" && method === "PATCH") {
    return extremeByPath("/academies/me", "GET", role);
  }
  if (pathname === "/academies/me/athletes" && method === "GET") {
    return { status: 200, body: academyAthletesExtreme() };
  }
  if (pathname === "/academies/me/coaches" && method === "GET") {
    return { status: 200, body: academyCoachesExtreme() };
  }
  if (pathname === "/academies/me/coach-functions" && method === "GET") {
    return {
      status: 200,
      body: ok([
        { value: "PERFORMANCE", label: "Performance And Conditioning" },
        { value: "RECOVERY", label: "Recovery Management" },
        { value: "NUTRITION", label: "Sports Nutrition Strategy" },
        { value: "PSYCHOLOGY", label: "Performance Psychology" },
      ]),
    };
  }
  if (pathname === "/entities/entity-1/members" && method === "GET") {
    return { status: 200, body: entityMembersExtreme() };
  }
  if (pathname === "/entities/entity-1/invitations" && method === "GET") {
    return { status: 200, body: entityInvitationsExtreme() };
  }
  if (pathname === "/entities/entity-1/assignment-candidates" && method === "GET") {
    return { status: 200, body: assignmentCandidatesExtreme() };
  }
  if (pathname === "/entities/entity-1/assignments" && method === "GET") {
    return { status: 200, body: entityAssignmentsExtreme() };
  }
  if (pathname === "/entities/entity-1/athletes/ath-1/planning-profile" && method === "GET") {
    return { status: 200, body: ok(planningProfileRecordExtreme()) };
  }
  if (
    pathname ===
      "/entities/entity-1/athletes/ath-1/training-plan-generation/level-validation" &&
    method === "GET"
  ) {
    return {
      status: 200,
      body: ok({
        age: 26,
        ageBand: "U27",
        highestLevelReached:
          "National Finals Across Multiple Categories With Extended Title",
        rankingLevel: "Top 5 Elite National Ranking Circuit",
        baseSuggestedLevel: "NATIONAL",
        rankingOverrideApplied: true,
        finalSuggestedLevel: "NATIONAL",
        validatedLevel: "NATIONAL",
        validationStatus: "CONFIRMED",
        reasons: [
          "High competitive exposure and long training history",
          "Consistent ranking progression",
          "Coach override maintained after detailed review",
        ],
      }),
    };
  }
  if (
    pathname ===
      "/entities/entity-1/athletes/ath-1/training-plan-generation/level-validation" &&
    method === "POST"
  ) {
    return { status: 200, body: ok({}) };
  }
  if (pathname === "/entities/entity-1/athlete-planning-profile/me" && method === "GET") {
    return { status: 200, body: ok(planningProfileRecordExtreme()) };
  }
  if (
    pathname === "/entities/entity-1/athlete-planning-profile/me" &&
    (method === "POST" || method === "PATCH")
  ) {
    return { status: 200, body: ok(planningProfileRecordExtreme()) };
  }
  if (method === "POST" || method === "PATCH" || method === "DELETE") {
    return { status: 200, body: ok({}) };
  }
  return { status: 200, body: ok({}) };
}

function responseForScenario(scenario, pathname, method, role) {
  if (scenario === "extreme") return extremeByPath(pathname, method, role);
  if (scenario === "empty") return emptyByPath(pathname, method, role);
  if (scenario === "error") return errorByPath(pathname, method, role);
  return extremeByPath(pathname, method, role);
}

async function handleApi(route, role, scenario) {
  const req = route.request();
  const url = new URL(req.url());
  const method = req.method();
  const pathname = url.pathname;

  const response = responseForScenario(scenario, pathname, method, role);
  const delayMs =
    scenario === "loading" && method === "GET" && pathname !== "/auth/me"
      ? 2500
      : 0;
  return fulfill(route, response.status, response.body, delayMs);
}

async function analyzePage(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const maxWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
    const hasOverflow = maxWidth > window.innerWidth + 1;

    const clipped = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof HTMLElement)) continue;
      const style = window.getComputedStyle(node);
      const className = typeof node.className === "string" ? node.className : "";
      if (className.includes("truncate")) continue;
      const maybeClipped =
        style.overflowX === "hidden" &&
        node.scrollWidth > node.clientWidth + 2 &&
        node.clientWidth > 0;
      if (maybeClipped) {
        const inTable = !!node.closest("table");
        if (!inTable) {
          clipped.push({
            tag: node.tagName.toLowerCase(),
            className,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
          });
        }
      }
      if (clipped.length > 10) break;
    }

    return {
      viewportWidth: window.innerWidth,
      scrollWidth: maxWidth,
      hasOverflow,
      clippedCount: clipped.length,
      clippedSamples: clipped,
    };
  });
}

async function run() {
  const outDir = path.resolve("test-results/responsive-stress");
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const scenario of SCENARIOS) {
    for (const pageConfig of PAGES) {
      for (const viewport of scenario.viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
          localStorage.setItem("token", "stress-token");
        });
        await page.route(`${API_BASE}/**`, async (route) =>
          handleApi(route, pageConfig.role, scenario.name),
        );

        const url = `${BASE_URL}${pageConfig.path}`;
        let status = "ok";
        let error = null;
        let warning = null;
        let metrics = null;
        try {
          if (scenario.name === "loading") {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
            await page.waitForTimeout(700);
          } else if (scenario.name === "empty" || scenario.name === "error") {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
            await page.waitForTimeout(1400);
          } else {
            await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
            await page.waitForTimeout(350);
          }

          metrics = await analyzePage(page);
          if (metrics.hasOverflow) {
            status = "overflow";
            error = `scrollWidth=${metrics.scrollWidth}, viewport=${metrics.viewportWidth}`;
          } else if (metrics.clippedCount > 0) {
            warning = `potential-clipping=${metrics.clippedCount}`;
          }
        } catch (e) {
          status = "error";
          error = e instanceof Error ? e.message : String(e);
        }

        const fileSafe = `${scenario.name}_${pageConfig.role}_${pageConfig.path.replaceAll("/", "_")}_${viewport.name}`.replaceAll(
          /[^a-zA-Z0-9_-]/g,
          "",
        );
        const screenshotPath = path.join(outDir, `${fileSafe}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        results.push({
          scenario: scenario.name,
          role: pageConfig.role,
          path: pageConfig.path,
          viewport: viewport.name,
          status,
          error,
          warning,
          metrics,
          screenshot: screenshotPath,
        });

        await context.close();
      }
    }
  }

  await browser.close();
  const resultPath = path.join(outDir, "results.json");
  await fs.writeFile(resultPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Wrote responsive stress results to ${resultPath}`);

  const failures = results.filter((row) => row.status !== "ok");
  if (failures.length > 0) {
    console.log("Stress issues:");
    for (const row of failures) {
      console.log(
        `${row.scenario} ${row.role} ${row.path} @ ${row.viewport}px -> ${row.status}${row.error ? ` (${row.error})` : ""}`,
      );
    }
    process.exitCode = 1;
  }
}

await run();
