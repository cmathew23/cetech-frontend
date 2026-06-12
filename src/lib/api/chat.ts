import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed !== "") return trimmed;
  }
  return "";
}

function readList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (!record) return [];
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.coaches)) return record.coaches;
  if (Array.isArray(record.athletes)) return record.athletes;
  if (Array.isArray(record.messages)) return record.messages;
  return [];
}

export type ChatDomain = string;

export type AthleteChatCoach = {
  coachProfileId: string;
  coachName: string;
  domain: ChatDomain;
};

export type CoachChatAthlete = {
  athleteProfileId: string;
  athleteName: string;
  domain: ChatDomain;
};

export type ChatConversationSummary = {
  conversationId: string;
  athleteName: string;
  coachName: string;
};

/** Coach page: backend infers the logged-in coach side. */
export type CoachChatConversationPayload = {
  athleteProfileId: string;
};

/** Athlete page: backend infers the logged-in athlete side. */
export type AthleteChatConversationPayload = {
  coachProfileId: string;
};

export type ChatConversationPayload =
  | CoachChatConversationPayload
  | AthleteChatConversationPayload;

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderRoleSnapshot: string;
  messageType: string;
  content: string;
  createdAt: string;
};

export function parseAthleteChatCoach(raw: unknown): AthleteChatCoach | null {
  const record = asRecord(raw);
  if (!record) return null;
  const coachProfileId = readString(record, ["coachProfileId"]);
  const coachName = readString(record, ["coachName"]);
  if (coachProfileId === "" || coachName === "") return null;
  return {
    coachProfileId,
    coachName,
    domain: readString(record, ["domain"]),
  };
}

export function parseCoachChatAthlete(raw: unknown): CoachChatAthlete | null {
  const record = asRecord(raw);
  if (!record) return null;
  const athleteProfileId = readString(record, ["athleteProfileId"]);
  const athleteName = readString(record, ["athleteName"]);
  if (athleteProfileId === "" || athleteName === "") return null;
  return {
    athleteProfileId,
    athleteName,
    domain: readString(record, ["domain"]),
  };
}

export function parseChatConversationSummary(
  data: unknown,
): ChatConversationSummary {
  const record = asRecord(data);
  if (!record) {
    throw {
      message: "Invalid chat conversation response body",
      status: 500,
      code: "CHAT_CONVERSATION_INVALID",
      details: data,
    };
  }
  const conversationId = readString(record, ["conversationId", "id"]);
  if (conversationId === "") {
    throw {
      message: "Chat conversation response did not include a conversation id",
      status: 500,
      code: "CHAT_CONVERSATION_ID_MISSING",
      details: data,
    };
  }
  return {
    conversationId,
    athleteName: readString(record, ["athleteName", "athleteDisplayName", "name"]),
    coachName: readString(record, ["coachName", "coachDisplayName"]),
  };
}

export function parseChatMessage(raw: unknown): ChatMessage | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readString(record, ["id", "messageId"]);
  const conversationId = readString(record, ["conversationId"]);
  const content = readString(record, ["content", "message"]);
  if (id === "" || conversationId === "" || content === "") return null;
  return {
    id,
    conversationId,
    senderUserId: readString(record, ["senderUserId", "userId"]),
    senderRoleSnapshot: readString(record, ["senderRoleSnapshot", "senderRole"]),
    messageType: readString(record, ["messageType", "type"]) || "TEXT",
    content,
    createdAt: readString(record, ["createdAt", "sentAt", "timestamp"]),
  };
}

export async function getAthleteChatCoaches(): Promise<AthleteChatCoach[]> {
  const raw = await apiRequest(paths.chat.athleteCoaches, {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return readList(data).reduce<AthleteChatCoach[]>((acc, item) => {
    const parsed = parseAthleteChatCoach(item);
    if (parsed) acc.push(parsed);
    return acc;
  }, []);
}

export async function getCoachChatAthletes(): Promise<CoachChatAthlete[]> {
  const raw = await apiRequest(paths.chat.coachAthletes, {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return readList(data).reduce<CoachChatAthlete[]>((acc, item) => {
    const parsed = parseCoachChatAthlete(item);
    if (parsed) acc.push(parsed);
    return acc;
  }, []);
}

export async function createOrFindChatConversation(
  payload: ChatConversationPayload,
): Promise<ChatConversationSummary> {
  if (process.env.NODE_ENV === "development") {
    console.debug("[Chat] POST /api/chat/conversations payload:", payload);
  }
  const raw = await apiRequest(paths.chat.conversations, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (process.env.NODE_ENV === "development") {
    console.debug("[Chat] POST /api/chat/conversations response:", raw);
  }
  const data = adaptBackendSuccess(raw);
  return parseChatConversationSummary(data);
}

export async function getChatMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const raw = await apiRequest(paths.chat.conversationMessages(conversationId), {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  return readList(data).reduce<ChatMessage[]>((acc, item) => {
    const parsed = parseChatMessage(item);
    if (parsed) acc.push(parsed);
    return acc;
  }, []);
}

function readNonNegInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

export async function getChatUnreadCount(): Promise<number> {
  const raw = await apiRequest(paths.chat.unreadCount, {
    method: "GET",
    cache: "no-store",
  });
  const data = adaptBackendSuccess(raw);
  const record = asRecord(data);
  if (!record) return 0;
  return readNonNegInt(record.unreadCount);
}
