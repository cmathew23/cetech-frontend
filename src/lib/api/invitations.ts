import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

export type MyPendingInvitation = {
  invitationId: string;
  entityName: string;
  role: string;
  status: string;
  createdAt: string;
  inviter: string;
};

function assertMyInvitationsArrayAfterUnwrap(data: unknown): unknown[] {
  if (!Array.isArray(data)) {
    throw {
      message:
        "My invitations response must be a JSON array after unwrap (expected envelope data array)",
      status: 500,
      code: "MY_INVITATIONS_NOT_ARRAY",
      details: data,
    };
  }
  return data;
}

function firstNonEmptyString(
  source: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
}

function formatTimestamp(value: unknown): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return "—";
}

function normalizeMyPendingInvitation(raw: unknown): MyPendingInvitation | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;

  const invitationId = firstNonEmptyString(o, ["id", "invitationId"]);
  if (invitationId === "") return null;

  const entity =
    o.entity && typeof o.entity === "object" && !Array.isArray(o.entity)
      ? (o.entity as Record<string, unknown>)
      : null;
  const academy =
    o.academy && typeof o.academy === "object" && !Array.isArray(o.academy)
      ? (o.academy as Record<string, unknown>)
      : null;

  const entityNameRaw =
    firstNonEmptyString(o, ["email", "inviteeEmail", "entityName", "academyName", "name"]) ||
    (entity ? firstNonEmptyString(entity, ["name"]) : "") ||
    (academy ? firstNonEmptyString(academy, ["name"]) : "");

  const role = firstNonEmptyString(o, ["role"]) || "—";
  const status = firstNonEmptyString(o, ["status"]) || "—";
  const createdAt = formatTimestamp(o.createdAt ?? o.invitedAt);
  const invitedBy =
    firstNonEmptyString(o, ["invitedBy", "invitedByEmail", "inviterEmail"]) ||
    (typeof o.invitedByUserId === "string" && o.invitedByUserId.trim() !== ""
      ? `User ${o.invitedByUserId.trim()}`
      : "");

  return {
    invitationId,
    entityName: entityNameRaw !== "" ? entityNameRaw : "—",
    role,
    status,
    createdAt,
    inviter: invitedBy !== "" ? invitedBy : "—",
  };
}

/** GET /entities/invitations/me — pending invitations for authenticated user. */
export async function fetchMyInvitations(): Promise<MyPendingInvitation[]> {
  const raw = await apiRequest(paths.entities.myInvitations, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  const list = assertMyInvitationsArrayAfterUnwrap(data);
  return list.reduce<MyPendingInvitation[]>((acc, row) => {
    const normalized = normalizeMyPendingInvitation(row);
    if (normalized !== null) acc.push(normalized);
    return acc;
  }, []);
}

/** POST /entities/invitations/:id/accept — trainingEntity.routes.js (InvitationController). */
export async function acceptInvitation(invitationId: string): Promise<void> {
  const id = invitationId.trim();
  if (!id) {
    throw {
      message: "Invitation id is required",
      status: 400,
      code: "INVITATION_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.acceptInvitation(id), {
    method: "POST",
    body: JSON.stringify({}),
  });
  adaptBackendSuccess(raw);
}

/** POST /entities/invitations/:id/decline — invited-user decline action. */
export async function declineInvitation(invitationId: string): Promise<void> {
  const id = invitationId.trim();
  if (!id) {
    throw {
      message: "Invitation id is required",
      status: 400,
      code: "INVITATION_ID_REQUIRED",
    };
  }
  const raw = await apiRequest(paths.entities.declineInvitation(id), {
    method: "POST",
    body: JSON.stringify({}),
  });
  adaptBackendSuccess(raw);
}
