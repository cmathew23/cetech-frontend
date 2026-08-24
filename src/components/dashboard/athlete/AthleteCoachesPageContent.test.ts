import { describe, expect, it } from "vitest";

import { assignedCoachPhoneDisplay } from "@/components/dashboard/athlete/AthleteCoachesPageContent";

describe("assignedCoachPhoneDisplay", () => {
  it("shows the persisted coach profile phone", () => {
    expect(assignedCoachPhoneDisplay("555-0100")).toBe("555-0100");
  });

  it("renders a clean fallback when phone is missing", () => {
    expect(assignedCoachPhoneDisplay(null)).toBe("—");
    expect(assignedCoachPhoneDisplay("")).toBe("—");
    expect(assignedCoachPhoneDisplay("   ")).toBe("—");
  });
});
