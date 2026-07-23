import {
  comparisonSnapshotIdsForOwner,
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
    ["snapshot-a", "snapshot-a"],
    [" snapshot-a ", "snapshot-a"],
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
});
