import { paths } from "@/config/endpoints";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";
import { apiRequest } from "@/lib/apiClient";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function assertIds(entityId: string, athleteId: string): { entityId: string; athleteId: string } {
  const e = entityId.trim();
  const a = athleteId.trim();
  if (e === "" || a === "") {
    throw {
      message: "Entity and athlete identifiers are required.",
      status: 400,
    };
  }
  return { entityId: e, athleteId: a };
}

function unwrapArray(payload: unknown, listKeys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of listKeys) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested;
  }
  const data = asRecord(record.data);
  if (data) {
    for (const key of listKeys) {
      const nested = data[key];
      if (Array.isArray(nested)) return nested;
    }
  }
  return [];
}

export type WearableConnectionMode = "CLOUD_OAUTH" | "MOBILE_SDK_REQUIRED" | string;

export type WearableProvider = {
  provider: string;
  name: string;
  iconUrl: string | null;
  liveSyncMode: string | null;
  connectSupported: boolean;
  connectionMode: WearableConnectionMode | null;
  disabledReason: string | null;
};

export type WearableConnection = {
  connectionId: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  openWearablesUserIdPresent: boolean | null;
};

export type WearableConnectResult = {
  authorizationUrl: string | null;
};

function parseWearableProvider(raw: unknown): WearableProvider | null {
  const record = asRecord(raw);
  if (!record) return null;

  const provider =
    readString(record.provider) ||
    readString(record.providerId) ||
    readString(record.slug) ||
    readString(record.id);
  if (provider === "") return null;

  const name =
    readString(record.name) ||
    readString(record.displayName) ||
    readString(record.label) ||
    provider;

  const connectSupported = readBoolean(record.connectSupported) ?? false;
  const connectionModeRaw =
    readString(record.connectionMode) || readString(record.connection_mode);
  const connectionMode = connectionModeRaw !== "" ? connectionModeRaw : null;

  const iconUrlRaw =
    readString(record.icon_url) ||
    readString(record.iconUrl) ||
    readString(record.logoUrl);
  const iconUrl = iconUrlRaw !== "" ? iconUrlRaw : null;

  const liveSyncMode =
    readString(record.live_sync_mode) ||
    readString(record.liveSyncMode) ||
    null;

  const disabledReason =
    readString(record.disabledReason) ||
    readString(record.disabled_reason) ||
    null;

  return {
    provider,
    name,
    iconUrl,
    liveSyncMode: liveSyncMode !== "" ? liveSyncMode : null,
    connectSupported,
    connectionMode,
    disabledReason: disabledReason !== "" ? disabledReason : null,
  };
}

function parseWearableConnection(raw: unknown): WearableConnection | null {
  const record = asRecord(raw);
  if (!record) return null;

  const connectionId =
    readString(record.connectionId) ||
    readString(record.connection_id) ||
    readString(record.id);
  if (connectionId === "") return null;

  const provider =
    readString(record.provider) ||
    readString(record.providerId) ||
    readString(record.providerSlug);
  if (provider === "") return null;

  const status =
    readString(record.status) ||
    readString(record.connectionStatus) ||
    "NOT_CONNECTED";

  const lastSyncAt =
    readString(record.lastSyncAt) ||
    readString(record.last_sync_at) ||
    readString(record.lastSync) ||
    null;

  const openWearablesUserIdPresent =
    readBoolean(record.openWearablesUserIdPresent) ??
    readBoolean(record.open_wearables_user_id_present) ??
    (readString(record.openWearablesUserId) !== "" ? true : null);

  return {
    connectionId,
    provider,
    status,
    lastSyncAt: lastSyncAt !== "" ? lastSyncAt : null,
    openWearablesUserIdPresent,
  };
}

function parseWearableConnectResult(payload: unknown): WearableConnectResult {
  const unwrapped = adaptBackendSuccess(payload);
  const record = asRecord(unwrapped) ?? asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  const source = nested ?? record ?? {};
  const authorizationUrl =
    readString(source.authorizationUrl) ||
    readString(source.authorization_url) ||
    readString(source.redirectUrl) ||
    "";
  return {
    authorizationUrl: authorizationUrl !== "" ? authorizationUrl : null,
  };
}

export function formatWearableConnectionStatusLabel(status: string): string {
  const normalized = status.trim().toUpperCase().replace(/\s+/g, "_");
  switch (normalized) {
    case "CONNECTED":
      return "Connected";
    case "PENDING":
      return "Pending";
    case "DISCONNECTED":
      return "Disconnected";
    case "NOT_CONNECTED":
    case "NONE":
    case "":
      return "Not Connected";
    default:
      return status.trim() !== "" ? status.trim() : "Not Connected";
  }
}

export function normalizeWearableProviderKey(value: string): string {
  return value.trim().toLowerCase();
}

/** Only http(s) authorization URLs from CETECH connect may be opened in the browser. */
export function isSafeWearableAuthorizationUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Opens provider OAuth in a new tab; returns false if blocked or URL is unsafe. */
export function openWearableAuthorizationInNewTab(url: string): boolean {
  if (!isSafeWearableAuthorizationUrl(url)) return false;
  if (typeof window === "undefined") return false;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return opened !== null;
}

export async function fetchWearableProviders(
  entityId: string,
  athleteId: string,
): Promise<WearableProvider[]> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteWearableProviders(ids.entityId, ids.athleteId),
    { method: "GET", cache: "no-store" },
  );
  const data = adaptBackendSuccess(raw);
  return unwrapArray(data, ["providers", "items"])
    .map(parseWearableProvider)
    .filter((row): row is WearableProvider => row !== null);
}

export async function fetchWearableConnections(
  entityId: string,
  athleteId: string,
): Promise<WearableConnection[]> {
  const ids = assertIds(entityId, athleteId);
  const raw = await apiRequest(
    paths.entities.athleteWearableConnections(ids.entityId, ids.athleteId),
    { method: "GET", cache: "no-store" },
  );
  const data = adaptBackendSuccess(raw);
  return unwrapArray(data, ["connections", "items"])
    .map(parseWearableConnection)
    .filter((row): row is WearableConnection => row !== null);
}

export async function connectWearableProvider(
  entityId: string,
  athleteId: string,
  provider: string,
): Promise<WearableConnectResult> {
  const ids = assertIds(entityId, athleteId);
  const providerKey = provider.trim();
  if (providerKey === "") {
    throw { message: "Provider is required.", status: 400 };
  }
  const raw = await apiRequest(
    paths.entities.athleteWearableConnect(ids.entityId, ids.athleteId),
    {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify({ provider: providerKey }),
    },
  );
  return parseWearableConnectResult(raw);
}

export async function refreshWearableConnection(
  entityId: string,
  athleteId: string,
  connectionId: string,
): Promise<void> {
  const ids = assertIds(entityId, athleteId);
  const id = connectionId.trim();
  if (id === "") {
    throw { message: "Connection id is required.", status: 400 };
  }
  await apiRequest(
    paths.entities.athleteWearableConnectionRefresh(
      ids.entityId,
      ids.athleteId,
      id,
    ),
    { method: "POST", cache: "no-store" },
  );
}
