import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildEvidenceDetailLines,
  computeGoalProgressSummary,
  computeLoggedResultsSummary,
  formatGoalProgressSummaryLines,
  humanizeSportMetricsEnum,
  resolveEvidenceDisplayTitle,
  resolveGoalDisplayTitle,
  resolveGoalGroupHeading,
  resolveSportMetricsDisplayLabels,
  resolveSportMetricsTopStatus,
  resolveUnlinkedSectionTitle,
  summaryUsesTechnicalResultLabels,
} from "@/components/dashboard/SportMetricsEvidenceCards";
import {
  hasSportMetricsGolfEvidence,
  parseSportMetricsGolfWeeklySummaryPayload,
  type SportMetricEvidenceItem,
} from "@/lib/api/sportMetricsGolf";

const simulatorSmokePayload = {
  sport: "GOLF",
  weekStartDate: "2026-05-21",
  weekEndDate: "2026-05-27",
  status: "NO_DATA_LOGGED",
  goalEvidence: [
    {
      goal: {
        title: "Improving Putting performance",
        successCriteria: "90% success - from different distances in the green",
      },
      evidenceStatus: "NO_DATA_LOGGED",
      evidence: [
        {
          id: "record-1",
          metricType: "DRILL_RESULT",
          environment: "SIMULATOR",
          source: "SIMULATOR_MANUAL",
          occurredAt: "2026-05-24T14:30:00.000Z",
          prescribedContextJson: {
            label: "3-6-9 Circle Pressure Drill",
          },
          valueJson: {
            attempts: 9,
            successes: 7,
            provider: {
              key: "manual-simulator",
            },
          },
        },
      ],
    },
  ],
  unlinkedEvidence: [],
};

const filteredContextPayload = {
  sport: "GOLF",
  weekStartDate: "2026-05-21",
  weekEndDate: "2026-05-27",
  status: "NO_DATA_LOGGED",
  goalEvidence: [
    {
      evidence: [
        {
          id: "ctx-1",
          environment: "PRACTICE_FACILITY",
          source: "ATHLETE_MANUAL",
          occurredAt: "2026-05-24T10:00:00.000Z",
          prescribedContextJson: {
            label: "Wedge Ladder",
            reps: "3x10",
            durationMinutes: 20,
          },
          valueJson: {
            attempts: 12,
          },
        },
      ],
    },
  ],
  unlinkedEvidence: {
    records: [
      {
        id: "ctx-u-1",
        prescribedContextJson: { label: "Mobility Warm-up Drill" },
        valueJson: { attempts: 5 },
        environment: "PRACTICE_FACILITY",
        source: "ATHLETE_MANUAL",
      },
    ],
  },
};

function parseSmokeSummary() {
  return parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data: simulatorSmokePayload,
  });
}

function parseFilteredSummary() {
  return parseSportMetricsGolfWeeklySummaryPayload({
    success: true,
    data: filteredContextPayload,
  });
}

