import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  buildGolfSportMetricRecordRequestBody,
  fetchSportMetricsGolfComparison,
  fetchSportMetricsGolfWeeklySummary,
  formatSportMetricsStatusLabel,
  hasSportMetricsGolfEvidence,
  parseSportMetricsGolfComparisonPayload,
  parseSportMetricsGolfWeeklySummaryPayload,
  postGolfSportMetricRecord,
} from "@/lib/api/sportMetricsGolf";

function parsePostJsonBody(options: Record<string, unknown>): Record<string, unknown> {
  const rawBody = options.body;
  expect(typeof rawBody).toBe("string");
  expect(rawBody).not.toBe("[object Object]");
  return JSON.parse(rawBody as string) as Record<string, unknown>;
}

describe("sport metrics golf weekly summary", () => {
  it("unwraps backend payload and preserves key weekly summary fields", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "EVIDENCE_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-1",
            goalTitle: "Improve wedge proximity",
            successCriteria: "Average proximity under 15 ft",
            evidenceStatus: "EVIDENCE_LOGGED",
            evidence: [
              {
                id: "record-1",
                label: "Wedge proximity",
                value: "14.2",
                unit: "ft",
                environment: "PRACTICE_FACILITY",
                source: "COACH_MANUAL",
              },
            ],
          },
        ],
        unlinkedEvidence: [
          {
            id: "record-2",
            label: "Round notes",
            notes: "Windy practice round",
            environment: "ON_COURSE",
            source: "ATHLETE_MANUAL",
          },
        ],
      },
    });

    expect(parsed.sport).toBe("GOLF");
    expect(parsed.weekStartDate).toBe("2026-05-04");
    expect(parsed.weekEndDate).toBe("2026-05-10");
    expect(parsed.goalEvidence[0]?.goalTitle).toBe("Improve wedge proximity");
    expect(parsed.unlinkedEvidence[0]?.label).toBe("Round notes");
  });

  it("fetches with trainingPlanVersionId query param only", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "NO_DATA_LOGGED",
        goalEvidence: [],
        unlinkedEvidence: [],
      },
    });

    await fetchSportMetricsGolfWeeklySummary({
      entityId: "entity-1",
      athleteId: "athlete-1",
      trainingPlanVersionId: "version-1",
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(path).toContain(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/weekly-summary?",
    );
    expect(path).toContain("trainingPlanVersionId=version-1");
    expect(path).not.toContain("weekStart=");
    expect(path).not.toContain("weekEnd=");
    expect(path).not.toContain("startDate=");
    expect(path).not.toContain("endDate=");
    expect(path).not.toContain("period=");
    expect(options).toMatchObject({
      method: "GET",
      cache: "no-store",
    });
  });

  it("maps supported backend status values to labels", () => {
    expect(formatSportMetricsStatusLabel("NO_DATA_LOGGED")).toBe("No Results Logged");
    expect(formatSportMetricsStatusLabel("EVIDENCE_LOGGED")).toBe("Results Logged");
    expect(formatSportMetricsStatusLabel("NEEDS_COACH_REVIEW")).toBe(
      "Needs Coach Review",
    );
  });

  it("does not import wearable period helpers", () => {
    const source = readFileSync(
      new URL("./sportMetricsGolf.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("wearablePeriod");
    expect(source).not.toContain("resolveWearable");
  });
});

