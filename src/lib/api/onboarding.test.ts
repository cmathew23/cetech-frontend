import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { toAthleteProfilePayload } from "@/lib/api/onboarding";

const onboardingPageSource = readFileSync(
  new URL("../../app/onboarding/page.tsx", import.meta.url),
  "utf8",
);

describe("football athlete onboarding payload", () => {
  it("submits FOOTBALL, GOALKEEPER, and the selected AthleteLevel", () => {
    for (const level of ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const) {
      expect(
        toAthleteProfilePayload({
          sport: "FOOTBALL",
          disciplineOrEvent: "GOALKEEPER",
          level,
        }),
      ).toEqual({
        sport: "FOOTBALL",
        disciplineOrEvent: "GOALKEEPER",
        level,
      });
    }
  });

  it("omits an empty optional level and does not invent athleteStage", () => {
    const body = toAthleteProfilePayload({
      sport: " FOOTBALL ",
      disciplineOrEvent: " GOALKEEPER ",
      level: "  ",
    });

    expect(body).toEqual({
      sport: "FOOTBALL",
      disciplineOrEvent: "GOALKEEPER",
    });
    expect(body).not.toHaveProperty("athleteStage");
    expect(body).not.toHaveProperty("sportCode");
  });

  it("does not send football discipline on golf or basketball payloads", () => {
    expect(
      toAthleteProfilePayload({
        sport: "GOLF",
        level: "BEGINNER",
        disciplineOrEvent: "GOALKEEPER",
      }),
    ).toEqual({
      sport: "GOLF",
      level: "BEGINNER",
    });

    expect(
      toAthleteProfilePayload({
        sport: "BASKETBALL",
        level: "ELITE",
        disciplineOrEvent: "POINT_GUARD",
      }),
    ).toEqual({
      sport: "BASKETBALL",
      level: "ELITE",
    });
  });
});

describe("football athlete onboarding form", () => {
  it("enables football on the existing supported-sport check", () => {
    expect(onboardingPageSource).toContain(
      'disabled={s !== "GOLF" && s !== "BASKETBALL" && s !== "FOOTBALL"}',
    );
  });

  it("shows Goalkeeper only when football is selected", () => {
    expect(onboardingPageSource).toContain('const isFootball = sport === "FOOTBALL"');
    expect(onboardingPageSource).toContain("{isFootball ? (");
    expect(onboardingPageSource).toContain('name="disciplineOrEvent"');
    expect(onboardingPageSource).toContain('value="GOALKEEPER"');
    expect(onboardingPageSource).toContain(">Goalkeeper</option>");
    expect(onboardingPageSource).not.toContain("POINT_GUARD");
    expect(onboardingPageSource).not.toContain("SOCCER");
    expect(onboardingPageSource).not.toContain("athleteStage");
  });

  it("keeps golf and basketball on the shared level list", () => {
    expect(onboardingPageSource).toContain(": ATHLETE_LEVELS");
    expect(onboardingPageSource).toContain('athleteLevel === "BEGINNER"');
    expect(onboardingPageSource).toContain('athleteLevel === "INTERMEDIATE"');
    expect(onboardingPageSource).toContain('athleteLevel === "ADVANCED"');
    expect(onboardingPageSource).not.toContain("handicap");
  });
});