describe("SportMetricsEvidenceCards display helpers", () => {
  it("top badge shows Results Logged when any records exist", () => {
    const summary = parseSmokeSummary();
    const topStatus = resolveSportMetricsTopStatus(summary);

    expect(topStatus.label).toBe("Results Logged");
    expect(topStatus.status).toBe("EVIDENCE_LOGGED");
  });

  it("detects technical labels when successes or provider are present", () => {
    const summary = parseSmokeSummary();
    expect(summaryUsesTechnicalResultLabels(summary)).toBe(true);
    expect(resolveSportMetricsDisplayLabels(summary).goalSectionFallback).toBe(
      "Goal Progress",
    );
    expect(resolveUnlinkedSectionTitle(summary)).toBe("Additional Skill Results");
  });

  it("detects context labels when only workload/context fields are present", () => {
    const summary = parseFilteredSummary();
    expect(summaryUsesTechnicalResultLabels(summary)).toBe(false);
    const labels = resolveSportMetricsDisplayLabels(summary);
    expect(labels.goalSectionFallback).toBe("Training Context");
    expect(labels.unlinkedSectionTitle).toBe("Additional Skill Work");
    expect(labels.includeTechnicalDetailFields).toBe(false);
  });

  it("goal title renders actual goal name from nested goal payload", () => {
    const summary = parseSmokeSummary();
    const labels = resolveSportMetricsDisplayLabels(summary);
    const group = summary.goalEvidence[0];

    expect(resolveGoalDisplayTitle(group!, labels)).toBe("Improving Putting performance");
  });

  it("evidence title uses prescribedContextJson.label", () => {
    const summary = parseSmokeSummary();
    const item = summary.goalEvidence[0]?.evidence[0] as SportMetricEvidenceItem;

    expect(resolveEvidenceDisplayTitle(item)).toBe("3-6-9 Circle Pressure Drill");
  });

  it("humanizes environment and source enums", () => {
    const summary = parseSmokeSummary();
    const item = summary.goalEvidence[0]?.evidence[0] as SportMetricEvidenceItem;
    const raw = item.raw as Record<string, unknown>;

    expect(humanizeSportMetricsEnum(readString(raw.environment))).toBe("Simulator");
    expect(humanizeSportMetricsEnum(readString(raw.source))).toBe("Manual Simulator Entry");
  });

  it("renders attempts, successes, and computed success rate for technical payloads", () => {
    const summary = parseSmokeSummary();
    const item = summary.goalEvidence[0]?.evidence[0] as SportMetricEvidenceItem;
    const lines = buildEvidenceDetailLines(item);

    expect(lines.join(" · ")).toContain("Attempts: 9");
    expect(lines.join(" · ")).toContain("Successes: 7");
    expect(lines.join(" · ")).toContain("Success Rate: 77.8%");
    expect(lines.join(" · ")).toContain("Provider: manual-simulator");
  });

  it("top badge shows Results Logged when only unlinked records exist", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-21",
        weekEndDate: "2026-05-27",
        status: "NO_DATA_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: {
          records: [
            {
              id: "unlinked-only",
              environment: "SIMULATOR",
              source: "SIMULATOR_MANUAL",
              prescribedContextJson: { label: "Simulator Ladder Drill" },
              valueJson: { attempts: 10, successes: 8 },
            },
          ],
        },
      },
    });

    const topStatus = resolveSportMetricsTopStatus(summary);
    expect(topStatus.label).toBe("Results Logged");
    expect(summary.unlinkedEvidence).toHaveLength(1);
  });

  it("unlinked evidence title uses prescribedContextJson.label", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-21",
        weekEndDate: "2026-05-27",
        status: "NO_DATA_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: {
          records: [
            {
              prescribedContextJson: { label: "Chip Ladder Drill" },
              valueJson: { attempts: 6, successes: 5 },
            },
          ],
        },
      },
    });

    const item = summary.unlinkedEvidence[0] as SportMetricEvidenceItem;
    expect(resolveEvidenceDisplayTitle(item)).toBe("Chip Ladder Drill");
  });

  it("omits successes, success rate, and provider for filtered context payloads", () => {
    const summary = parseFilteredSummary();
    const item = summary.goalEvidence[0]?.evidence[0] as SportMetricEvidenceItem;
    const lines = buildEvidenceDetailLines(item, {
      includeTechnicalDetailFields: false,
    }).join(" · ");

    expect(lines).toContain("Attempts: 12");
    expect(lines).toContain("Reps: 3x10");
    expect(lines).toContain("Duration (min): 20");
    expect(lines).not.toContain("Successes");
    expect(lines).not.toContain("Success Rate");
    expect(lines).not.toContain("Provider");
  });

  it("uses Training Context and Additional Skill Work for filtered payloads", () => {
    const summary = parseFilteredSummary();
    const labels = resolveSportMetricsDisplayLabels(summary);
    const fallbackGroup = summary.goalEvidence[0]!;

    expect(resolveGoalGroupHeading(fallbackGroup, labels)).toBe("Training Context");
    expect(resolveGoalGroupHeading(fallbackGroup, labels)).not.toBe("Goal Progress");
    expect(resolveGoalGroupHeading(fallbackGroup, labels)).not.toBe("Goal: Linked Goal");
    expect(labels.unlinkedSectionTitle).toBe("Additional Skill Work");
  });

  it("uses Goal Progress and Additional Skill Results for technical payloads", () => {
    const summary = parseSmokeSummary();
    const labels = resolveSportMetricsDisplayLabels(summary);
    const fallbackGroup = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-21",
        weekEndDate: "2026-05-27",
        status: "NO_DATA_LOGGED",
        goalEvidence: [{ evidence: [{ id: "e-1", label: "Drill" }] }],
        unlinkedEvidence: { records: [{ id: "u-1", label: "Unlinked drill" }] },
      },
    }).goalEvidence[0]!;

    expect(resolveGoalGroupHeading(fallbackGroup, labels)).toBe("Goal Progress");
    expect(labels.unlinkedSectionTitle).toBe("Additional Skill Results");
  });

  it("does not include raw JSON field names in display output", () => {
    const summary = parseSmokeSummary();
    const item = summary.goalEvidence[0]?.evidence[0] as SportMetricEvidenceItem;
    const title = resolveEvidenceDisplayTitle(item);
    const details = buildEvidenceDetailLines(item).join(" ");

    expect(title).not.toContain("prescribedContextJson");
    expect(title).not.toContain("valueJson");
    expect(details).not.toContain("prescribedContextJson");
    expect(details).not.toContain("valueJson");
    expect(details).not.toContain("{");
    expect(details).not.toContain("}");
  });
});

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

