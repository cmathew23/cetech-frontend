import {
  createOrFindChatConversation,
  sendChatTextMessage,
} from "@/lib/api/chat";

export type BasketballCoachEntryTarget = {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId: string;
  plannedSessionId: string;
  skillCode: string;
  plannedSkillItemOrder?: number;
  primaryGoalId?: string;
  label: string;
  date: string;
};

export type BasketballCoachEntryQuery = {
  entityId: string;
  athleteId: string;
  trainingPlanVersionId: string;
  plannedSessionId: string;
  skillCode: string;
  plannedSkillItemOrder: number | null;
  primaryGoalId: string | null;
  date: string | null;
  label: string | null;
};

type SearchParamSource = {
  get(name: string): string | null;
};

function readParam(params: SearchParamSource, name: string): string {
  return params.get(name)?.trim() ?? "";
}

function readPositiveOrder(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

export function parseBasketballCoachEntrySearchParams(
  params: SearchParamSource,
): BasketballCoachEntryQuery | null {
  const athleteId = readParam(params, "athleteId");
  const trainingPlanVersionId = readParam(params, "trainingPlanVersionId");
  const plannedSessionId = readParam(params, "plannedSessionId");
  const skillCode = readParam(params, "skillCode");
  if (
    athleteId === "" ||
    trainingPlanVersionId === "" ||
    plannedSessionId === "" ||
    skillCode === ""
  ) {
    return null;
  }
  const primaryGoalId = readParam(params, "primaryGoalId");
  const date = readParam(params, "date");
  const label = readParam(params, "label");
  return {
    entityId: readParam(params, "entityId"),
    athleteId,
    trainingPlanVersionId,
    plannedSessionId,
    skillCode,
    plannedSkillItemOrder: readPositiveOrder(readParam(params, "plannedSkillItemOrder")),
    primaryGoalId: primaryGoalId === "" ? null : primaryGoalId,
    date: date === "" ? null : date,
    label: label === "" ? null : label,
  };
}

export function buildBasketballCoachEntryPath(target: BasketballCoachEntryTarget): string {
  const params = new URLSearchParams();
  params.set("entityId", target.entityId.trim());
  params.set("athleteId", target.athleteId.trim());
  params.set("trainingPlanVersionId", target.trainingPlanVersionId.trim());
  params.set("plannedSessionId", target.plannedSessionId.trim());
  params.set("skillCode", target.skillCode.trim());
  if (
    target.plannedSkillItemOrder !== undefined &&
    Number.isInteger(target.plannedSkillItemOrder) &&
    target.plannedSkillItemOrder >= 1
  ) {
    params.set("plannedSkillItemOrder", String(target.plannedSkillItemOrder));
  }
  const primaryGoalId = target.primaryGoalId?.trim() ?? "";
  if (primaryGoalId !== "") params.set("primaryGoalId", primaryGoalId);
  const date = target.date.trim();
  if (date !== "") params.set("date", date);
  const label = target.label.trim();
  if (label !== "") params.set("label", label);
  return `/coach/athlete-performance?${params.toString()}`;
}

export function isBasketballCoachEntryInstruction(content: string): boolean {
  return (
    content.includes("Please enter the Basketball measurement for ") &&
    content.includes("Open this exercise:") &&
    content.includes("/coach/athlete-performance")
  );
}

export function displayChatMessageContent(input: {
  content: string;
  viewerRole: "ATHLETE" | "COACH";
  coachName: string;
}): string {
  if (input.viewerRole !== "ATHLETE") return input.content;
  if (!isBasketballCoachEntryInstruction(input.content)) return input.content;
  const coachName = input.coachName.trim();
  if (coachName === "") return input.content;
  return `Information sent to ${coachName}, the coach responsible for this Skills plan.`;
}

export function buildBasketballCoachEntryMessage(
  origin: string,
  target: BasketballCoachEntryTarget,
): string {
  const normalizedOrigin = origin.trim().replace(/\/$/, "");
  const url = `${normalizedOrigin}${buildBasketballCoachEntryPath(target)}`;
  const label = target.label.trim() || target.skillCode.trim();
  return [
    `Please enter the Basketball measurement for ${label}.`,
    "",
    "Open this exercise:",
    url,
  ].join("\n");
}

export function basketballCoachEntryRequestKey(target: BasketballCoachEntryTarget): string {
  const order =
    target.plannedSkillItemOrder !== undefined &&
    Number.isInteger(target.plannedSkillItemOrder)
      ? String(target.plannedSkillItemOrder)
      : "";
  return `${target.plannedSessionId.trim()}::${target.skillCode.trim()}::${order}`;
}

export async function sendBasketballCoachEntryRequest(input: {
  coachProfileId: string | null | undefined;
  origin: string;
  target: BasketballCoachEntryTarget;
}): Promise<{ conversationId: string; content: string }> {
  const coachProfileId = input.coachProfileId?.trim() ?? "";
  if (coachProfileId === "") {
    throw {
      message: "The released Skills plan does not identify a coach for this request.",
      status: 400,
      code: "COACH_ENTRY_RECIPIENT_MISSING",
    };
  }
  const skillCode = input.target.skillCode.trim();
  if (skillCode === "") {
    throw {
      message: "This exercise is missing a skill code.",
      status: 400,
      code: "COACH_ENTRY_SKILL_MISSING",
    };
  }
  const content = buildBasketballCoachEntryMessage(input.origin, input.target);
  const conversation = await createOrFindChatConversation({ coachProfileId });
  await sendChatTextMessage(conversation.conversationId, content);
  return { conversationId: conversation.conversationId, content };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readItemOrder(item: Record<string, unknown>): number | null {
  const order = item.order;
  return typeof order === "number" && Number.isInteger(order) && order >= 1 ? order : null;
}

function skillItemsFromSession(session: Record<string, unknown>): Record<string, unknown>[] {
  const structure = asRecord(session.sessionStructure);
  const skill = asRecord(structure?.skill);
  if (!Array.isArray(skill?.items)) return [];
  return skill.items.filter((item): item is Record<string, unknown> => asRecord(item) !== null);
}

export type ResolvedBasketballCoachEntry = {
  drill: Record<string, unknown>;
  itemIndex: number;
  dayDate: string;
  sessionTitle: string;
  plannedSessionId: string;
};

export function resolveBasketballCoachEntryExercise(
  journal: {
    domains: { SKILLS: { versionId: string | null } };
    days: Array<{ date: string; skills: unknown[] }>;
  },
  query: BasketballCoachEntryQuery,
): { ok: true; exercise: ResolvedBasketballCoachEntry } | { ok: false; error: string } {
  const releasedVersionId = journal.domains.SKILLS.versionId?.trim() ?? "";
  if (releasedVersionId === "" || releasedVersionId !== query.trainingPlanVersionId.trim()) {
    return {
      ok: false,
      error: "This exercise is not on the current released Skills plan.",
    };
  }

  const matches: ResolvedBasketballCoachEntry[] = [];
  for (const day of journal.days) {
    for (const rawSession of day.skills) {
      const session = asRecord(rawSession);
      if (!session) continue;
      if (readText(session.id) !== query.plannedSessionId.trim()) continue;
      const items = skillItemsFromSession(session);
      items.forEach((item, itemIndex) => {
        if (readText(item.skillCode) !== query.skillCode.trim()) return;
        const order = readItemOrder(item);
        if (query.plannedSkillItemOrder !== null && order !== query.plannedSkillItemOrder) {
          return;
        }
        const sessionTitle = readText(session.name) || readText(session.title) || "Skills session";
        matches.push({
          drill: item,
          itemIndex,
          dayDate: readText(day.date) || query.date || "",
          sessionTitle,
          plannedSessionId: query.plannedSessionId.trim(),
        });
      });
    }
  }

  if (matches.length !== 1) {
    return {
      ok: false,
      error: "The released plan does not contain this exercise.",
    };
  }
  return { ok: true, exercise: matches[0]! };
}
