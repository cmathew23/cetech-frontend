import { beforeEach, describe, expect, it, vi } from "vitest";

const { createOrFindChatConversationMock, sendChatTextMessageMock } = vi.hoisted(() => ({
  createOrFindChatConversationMock: vi.fn(),
  sendChatTextMessageMock: vi.fn(),
}));

vi.mock("@/lib/api/chat", () => ({
  createOrFindChatConversation: createOrFindChatConversationMock,
  sendChatTextMessage: sendChatTextMessageMock,
}));

import {
  buildBasketballCoachEntryMessage,
  displayChatMessageContent,
  parseBasketballCoachEntrySearchParams,
  resolveBasketballCoachEntryExercise,
  sendBasketballCoachEntryRequest,
  type BasketballCoachEntryTarget,
} from "@/lib/basketball/coachEntryRequest";

const target: BasketballCoachEntryTarget = {
  entityId: "entity-1",
  athleteId: "athlete-1",
  trainingPlanVersionId: "version-1",
  plannedSessionId: "session-1",
  skillCode: "BB_FOOT_001",
  plannedSkillItemOrder: 2,
  primaryGoalId: "goal-1",
  label: "Triple Threat Position",
  date: "2026-10-02",
};

describe("Basketball coach entry request", () => {
  beforeEach(() => {
    createOrFindChatConversationMock.mockReset();
    sendChatTextMessageMock.mockReset();
  });

  it("builds a Peak Connect text message with the exact exercise deep link", () => {
    const content = buildBasketballCoachEntryMessage("https://peakflow.example", target);
    const url = content.split("\n").at(-1) ?? "";
    const parsed = new URL(url);

    expect(content).toContain("Please enter the Basketball measurement for Triple Threat Position.");
    expect(parsed.origin).toBe("https://peakflow.example");
    expect(parsed.pathname).toBe("/coach/athlete-performance");
    expect(parsed.searchParams.get("entityId")).toBe("entity-1");
    expect(parsed.searchParams.get("athleteId")).toBe("athlete-1");
    expect(parsed.searchParams.get("trainingPlanVersionId")).toBe("version-1");
    expect(parsed.searchParams.get("plannedSessionId")).toBe("session-1");
    expect(parsed.searchParams.get("skillCode")).toBe("BB_FOOT_001");
    expect(parsed.searchParams.get("plannedSkillItemOrder")).toBe("2");
    expect(parsed.searchParams.get("primaryGoalId")).toBe("goal-1");
    expect(parsed.searchParams.get("date")).toBe("2026-10-02");
    expect(parsed.searchParams.get("label")).toBe("Triple Threat Position");
  });

  it("sends the text request only to the released plan generator", async () => {
    createOrFindChatConversationMock.mockResolvedValue({ conversationId: "conversation-1" });
    sendChatTextMessageMock.mockResolvedValue({ id: "message-1" });

    const result = await sendBasketballCoachEntryRequest({
      coachProfileId: "coach-profile-1",
      origin: "https://peakflow.example",
      target,
    });

    expect(createOrFindChatConversationMock).toHaveBeenCalledTimes(1);
    expect(createOrFindChatConversationMock).toHaveBeenCalledWith({
      coachProfileId: "coach-profile-1",
    });
    expect(sendChatTextMessageMock).toHaveBeenCalledTimes(1);
    expect(sendChatTextMessageMock.mock.calls[0]?.[0]).toBe("conversation-1");
    expect(sendChatTextMessageMock.mock.calls[0]?.[1]).toContain("skillCode=BB_FOOT_001");
    expect(result.conversationId).toBe("conversation-1");
  });

  it("routes a Football exercise to the same plan generator without a Basketball label", async () => {
    createOrFindChatConversationMock.mockResolvedValue({ conversationId: "conversation-1" });
    sendChatTextMessageMock.mockResolvedValue({ id: "message-1" });

    const footballTarget: BasketballCoachEntryTarget = {
      ...target,
      skillCode: "FBGK_HANDLING_001",
      label: "Secure handling",
    };
    const result = await sendBasketballCoachEntryRequest({
      coachProfileId: "plan-generator-coach",
      origin: "https://peakflow.example",
      target: footballTarget,
      sportLabel: "Football",
    });

    expect(createOrFindChatConversationMock).toHaveBeenCalledWith({
      coachProfileId: "plan-generator-coach",
    });
    const content = sendChatTextMessageMock.mock.calls[0]?.[1] as string;
    expect(content).toContain("Please enter the Football measurement for Secure handling.");
    expect(content).toContain("skillCode=FBGK_HANDLING_001");
    expect(content).not.toContain("Basketball");
    expect(result.conversationId).toBe("conversation-1");
    expect(
      displayChatMessageContent({
        content,
        viewerRole: "ATHLETE",
        coachName: "Skills Coach",
      }),
    ).toBe(
      "Information sent to Skills Coach, the coach responsible for this Skills plan.",
    );
  });

  it("does not choose another coach when the plan generator is missing", async () => {
    await expect(
      sendBasketballCoachEntryRequest({
        coachProfileId: "  ",
        origin: "https://peakflow.example",
        target,
      }),
    ).rejects.toMatchObject({ code: "COACH_ENTRY_RECIPIENT_MISSING" });
    expect(createOrFindChatConversationMock).not.toHaveBeenCalled();
    expect(sendChatTextMessageMock).not.toHaveBeenCalled();
  });
});