describe("v2 evidence card renders skillLink + result + successRate", () => {
  it("parses skillLink from backend response", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        status: "EVIDENCE_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: [
          {
            id: "v2-record-1",
            label: "3-6-9 Pressure Drill",
            environment: "PRACTICE_FACILITY",
            source: "ATHLETE_MANUAL",
            occurredAt: "2026-06-03T10:00:00.000Z",
            skillLink: {
              skillCode: "PUTTING_DRILL",
              skillArea: "Short Game",
              sportCapability: "Putting",
              skillCategory: "Putting",
              drillName: "3-6-9 Pressure Drill",
            },
            result: {
              attempts: 9,
              successes: 7,
              successRate: 77.8,
              qualityRating: 4,
              context: "Practice green",
              distanceBand: "3-9ft",
              missesLeft: 1,
              missesRight: 1,
              missesShort: 0,
              missesLong: 0,
              notes: "Good session",
            },
          },
        ],
      },
    });

    const item = summary.unlinkedEvidence[0]!;
    expect(item.skillLink).not.toBeNull();
    expect(item.skillLink!.skillCode).toBe("PUTTING_DRILL");
    expect(item.skillLink!.skillArea).toBe("Short Game");
    expect(item.skillLink!.sportCapability).toBe("Putting");
    expect(item.skillLink!.skillCategory).toBe("Putting");
    expect(item.skillLink!.drillName).toBe("3-6-9 Pressure Drill");
  });

  it("parses result data with successRate from backend response", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        status: "EVIDENCE_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: [
          {
            id: "v2-record-2",
            label: "Chip Ladder",
            result: {
              attempts: 20,
              successes: 15,
              successRate: 75,
              qualityRating: 3,
              distanceBand: "10-20yd",
              targetRadius: "6ft",
              missesLeft: 2,
              missesRight: 1,
              missesShort: 1,
              missesLong: 1,
            },
          },
        ],
      },
    });

    const item = summary.unlinkedEvidence[0]!;
    expect(item.result).not.toBeNull();
    expect(item.result!.attempts).toBe(20);
    expect(item.result!.successes).toBe(15);
    expect(item.result!.successRate).toBe(75);
    expect(item.result!.qualityRating).toBe(3);
    expect(item.result!.distanceBand).toBe("10-20yd");
    expect(item.result!.targetRadius).toBe("6ft");
    expect(item.result!.missesLeft).toBe(2);
    expect(item.result!.missesRight).toBe(1);
    expect(item.result!.missesShort).toBe(1);
    expect(item.result!.missesLong).toBe(1);
  });

  it("computes logged results summary from v2 result data", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        status: "EVIDENCE_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-1",
            goalTitle: "Putting",
            evidence: [
              {
                id: "r1",
                result: { attempts: 10, successes: 8, successRate: 80 },
              },
            ],
          },
        ],
        unlinkedEvidence: [
          {
            id: "r2",
            result: { attempts: 20, successes: 14, successRate: 70 },
          },
        ],
      },
    });

    const stats = computeLoggedResultsSummary(summary);
    expect(stats).not.toBeNull();
    expect(stats!.totalAttempts).toBe(30);
    expect(stats!.totalSuccesses).toBe(22);
    expect(stats!.count).toBe(2);
    expect(stats!.successRate).toBeCloseTo(73.3, 0);
  });

  it("returns null for logged results summary when no evidence", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        status: "NO_DATA_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: [],
      },
    });

    const stats = computeLoggedResultsSummary(summary);
    expect(stats).toBeNull();
  });
});