describe("parseSportMetricsGolfWeeklySummaryPayload unlinkedEvidence", () => {
  it("preserves unlinkedEvidence.records from nested container", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
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
              id: "unlinked-1",
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
                provider: { key: "trackman" },
              },
            },
          ],
        },
      },
    });

    expect(parsed.goalEvidence).toEqual([]);
    expect(parsed.unlinkedEvidence).toHaveLength(1);
    expect(parsed.unlinkedEvidence[0]?.id).toBe("unlinked-1");
    const raw = parsed.unlinkedEvidence[0]?.raw as Record<string, unknown>;
    expect(raw.prescribedContextJson).toEqual(
      expect.objectContaining({ label: "3-6-9 Circle Pressure Drill" }),
    );
    expect(hasSportMetricsGolfEvidence(parsed)).toBe(true);
  });

  it("preserves goalEvidence and flat unlinkedEvidence arrays", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-05-04",
        weekEndDate: "2026-05-10",
        status: "EVIDENCE_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-1",
            goalTitle: "Putting",
            evidence: [{ id: "g-1", label: "Goal drill" }],
          },
        ],
        unlinkedEvidence: [{ id: "u-1", label: "Flat unlinked" }],
      },
    });

    expect(parsed.goalEvidence).toHaveLength(1);
    expect(parsed.goalEvidence[0]?.evidence).toHaveLength(1);
    expect(parsed.unlinkedEvidence).toHaveLength(1);
    expect(parsed.unlinkedEvidence[0]?.label).toBe("Flat unlinked");
  });

  it("does not treat an empty goal evidence shell as a linked evidence record", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-06-01",
        weekEndDate: "2026-06-07",
        status: "NO_DATA_LOGGED",
        goalEvidence: [
          {
            goalId: "goal-801",
            goalTitle: "Improving Putting performance",
            evidenceStatus: "NO_DATA_LOGGED",
            status: "NO_DATA_LOGGED",
            evidence: [],
          },
        ],
        unlinkedEvidence: [
          {
            id: "r1",
            label: "Drill 1",
            result: { attempts: 8, successes: 6, successRate: 75 },
          },
        ],
      },
    });

    expect(parsed.goalEvidence[0]?.evidence).toEqual([]);
    expect(parsed.goalEvidence[0]?.evidenceStatus).toBe("NO_DATA_LOGGED");
    expect(parsed.unlinkedEvidence).toHaveLength(1);
    expect(hasSportMetricsGolfEvidence(parsed)).toBe(true);
  });

  it("parses optional prescribedSkillsCount from summary payload", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        prescribedSkillsCount: 6,
        goalEvidence: [],
        unlinkedEvidence: [],
      },
    });

    expect(parsed.prescribedSkillsCount).toBe(6);
  });
});

