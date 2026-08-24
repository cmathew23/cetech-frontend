import { describe, expect, it } from "vitest";

import {
  shouldShowAssignmentCreateForm,
  shouldShowAssignmentRows,
  shouldShowAssignmentsInitialLoading,
  shouldShowInitialRosterLoading,
  shouldShowRosterRefreshing,
} from "@/lib/adminAssignmentRosterUi";

describe("admin assignment roster UI predicates", () => {
  it("keeps the first-load roster loading state when no options exist yet", () => {
    expect(shouldShowInitialRosterLoading(true, 0, 0)).toBe(true);
    expect(shouldShowAssignmentCreateForm("entity-1", true, 0, 0)).toBe(false);
    expect(shouldShowRosterRefreshing(true, 0, 0)).toBe(false);
  });

  it("does not hide coach/athlete controls during a background roster refresh", () => {
    expect(shouldShowInitialRosterLoading(true, 1, 3)).toBe(false);
    expect(shouldShowRosterRefreshing(true, 1, 3)).toBe(true);
    expect(shouldShowAssignmentCreateForm("entity-1", true, 0, 3)).toBe(true);
  });

  it("keeps existing assignment rows visible while a refresh is in flight", () => {
    expect(shouldShowAssignmentsInitialLoading(true, 0)).toBe(true);
    expect(shouldShowAssignmentsInitialLoading(true, 2)).toBe(false);
    expect(shouldShowAssignmentRows(true, 2)).toBe(true);
    expect(shouldShowAssignmentRows(false, 2)).toBe(true);
    expect(shouldShowAssignmentRows(true, 0)).toBe(false);
  });
});