describe("Goal Progress MVP summary", () => {
  function buildAthlete801Summary() {
    return parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        status: "NO_DATA_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-801",
            goal: {
              title: "Improving Putting performance",
              successCriteria: "90% success - from different distances in the green",
            },
            evidenceStatus: "NO_DATA_LOGGED",
            status: "NO_DATA_LOGGED",
            evidence: [],
          },
        ],
        unlinkedEvidence: [
          {
            id: "r1",
            label: "3-6-9 Circle Pressure Drill",
            valueJson: { attempts: 10, successes: 7 },
            result: { attempts: 10, successes: 7, successRate: 70 },
          },
          {
            id: "r2",
            label: "Lag Putting Ladder",
            valueJson: { attempts: 10, successes: 7 },
            result: { attempts: 10, successes: 7, successRate: 70 },
          },
          {
            id: "r3",
            label: "Gate Drill",
            valueJson: { attempts: 10, successes: 8 },
            result: { attempts: 10, successes: 8, successRate: 80 },
          },
          {
            id: "r4",
            label: "Speed Control Drill",
            valueJson: { attempts: 10, successes: 7 },
            result: { attempts: 10, successes: 7, successRate: 70 },
          },
        ],
      },
    });
  }

  it("shows Athlete 801 progress stats from logged records", () => {
    const summary = buildAthlete801Summary();
    const progress = computeGoalProgressSummary(summary);

    expect(progress).toMatchObject({
      resultsLogged: 4,
      totalAttempts: 40,
      totalSuccesses: 29,
      usesPrescribedCount: false,
    });
    expect(progress!.successRate).toBeCloseTo(72.5, 1);

    const lines = formatGoalProgressSummaryLines(progress!);
    expect(lines).toEqual([
      "Results logged: 4",
      "Attempts: 40",
      "Successes: 29",
      "Success Rate: 72.5%",
    ]);
  });

  it("does not show No Results Logged or unlinked messaging when records exist", () => {
    const summary = buildAthlete801Summary();
    const progress = computeGoalProgressSummary(summary);
    const lines = formatGoalProgressSummaryLines(progress!);

    expect(lines.join(" ")).not.toContain("No Results Logged");
    expect(lines.join(" ")).not.toContain("none are linked");
    expect(resolveSportMetricsTopStatus(summary).label).toBe("Results Logged");
  });

  it("shows prescribed skills and completion when summary includes prescribedSkillsCount", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        prescribedSkillsCount: 6,
        goalEvidence: [{ goalId: "goal-1", goalTitle: "Putting", evidence: [] }],
        unlinkedEvidence: [
          { id: "r1", valueJson: { attempts: 10, successes: 8 } },
          { id: "r2", valueJson: { attempts: 10, successes: 7 } },
          { id: "r3", valueJson: { attempts: 10, successes: 6 } },
          { id: "r4", valueJson: { attempts: 10, successes: 7 } },
        ],
      },
    });

    const progress = computeGoalProgressSummary(summary);
    expect(progress).toMatchObject({
      resultsLogged: 4,
      prescribedSkills: 6,
      usesPrescribedCount: true,
    });
    expect(progress!.completionPercent).toBeCloseTo(66.7, 0);

    const lines = formatGoalProgressSummaryLines(progress!);
    expect(lines[0]).toBe("Skills prescribed: 6");
    expect(lines[1]).toBe("Results logged: 4");
    expect(lines[2]).toBe("Completion: 66.7%");
  });

  it("shows empty state only when no records exist at all", () => {
    const summary = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        goalEvidence: [{ goalId: "goal-1", goalTitle: "Putting", evidence: [] }],
        unlinkedEvidence: [],
      },
    });

    expect(computeGoalProgressSummary(summary)).toBeNull();
    expect(computeLoggedResultsSummary(summary)).toBeNull();
    expect(hasSportMetricsGolfEvidence(summary)).toBe(false);
  });
});