describe("athlete PeakConnect coach-entry notice", () => {
  const content = buildBasketballCoachEntryMessage("http://localhost:3001", target);

  it.each([
    ["WF1", "Nina Cole"],
    ["WF2A", "Greg Michaels"],
    ["WF2B", "Nina Cole"],
    ["WF3", "Owen Patel"],
  ])("%s uses the message-history coachName", (workflow, coachName) => {
    const shown = displayChatMessageContent({
      content,
      viewerRole: "ATHLETE",
      coachName,
    });

    expect(shown).toBe(
      `Information sent to ${coachName}, the coach responsible for this Skills plan.`,
    );
    expect(shown).not.toContain("/coach/athlete-performance");
    expect(shown).not.toContain("Open this exercise");
    expect(shown).not.toContain("Please enter the Basketball measurement");
    expect(workflow).not.toBe("");
  });

  it("keeps the coach link and leaves other athlete messages unchanged", () => {
    expect(
      displayChatMessageContent({
        content,
        viewerRole: "COACH",
        coachName: "Greg Michaels",
      }),
    ).toBe(content);
    expect(
      displayChatMessageContent({
        content: "See you at practice",
        viewerRole: "ATHLETE",
        coachName: "Greg Michaels",
      }),
    ).toBe("See you at practice");
  });
});

describe("coach athlete-performance deep link", () => {
  const journal = {
    domains: { SKILLS: { versionId: "version-1" } },
    days: [
      {
        date: "2026-10-02",
        skills: [
          {
            id: "session-1",
            name: "Footwork",
            sessionStructure: {
              skill: {
                items: [
                  {
                    skillCode: "BB_FOOT_001",
                    order: 2,
                    primaryGoalId: "goal-1",
                    label: "Triple Threat Position",
                    athleteSelfEntryAllowed: false,
                    externalObservationRequired: true,
                    measurementEntryContract: { INDIVIDUAL: { fields: [] } },
                  },
                  {
                    skillCode: "BB_FOOT_001",
                    order: 3,
                    label: "Other rep",
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };

  it("opens the matching session and exercise", () => {
    const query = parseBasketballCoachEntrySearchParams(
      new URLSearchParams({
        entityId: "entity-1",
        athleteId: "athlete-1",
        trainingPlanVersionId: "version-1",
        plannedSessionId: "session-1",
        skillCode: "BB_FOOT_001",
        plannedSkillItemOrder: "2",
        primaryGoalId: "goal-1",
        date: "2026-10-02",
      }),
    );
    expect(query).not.toBeNull();
    const resolved = resolveBasketballCoachEntryExercise(journal, query!);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.exercise.plannedSessionId).toBe("session-1");
    expect(resolved.exercise.dayDate).toBe("2026-10-02");
    expect(resolved.exercise.drill.order).toBe(2);
    expect(resolved.exercise.drill.skillCode).toBe("BB_FOOT_001");
    expect(resolved.exercise.itemIndex).toBe(0);
  });

  it("rejects a link whose released version does not match", () => {
    const query = parseBasketballCoachEntrySearchParams(
      new URLSearchParams({
        athleteId: "athlete-1",
        trainingPlanVersionId: "other-version",
        plannedSessionId: "session-1",
        skillCode: "BB_FOOT_001",
      }),
    );
    const resolved = resolveBasketballCoachEntryExercise(journal, query!);
    expect(resolved.ok).toBe(false);
  });
});