describe("sport metrics golf weekly summary Step 3 goal performance", () => {
  it("parses nested goal, weeklyActual, and targetComparison without filling missing actual as 0", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        sport: "GOLF",
        weekStartDate: "2026-09-01",
        weekEndDate: "2026-09-07",
        goalEvidence: [
          {
            goalId: "goal-1",
            goal: {
              goalName: "Improve putting",
              successCriteria: "Make 8 of 10 from 6 feet",
              targetValue: 80,
              primaryMetric: {
                key: "PUTT_MAKE_PCT",
                unit: "%",
                direction: "HIGHER_IS_BETTER",
              },
            },
            weeklyActual: {
              metricKey: "PUTT_MAKE_PCT",
              unit: "%",
              direction: "HIGHER_IS_BETTER",
              value: 75,
              attempts: 20,
              successes: 15,
              recordCount: 2,
            },
            targetComparison: {
              targetValue: 80,
              actualValue: 75,
              direction: "HIGHER_IS_BETTER",
              targetMet: false,
            },
          },
          {
            goalId: "goal-2",
            goal: {
              goalName: "Proximity to hole",
              successCriteria: "Average under 15 ft",
              targetValue: null,
              primaryMetric: {
                key: "WEDGE_PROXIMITY",
                unit: "ft",
                direction: "LOWER_IS_BETTER",
              },
            },
          },
        ],
      },
    });

    expect(parsed.weekStartDate).toBe("2026-09-01");
    expect(parsed.weekEndDate).toBe("2026-09-07");
    expect(parsed.goalEvidence).toHaveLength(2);
    expect(parsed.goalEvidence[0]?.goalId).toBe("goal-1");
    expect(parsed.goalEvidence[0]?.goal.goalName).toBe("Improve putting");
    expect(parsed.goalEvidence[0]?.goal.successCriteria).toBe(
      "Make 8 of 10 from 6 feet",
    );
    expect(parsed.goalEvidence[0]?.goal.targetValue).toBe(80);
    expect(parsed.goalEvidence[0]?.goal.primaryMetric).toEqual({
      key: "PUTT_MAKE_PCT",
      unit: "%",
      direction: "HIGHER_IS_BETTER",
    });
    expect(parsed.goalEvidence[0]?.weeklyActual).toEqual({
      metricKey: "PUTT_MAKE_PCT",
      unit: "%",
      direction: "HIGHER_IS_BETTER",
      value: 75,
      attempts: 20,
      successes: 15,
      total: null,
      recordCount: 2,
    });
    expect(parsed.goalEvidence[0]?.targetComparison).toEqual({
      targetValue: 80,
      actualValue: 75,
      direction: "HIGHER_IS_BETTER",
      targetMet: false,
    });
    expect(parsed.goalEvidence[1]?.goal.goalName).toBe("Proximity to hole");
    expect(parsed.goalEvidence[1]?.goal.targetValue).toBeNull();
    expect(parsed.goalEvidence[1]?.weeklyActual).toBeNull();
    expect(parsed.goalEvidence[1]?.targetComparison).toBeNull();
    expect(parsed.goalEvidence[0]?.history).toEqual([]);
    expect(parsed.goalEvidence[1]?.history).toEqual([]);
    expect(parsed.exerciseTrends).toEqual([]);
    expect(parsed.taxonomyScores).toEqual([]);
    expect(parsed.strongestTaxonomy).toBeNull();
    expect(parsed.weakestTaxonomy).toBeNull();
  });

  it("preserves received goalEvidence order and keeps same-metric goals independent", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        goalEvidence: [
          {
            goalId: "later-listed",
            goal: {
              goalName: "Second listed",
              successCriteria: "B",
              targetValue: null,
              primaryMetric: {
                key: "PUTT_MAKE_PCT",
                unit: "%",
                direction: "HIGHER_IS_BETTER",
              },
            },
          },
          {
            goalId: "first-listed",
            goal: {
              goalName: "First listed",
              successCriteria: "A",
              targetValue: null,
              primaryMetric: {
                key: "PUTT_MAKE_PCT",
                unit: "%",
                direction: "HIGHER_IS_BETTER",
              },
            },
          },
        ],
      },
    });

    expect(parsed.goalEvidence.map((group) => group.goalId)).toEqual([
      "later-listed",
      "first-listed",
    ]);
    expect(parsed.goalEvidence[0]?.goal.goalName).toBe("Second listed");
    expect(parsed.goalEvidence[1]?.goal.goalName).toBe("First listed");
  });

  it("omits weeklyActual when value is missing so missing evidence is not 0", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        goalEvidence: [
          {
            goalId: "goal-empty",
            goal: {
              goalName: "No evidence",
              successCriteria: "Log results",
              targetValue: 10,
              primaryMetric: {
                key: "PUTT_MAKE_PCT",
                unit: "%",
                direction: "HIGHER_IS_BETTER",
              },
            },
            weeklyActual: { unit: "%", recordCount: 0 },
          },
        ],
      },
    });

    expect(parsed.goalEvidence[0]?.weeklyActual).toBeNull();
  });

  it("does not compute weeklyActual or targetMet in the weekly-summary parser", () => {
    const source = readFileSync(
      new URL("./sportMetricsGolf.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("successes / attempts");
    expect(source).not.toContain("record.successes /");
    expect(source).not.toContain("actualValue >= targetValue");
    expect(source).toContain("targetMet: record.targetMet");
  });
});

