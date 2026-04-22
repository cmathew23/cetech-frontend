/**
 * Logged-in user's entity invitations — GET /entities/invitations/me,
 * POST accept/decline (after adaptBackendSuccess).
 */

import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";

export type MyEntityInvitationRow = {
  id: string;
  entityId: string;
  entityName: string;
  role: string;
  status: string;
  createdAt: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readStr(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (typeof v !== "string") return "";
  return v.trim();
}

function parseInvitationRow(raw: unknown): MyEntityInvitationRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = readStr(o, "id");
  if (id === "") return null;
  return {
    id,
    entityId: readStr(o, "entityId"),
    entityName: readStr(o, "entityName"),
    role: readStr(o, "role"),
    status: readStr(o, "status"),
    createdAt: readStr(o, "createdAt"),
  };
}

export async function fetchMyEntityInvitations(): Promise<MyEntityInvitationRow[]> {
  const raw = await apiRequest(paths.entities.myInvitations, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  if (!Array.isArray(data)) {
    throw {
      message:
        "GET /entities/invitations/me: expected `data` to be an invitation array",
      status: 500,
      code: "ENTITY_MY_INVITATIONS_NOT_ARRAY",
      details: data,
    };
  }
  return data.reduce<MyEntityInvitationRow[]>((acc, row) => {
    const n = parseInvitationRow(row);
    if (n !== null) acc.push(n);
    return acc;
  }, []);
}

export async function acceptEntityInvitation(invitationId: string): Promise<void> {
  const id = invitationId.trim();
  if (id === "") {
    throw {
      message: "invitation id is required",
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

export async function declineEntityInvitation(invitationId: string): Promise<void> {
  const id = invitationId.trim();
  if (id === "") {
    throw {
      message: "invitation id is required",
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
