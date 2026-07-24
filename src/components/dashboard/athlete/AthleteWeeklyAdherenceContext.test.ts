import {
  chronologicalComparisonSnapshotIds,
  comparisonSnapshotIdsForOwner,
  isChronologicalWeeklyAdherenceSnapshotPair,
  reconcileWeeklyAdherenceSnapshotSelections,
  runWeeklyAdherenceComparisonLifecycle,
} from "@/components/dashboard/athlete/AthleteWeeklyAdherenceContext";
import type {
  WeeklyAdherenceComparisonData,
  WeeklyAdherenceComparisonResponse,
} from "@/lib/api/weeklyAdherence";
import { describe, expect, it, vi } from "vitest";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const comparisonData = {
  athleteId: "athlete-1",
} as WeeklyAdherenceComparisonData;

const comparisonResponse = {
  message: "OK",
  data: comparisonData,
} as WeeklyAdherenceComparisonResponse;

const snapshots = [
  { id: "snapshot-a", weekStart: "2026-07-06", weekEnd: "2026-07-12" },
  { id: "snapshot-b", weekStart: "2026-07-13", weekEnd: "2026-07-19" },
  { id: "snapshot-c", weekStart: "2026-07-20", weekEnd: "2026-07-26" },
];

function lifecycleInput(
  overrides: Partial<
    Parameters<typeof runWeeklyAdherenceComparisonLifecycle>[0]
  > = {},
) {
  return {
    snapshotAId: "snapshot-a",
    snapshotBId: "snapshot-b",
    isCurrent: () => true,
    fetchComparison: vi.fn().mockResolvedValue(comparisonResponse),
    setComparisonData: vi.fn(),
    setComparisonLoading: vi.fn(),
    setComparisonError: vi.fn(),
    ...overrides,
  };
}

describe("runWeeklyAdherenceComparisonLifecycle", () => {
  it("sets loading while a valid comparison request is pending", async () => {
    const request = deferred<WeeklyAdherenceComparisonResponse>();
    const input = lifecycleInput({
      fetchComparison: vi.fn(() => request.promise),
    });

    const lifecycle = runWeeklyAdherenceComparisonLifecycle(input);

    expect(input.setComparisonData).toHaveBeenCalledWith(null);
    expect(input.setComparisonError).toHaveBeenCalledWith(null);
    expect(input.setComparisonLoading).toHaveBeenCalledWith(true);

    request.resolve(comparisonResponse);
    await lifecycle;
  });

  it("stores comparison data and finishes loading on success", async () => {
    const input = lifecycleInput();

    await runWeeklyAdherenceComparisonLifecycle(input);

    expect(input.fetchComparison).toHaveBeenCalledTimes(1);
    expect(input.setComparisonData).toHaveBeenLastCalledWith(comparisonData);
    expect(input.setComparisonError).toHaveBeenLastCalledWith(null);
    expect(input.setComparisonLoading).toHaveBeenLastCalledWith(false);
  });

  it("fetches one updated comparison when one valid selection changes", async () => {
    const requests: string[] = [];
    const runPair = async (snapshotAId: string, snapshotBId: string) => {
      const input = lifecycleInput({
        snapshotAId,
        snapshotBId,
        fetchComparison: vi.fn(() => {
          requests.push(`${snapshotAId}:${snapshotBId}`);
          return Promise.resolve(comparisonResponse);
        }),
      });
      await runWeeklyAdherenceComparisonLifecycle(input);
      expect(input.fetchComparison).toHaveBeenCalledTimes(1);
    };

    await runPair("snapshot-a", "snapshot-b");
    await runPair("snapshot-a", "snapshot-c");

    expect(requests).toEqual([
      "snapshot-a:snapshot-b",
      "snapshot-a:snapshot-c",
    ]);
  });

  it("stores the existing formatted error and finishes loading on failure", async () => {
    const input = lifecycleInput({
      fetchComparison: vi.fn().mockRejectedValue(new Error("Comparison failed")),
    });

    await runWeeklyAdherenceComparisonLifecycle(input);

    expect(input.setComparisonData).toHaveBeenCalledWith(null);
    expect(input.setComparisonError).toHaveBeenLastCalledWith(
      "Comparison failed",
    );
    expect(input.setComparisonLoading).toHaveBeenLastCalledWith(false);
  });

  it("ignores a stale response after a newer lifecycle takes ownership", async () => {
    const request = deferred<WeeklyAdherenceComparisonResponse>();
    let current = true;
    const input = lifecycleInput({
      isCurrent: () => current,
      fetchComparison: vi.fn(() => request.promise),
    });

    const lifecycle = runWeeklyAdherenceComparisonLifecycle(input);
    current = false;
    request.resolve(comparisonResponse);
    await lifecycle;

    expect(input.setComparisonData).toHaveBeenCalledTimes(1);
    expect(input.setComparisonData).toHaveBeenCalledWith(null);
    expect(input.setComparisonError).toHaveBeenCalledTimes(1);
    expect(input.setComparisonLoading).toHaveBeenCalledTimes(1);
    expect(input.setComparisonLoading).toHaveBeenCalledWith(true);
  });

  it("clears prior comparison data immediately when the athlete lifecycle changes", async () => {
    const request = deferred<WeeklyAdherenceComparisonResponse>();
    const input = lifecycleInput({
      fetchComparison: vi.fn(() => request.promise),
    });

    const lifecycle = runWeeklyAdherenceComparisonLifecycle(input);

    expect(input.setComparisonData).toHaveBeenCalledWith(null);
    expect(input.setComparisonError).toHaveBeenCalledWith(null);

    request.resolve(comparisonResponse);
    await lifecycle;
  });

  it.each([
    ["", "snapshot-b"],
    ["snapshot-a", ""],
  ])(
    "clears state and skips the request for invalid snapshot ids",
    async (snapshotAId, snapshotBId) => {
      const input = lifecycleInput({ snapshotAId, snapshotBId });

      await runWeeklyAdherenceComparisonLifecycle(input);

      expect(input.fetchComparison).not.toHaveBeenCalled();
      expect(input.setComparisonData).toHaveBeenCalledWith(null);
      expect(input.setComparisonError).toHaveBeenCalledWith(null);
      expect(input.setComparisonLoading).toHaveBeenCalledWith(false);
    },
  );
});