describe("sport metrics golf weekly summary Step 4A", () => {
  it("copies exerciseTrends, goal history, taxonomyScores, and strongest/weakest without scoring math", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        weekStartDate: "2026-09-01",
        weekEndDate: "2026-09-07",
        goalEvidence: [
          {
            goalId: "goal-1",
            goal: {
              goalName: "Improve putting",
              successCriteria: "Make 8 of 10",
              targetValue: 80,
              primaryMetric: {
                key: "PUTT_MAKE_PCT",
                unit: "%",
                direction: "HIGHER_IS_BETTER",
              },
            },
            history: [
              {
                planStartDate: "2026-08-18",
                planEndDate: "2026-08-24",
                actual: 70,
                targetValue: 80,
                targetComparison: {
                  targetValue: 80,
                  actualValue: 70,
                  direction: "HIGHER_IS_BETTER",
                  targetMet: false,
                },
              },
              {
                planStartDate: "2026-08-25",
                planEndDate: "2026-08-31",
                actual: 72,
              },
            ],
          },
        ],
        exerciseTrends: [
          {
            exerciseId: "ex-y",
            skillCode: "PUTT_6FT",
            exerciseName: "6ft putts",
            taxonomyAreaKey: "putting",
            goalId: "goal-1",
            linkedGoal: { id: "goal-1", goalName: "Improve putting" },
            metricKey: "PUTT_MAKE_PCT",
            metricName: "Make percentage",
            unit: "%",
            direction: "HIGHER_IS_BETTER",
            exerciseType: "Y",
            currentActual: 75,
            previousActual: 70,
            trendScore: 1,
            trendDirection: "UP",
            history: [
              {
                planStartDate: "2026-08-18",
                planEndDate: "2026-08-24",
                actual: 70,
              },
              {
                planStartDate: "2026-08-25",
                planEndDate: "2026-08-31",
                actual: 75,
              },
            ],
          },
          {
            exerciseId: "ex-z",
            skillCode: "PUTT_LAG",
            exerciseName: "Lag putting",
            taxonomyAreaKey: "putting",
            goalId: "goal-1",
            linkedGoal: { id: "goal-1", goalName: "Improve putting" },
            metricKey: "PROXIMITY",
            metricName: "Proximity",
            unit: "ft",
            direction: "LOWER_IS_BETTER",
            exerciseType: "Z",
            currentActual: 8,
            previousActual: null,
            trendScore: null,
            trendDirection: null,
            history: [],
          },
        ],
        taxonomyScores: [
          {
            taxonomyAreaKey: "wedge_play",
            YTrend: 0.2,
            ZTrend: -0.1,
            normalizedScore: 0.08,
            scoreOutOf100: 54,
            direction: "HIGHER_IS_BETTER",
            history: [
              {
                planStartDate: "2026-08-25",
                planEndDate: "2026-08-31",
                YTrend: 0.1,
                ZTrend: 0,
                normalizedScore: 0.06,
                scoreOutOf100: 53,
                direction: "HIGHER_IS_BETTER",
              },
            ],
            multiWeekNormalizedScore: 0.07,
            multiWeekScoreOutOf100: 53.5,
            multiWeekDirection: "HIGHER_IS_BETTER",
            rank: 2,
          },
          {
            taxonomyAreaKey: "putting",
            YTrend: null,
            ZTrend: null,
            normalizedScore: null,
            scoreOutOf100: null,
            direction: null,
            history: [],
            multiWeekNormalizedScore: null,
            multiWeekScoreOutOf100: null,
            multiWeekDirection: null,
          },
        ],
        strongestTaxonomy: {
          taxonomyAreaKey: "wedge_play",
          YTrend: 0.2,
          ZTrend: -0.1,
          normalizedScore: 0.08,
          scoreOutOf100: 54,
          direction: "HIGHER_IS_BETTER",
          history: [],
          multiWeekNormalizedScore: 0.07,
          multiWeekScoreOutOf100: 53.5,
          multiWeekDirection: "HIGHER_IS_BETTER",
          rank: 1,
        },
        weakestTaxonomy: {
          taxonomyAreaKey: "putting",
          YTrend: null,
          ZTrend: null,
          normalizedScore: null,
          scoreOutOf100: 40,
          direction: "HIGHER_IS_BETTER",
          history: [],
          multiWeekNormalizedScore: 0.01,
          multiWeekScoreOutOf100: 40,
          multiWeekDirection: "HIGHER_IS_BETTER",
          rank: 2,
        },
      },
    });

    expect(parsed.exerciseTrends).toHaveLength(2);
    expect(parsed.exerciseTrends[0]?.exerciseType).toBe("Y");
    expect(parsed.exerciseTrends[0]?.currentActual).toBe(75);
    expect(parsed.exerciseTrends[0]?.previousActual).toBe(70);
    expect(parsed.exerciseTrends[0]?.trendDirection).toBe("UP");
    expect(parsed.exerciseTrends[0]?.history.map((row) => row.planStartDate)).toEqual([
      "2026-08-18",
      "2026-08-25",
    ]);
    expect(parsed.exerciseTrends[1]?.exerciseType).toBe("Z");
    expect(parsed.exerciseTrends[1]?.previousActual).toBeNull();
    expect(parsed.exerciseTrends[1]?.trendScore).toBeNull();
    expect(parsed.exerciseTrends[1]?.trendDirection).toBeNull();
    expect(parsed.goalEvidence[0]?.history).toHaveLength(2);
    expect(parsed.goalEvidence[0]?.history[1]?.targetComparison).toBeNull();
    expect(parsed.taxonomyScores.map((row) => row.taxonomyAreaKey)).toEqual([
      "wedge_play",
      "putting",
    ]);
    expect(parsed.taxonomyScores[1]?.scoreOutOf100).toBeNull();
    expect(parsed.taxonomyScores[1]?.rank).toBeNull();
    expect(parsed.taxonomyScores[0]?.rank).toBe(2);
    expect(parsed.strongestTaxonomy?.taxonomyAreaKey).toBe("wedge_play");
    expect(parsed.weakestTaxonomy?.taxonomyAreaKey).toBe("putting");
  });

  it("keeps received exercise and taxonomy array order and does not turn null scores into 0", () => {
    const parsed = parseSportMetricsGolfWeeklySummaryPayload({
      success: true,
      data: {
        exerciseTrends: [
          { exerciseId: "second-listed", exerciseName: "B", exerciseType: "Z", currentActual: 1 },
          { exerciseId: "first-listed", exerciseName: "A", exerciseType: "Y", currentActual: 2 },
        ],
        taxonomyScores: [
          { taxonomyAreaKey: "short_game", scoreOutOf100: null, YTrend: null, ZTrend: null },
          { taxonomyAreaKey: "driving", scoreOutOf100: 0, YTrend: 0, ZTrend: 0 },
        ],
        strongestTaxonomy: null,
        weakestTaxonomy: null,
      },
    });

    expect(parsed.exerciseTrends.map((row) => row.exerciseId)).toEqual([
      "second-listed",
      "first-listed",
    ]);
    expect(parsed.taxonomyScores.map((row) => row.taxonomyAreaKey)).toEqual([
      "short_game",
      "driving",
    ]);
    expect(parsed.taxonomyScores[0]?.scoreOutOf100).toBeNull();
    expect(parsed.taxonomyScores[0]?.YTrend).toBeNull();
    expect(parsed.taxonomyScores[1]?.scoreOutOf100).toBe(0);
    expect(parsed.strongestTaxonomy).toBeNull();
    expect(parsed.weakestTaxonomy).toBeNull();
  });

  it("does not introduce Step 4A scoring or ranking calculations", () => {
    const source = readFileSync(
      new URL("./sportMetricsGolf.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("0.60");
    expect(source).not.toContain("0.40");
    expect(source).not.toContain("YTrend +");
    expect(source).not.toContain("strongestTaxonomy =");
    expect(source).toContain("strongestTaxonomy: parseTaxonomyScore(record.strongestTaxonomy)");
    expect(source).not.toContain("practicePerformance");
    expect(source).not.toContain("overallScore");
    expect(source).not.toContain("coachPracticeRating");
  });
});