describe("coach role sport metrics visibility", () => {
  it("CoachWeeklyAdherenceOverview source hides SportMetricsSection for NUTRITION coach", () => {
    const source = readFileSync(
      new URL("./coach/CoachWeeklyAdherenceOverview.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('wearableViewerContext !== "NUTRITION"');
    expect(source).toContain('wearableViewerContext !== "S_AND_C"');
    expect(source).toContain("SportMetricsSection");
  });

  it("resolveCoachWearableViewerContext is used to gate sport metrics visibility", () => {
    const source = readFileSync(
      new URL("./coach/CoachWeeklyAdherenceOverview.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("resolveCoachWearableViewerContext");
    expect(source).toContain("HEAD_COACH");
    expect(source).toContain("SKILLS");
  });
});

describe("resolveCoachWearableViewerContext", () => {
  let resolveCoachWearableViewerContext: (input: {
    academyCoachRole: string | null | undefined;
    functions: string[] | null | undefined;
  }) => "HEAD_COACH" | "SKILLS" | "NUTRITION" | "S_AND_C" | "DEFAULT";

  beforeAll(async () => {
    const mod = await import("@/components/dashboard/coach/CoachWeeklyAdherenceOverview");
    resolveCoachWearableViewerContext = mod.resolveCoachWearableViewerContext;
  });

  it("returns HEAD_COACH for head coach role", () => {
    expect(
      resolveCoachWearableViewerContext({ academyCoachRole: "HEAD_COACH", functions: [] }),
    ).toBe("HEAD_COACH");
  });

  it("returns SKILLS for Skills Coach function", () => {
    expect(
      resolveCoachWearableViewerContext({ academyCoachRole: null, functions: ["SKILLS_COACH"] }),
    ).toBe("SKILLS");
  });

  it("returns NUTRITION for Nutrition Coach function", () => {
    expect(
      resolveCoachWearableViewerContext({ academyCoachRole: null, functions: ["NUTRITION_COACH"] }),
    ).toBe("NUTRITION");
  });

  it("returns S_AND_C for S&C coach function", () => {
    expect(
      resolveCoachWearableViewerContext({
        academyCoachRole: null,
        functions: ["STRENGTH_AND_CONDITIONING_COACH"],
      }),
    ).toBe("S_AND_C");
  });

  it("returns S_AND_C for S_AND_C function value", () => {
    expect(
      resolveCoachWearableViewerContext({ academyCoachRole: null, functions: ["S_AND_C"] }),
    ).toBe("S_AND_C");
  });

  it("returns DEFAULT when no matching role or function", () => {
    expect(
      resolveCoachWearableViewerContext({ academyCoachRole: null, functions: [] }),
    ).toBe("DEFAULT");
    expect(
      resolveCoachWearableViewerContext({ academyCoachRole: null, functions: null }),
    ).toBe("DEFAULT");
  });

  it("HEAD_COACH role takes priority over functions", () => {
    expect(
      resolveCoachWearableViewerContext({
        academyCoachRole: "HEAD_COACH",
        functions: ["NUTRITION_COACH"],
      }),
    ).toBe("HEAD_COACH");
  });
});