describe("weekly adherence snapshot selection", () => {
  it("clears effective selections when the athlete owner changes", () => {
    expect(
      comparisonSnapshotIdsForOwner(
        "entity-1:athlete-1",
        "entity-1:athlete-2",
        "snapshot-a",
        "snapshot-b",
      ),
    ).toEqual(["", ""]);
  });

  it("accepts only chronologically ordered week pairs", () => {
    expect(
      isChronologicalWeeklyAdherenceSnapshotPair(
        snapshots,
        "snapshot-a",
        "snapshot-b",
      ),
    ).toBe(true);
    expect(
      isChronologicalWeeklyAdherenceSnapshotPair(
        snapshots,
        "snapshot-b",
        "snapshot-a",
      ),
    ).toBe(false);
    expect(
      isChronologicalWeeklyAdherenceSnapshotPair(
        snapshots,
        "snapshot-a",
        "snapshot-a",
      ),
    ).toBe(false);
  });

  it("clears Later week when Earlier week makes the pair invalid", () => {
    expect(
      reconcileWeeklyAdherenceSnapshotSelections({
        changedSelection: "earlier",
        snapshotId: "snapshot-c",
        earlierSnapshotId: "snapshot-a",
        laterSnapshotId: "snapshot-b",
        snapshots,
      }),
    ).toEqual(["snapshot-c", ""]);
  });

  it("clears Earlier week when Later week makes the pair invalid", () => {
    expect(
      reconcileWeeklyAdherenceSnapshotSelections({
        changedSelection: "later",
        snapshotId: "snapshot-a",
        earlierSnapshotId: "snapshot-b",
        laterSnapshotId: "snapshot-c",
        snapshots,
      }),
    ).toEqual(["", "snapshot-a"]);
  });

  it("preserves the other selection while chronology remains valid", () => {
    expect(
      reconcileWeeklyAdherenceSnapshotSelections({
        changedSelection: "earlier",
        snapshotId: "snapshot-b",
        earlierSnapshotId: "snapshot-a",
        laterSnapshotId: "snapshot-c",
        snapshots,
      }),
    ).toEqual(["snapshot-b", "snapshot-c"]);
    expect(
      reconcileWeeklyAdherenceSnapshotSelections({
        changedSelection: "later",
        snapshotId: "snapshot-b",
        earlierSnapshotId: "snapshot-a",
        laterSnapshotId: "snapshot-c",
        snapshots,
      }),
    ).toEqual(["snapshot-a", "snapshot-b"]);
  });

  it("skips comparison fetch until the selected pair is chronological", async () => {
    const invalidIds = chronologicalComparisonSnapshotIds(
      snapshots,
      "snapshot-b",
      "snapshot-a",
    );
    const invalidInput = lifecycleInput({
      snapshotAId: invalidIds[0],
      snapshotBId: invalidIds[1],
    });
    await runWeeklyAdherenceComparisonLifecycle(invalidInput);

    const validIds = chronologicalComparisonSnapshotIds(
      snapshots,
      "snapshot-a",
      "snapshot-b",
    );
    const validInput = lifecycleInput({
      snapshotAId: validIds[0],
      snapshotBId: validIds[1],
    });
    await runWeeklyAdherenceComparisonLifecycle(validInput);

    expect(invalidInput.fetchComparison).not.toHaveBeenCalled();
    expect(validInput.fetchComparison).toHaveBeenCalledTimes(1);
  });
});