const comparisonPayload = {
  success: true,
  message: "Sport metric comparison fetched successfully",
  data: {
    sport: "GOLF",
    earlier: {
      trainingPlanId: "plan-earlier",
      trainingPlanVersionId: "version-earlier",
      weekStartDate: "2026-05-25",
      weekEndDate: "2026-05-31",
    },
    later: {
      trainingPlanId: "plan-later",
      trainingPlanVersionId: "version-later",
      weekStartDate: "2026-06-01",
      weekEndDate: "2026-06-07",
    },
    categories: [
      {
        sport: "GOLF",
        taxonomyAreaKey: "distance_control",
        status: "COMPARABLE",
        drillMixChanged: false,
        earlier: {
          attempts: 0,
          successes: 0,
          targetHits: null,
          successRate: null,
        },
        later: {
          attempts: 15,
          successes: 10,
          targetHits: 5,
          successRate: 66.67,
        },
        delta: {
          attempts: 15,
          successes: 10,
          targetHits: null,
          successRate: null,
        },
        drills: [
          {
            sport: "GOLF",
            taxonomyAreaKey: "distance_control",
            skillCode: "GOLF_WEDGE_001",
            earlierSkillName: "Earlier Wedge",
            laterSkillName: "Later Wedge",
            taxonomyMismatch: false,
            status: "NOT_COMPARABLE",
            earlier: {
              attempts: 0,
              successes: null,
              targetHits: 0,
              successRate: null,
            },
            later: {
              attempts: 0,
              successes: null,
              targetHits: 0,
              successRate: null,
            },
            delta: {
              attempts: 0,
              successes: null,
              targetHits: 0,
              successRate: null,
            },
          },
        ],
      },
      {
        sport: "GOLF",
        taxonomyAreaKey: "short_game",
        status: "ONLY_IN_EARLIER",
        drillMixChanged: true,
        earlier: {
          attempts: 8,
          successes: 5,
          targetHits: 4,
          successRate: 62.5,
        },
        later: null,
        delta: {
          attempts: null,
          successes: null,
          targetHits: null,
          successRate: null,
        },
        drills: [
          {
            sport: "GOLF",
            taxonomyAreaKey: "short_game",
            skillCode: "GOLF_CHIP_001",
            earlierSkillName: "Landing Zone Chipping",
            laterSkillName: null,
            taxonomyMismatch: true,
            status: "ONLY_IN_EARLIER",
            earlier: {
              attempts: 8,
              successes: 5,
              targetHits: 4,
              successRate: 62.5,
            },
            later: null,
            delta: {
              attempts: null,
              successes: null,
              targetHits: null,
              successRate: null,
            },
          },
          {
            sport: "GOLF",
            taxonomyAreaKey: "short_game",
            skillCode: "GOLF_CHIP_002",
            earlierSkillName: null,
            laterSkillName: "Later-only Chipping",
            taxonomyMismatch: false,
            status: "ONLY_IN_LATER",
            earlier: null,
            later: {
              attempts: 4,
              successes: 2,
              targetHits: null,
              successRate: 50,
            },
            delta: {
              attempts: null,
              successes: null,
              targetHits: null,
              successRate: null,
            },
          },
        ],
      },
    ],
    taxonomyMismatches: [
      {
        skillCode: "GOLF_CHIP_001",
        earlierTaxonomyAreaKeys: ["short_game"],
        laterTaxonomyAreaKeys: ["chipping"],
      },
    ],
    unclassifiableCounts: {
      earlier: 2,
      later: 1,
    },
  },
} as const;

