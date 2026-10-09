import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AthleteTodayPlanCard identifier wiring", () => {
  const card = readFileSync(
    new URL("./AthleteTodayPlanCard.tsx", import.meta.url),
    "utf8",
  );
  const shell = readFileSync(
    new URL("./AthleteDashboardShell.tsx", import.meta.url),
    "utf8",
  );

  it("shows Athlete profile not ready only when shared identifier phase is not_ready", () => {
    expect(card).toContain('identifiersPhase === "not_ready"');
    expect(card).toContain("Athlete profile not ready");
    expect(card).toContain("fetchAthleteTodayPlan");
    expect(card).toContain("fetchAthleteWeeklyPlanJournal");
    expect(card).not.toContain("useAthletePlanningIdentifiers");
  });

  it("reuses the dashboard shell identifier resolution instead of a second athletes/me fetch", () => {
    expect(shell).toContain("<AthleteTodayPlanCard");
    expect(shell).toContain("entityId={entityId}");
    expect(shell).toContain("athleteId={athleteId}");
    expect(shell).toContain("identifiersPhase={planningIds.phase}");
  });
});
