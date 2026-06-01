import { describe, expect, it } from "vitest";
import {
  buildEvidenceDetailLines,
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