describe("sport metrics golf comparison", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("parses the complete response without calculating or replacing values", () => {
    const parsed = parseSportMetricsGolfComparisonPayload(comparisonPayload);

    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe("Sport metric comparison fetched successfully");
    expect(parsed.data.sport).toBe("GOLF");
    expect(parsed.data.earlier).toEqual(comparisonPayload.data.earlier);
    expect(parsed.data.later).toEqual(comparisonPayload.data.later);
    expect(parsed.data.categories.map((category) => category.taxonomyAreaKey)).toEqual([
      "distance_control",
      "short_game",
    ]);
    expect(parsed.data.categories[0]?.earlier).toEqual({
      attempts: 0,
      successes: 0,
      targetHits: null,
      successRate: null,
    });
    expect(parsed.data.categories[0]?.delta).toEqual(
      comparisonPayload.data.categories[0].delta,
    );
    expect(parsed.data.categories[1]?.later).toBeNull();
    expect(parsed.data.categories[1]?.drills.map((drill) => drill.status)).toEqual([
      "ONLY_IN_EARLIER",
      "ONLY_IN_LATER",
    ]);
    expect(parsed.data.categories[1]?.drills[0]?.laterSkillName).toBeNull();
    expect(parsed.data.categories[1]?.drills[1]?.earlierSkillName).toBeNull();
    expect(parsed.data.taxonomyMismatches).toEqual(
      comparisonPayload.data.taxonomyMismatches,
    );
    expect(parsed.data.unclassifiableCounts).toEqual({ earlier: 2, later: 1 });
  });

  it("preserves backend array order", () => {
    const payload = structuredClone(comparisonPayload) as unknown as {
      data: {
        categories: Array<{
          drills: unknown[];
        }>;
      };
    };
    payload.data.categories.reverse();
    payload.data.categories[0]!.drills.reverse();

    const parsed = parseSportMetricsGolfComparisonPayload(payload);

    expect(parsed.data.categories.map((category) => category.taxonomyAreaKey)).toEqual([
      "short_game",
      "distance_control",
    ]);
    expect(parsed.data.categories[0]?.drills.map((drill) => drill.skillCode)).toEqual([
      "GOLF_CHIP_002",
      "GOLF_CHIP_001",
    ]);
  });

  it("normalizes contract error envelopes", () => {
    expect(() =>
      parseSportMetricsGolfComparisonPayload({
        success: false,
        message:
          "earlierTrainingPlanVersionId and laterTrainingPlanVersionId must be different",
        errorCode: "BAD_REQUEST",
      }),
    ).toThrow(
      expect.objectContaining({
        message:
          "earlierTrainingPlanVersionId and laterTrainingPlanVersionId must be different",
        status: 400,
        code: "BAD_REQUEST",
      }),
    );
  });

  it("requests the exact comparison endpoint and query parameters", async () => {
    apiRequestMock.mockResolvedValue(comparisonPayload);

    const response = await fetchSportMetricsGolfComparison({
      entityId: " entity/1 ",
      athleteId: " athlete 1 ",
      earlierTrainingPlanVersionId: " earlier/version ",
      laterTrainingPlanVersionId: " later version ",
    });

    expect(response.data.categories).toHaveLength(2);
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/entities/entity%2F1/athletes/athlete%201/sport-metrics/golf/comparison?earlierTrainingPlanVersionId=earlier%2Fversion&laterTrainingPlanVersionId=later+version",
      {
        method: "GET",
        cache: "no-store",
        timeoutMs: 240_000,
      },
    );
  });
});

describe("buildGolfSportMetricRecordRequestBody", () => {
  it("keeps prescribedContextJson and valueJson as objects before serialization", () => {
    const requestBody = buildGolfSportMetricRecordRequestBody({
      trainingPlanVersionId: "version-1",
      plannedSessionId: "ps-1",
      occurredAt: "2026-05-24T12:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "PRACTICE_FACILITY",
      source: "ATHLETE_MANUAL",
      prescribedContextJson: { label: "Chip Ladder", order: 1 },
      valueJson: { attempts: 5, successes: 4 },
    });

    expect(requestBody.prescribedContextJson).toEqual({ label: "Chip Ladder", order: 1 });
    expect(requestBody.valueJson).toEqual({ attempts: 5, successes: 4 });
    expect(JSON.stringify(requestBody)).not.toContain("[object Object]");
  });
});

describe("postGolfSportMetricRecord", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs to golf records with required linkage fields", async () => {
    apiRequestMock.mockResolvedValue({ success: true, data: { id: "record-1" } });

    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-skills",
      plannedSessionId: "session-1",
      occurredAt: "2026-05-24T16:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "SIMULATOR",
      source: "SIMULATOR_MANUAL",
      prescribedContextJson: {
        label: "3-6-9 Circle Pressure Drill",
        plannedSessionId: "session-1",
        trainingPlanVersionId: "version-skills",
      },
      valueJson: { attempts: 9, successes: 7 },
    });

    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(path).toBe(
      "/entities/entity-1/athletes/athlete-1/sport-metrics/golf/records",
    );
    expect(path).not.toContain("adherence");
    expect(options.method).toBe("POST");

    const parsedBody = parsePostJsonBody(options);
    expect(parsedBody.trainingPlanVersionId).toBe("version-skills");
    expect(parsedBody.plannedSessionId).toBe("session-1");
    expect(parsedBody.prescribedContextJson).toEqual(
      expect.objectContaining({
        label: "3-6-9 Circle Pressure Drill",
      }),
    );
    expect(parsedBody.valueJson).toEqual({ attempts: 9, successes: 7 });
    expect(parsedBody.prescribedContextJson).not.toBe("[object Object]");
    expect(parsedBody.valueJson).not.toBe("[object Object]");
    expect(typeof parsedBody.prescribedContextJson).toBe("object");
    expect(typeof parsedBody.valueJson).toBe("object");
  });

  it("serializes nested provider inside valueJson as an object", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      plannedSessionId: "ps-1",
      occurredAt: "2026-05-24T12:00:00.000Z",
      metricType: "DRILL_RESULT",
      environment: "SIMULATOR",
      source: "SIMULATOR_MANUAL",
      prescribedContextJson: { label: "Driver Ladder" },
      valueJson: {
        attempts: 12,
        successes: 10,
        provider: { key: "trackman" },
      },
    });

    const options = apiRequestMock.mock.calls[0]?.[1] as Record<string, unknown>;
    const parsedBody = parsePostJsonBody(options);
    const valueJson = parsedBody.valueJson as Record<string, unknown>;

    expect(valueJson.attempts).toBe(12);
    expect(valueJson.successes).toBe(10);
    expect(valueJson.provider).toEqual({ key: "trackman" });
    expect(typeof valueJson.provider).toBe("object");
  });

  it("does not call adherence endpoints", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await postGolfSportMetricRecord("entity-1", "athlete-1", {
      trainingPlanVersionId: "version-1",
      plannedSessionId: "ps-1",
      occurredAt: "2026-05-24T12:00:00.000Z",
      metricType: "ROUND_RESULT",
      environment: "ON_COURSE",
      source: "ATHLETE_MANUAL",
      prescribedContextJson: { label: "Round" },
      valueJson: { holesPlayed: 18, score: 82, par: 72 },
    });

    const path = apiRequestMock.mock.calls[0]?.[0] as string;
    expect(path).not.toMatch(/adherence/i);
  });
});
