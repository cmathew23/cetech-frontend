"use client";

import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAthletePlanningIdentifiers } from "@/hooks/useAthletePlanningIdentifiers";
import {
  connectWearableProvider,
  fetchWearableConnections,
  fetchWearableProviders,
  formatWearableConnectionStatusLabel,
  isSafeWearableAuthorizationUrl,
  normalizeWearableProviderKey,
  openWearableAuthorizationInNewTab,
  refreshWearableConnection,
  type WearableConnection,
  type WearableProvider,
} from "@/lib/api/wearableConnections";
import { formatDateTime } from "@/lib/dateTime";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatHumanReadableOrCopy } from "@/lib/textFormat";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatApiError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

function isSafeProviderIconUrl(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="text-xs font-medium text-textMuted sm:w-56 sm:shrink-0">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm text-textPrimary">{value}</dd>
    </div>
  );
}

function ConnectionStatusBlock({ connection }: { connection: WearableConnection }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <dl className="space-y-2">
        <DetailRow
          label="Status"
          value={formatWearableConnectionStatusLabel(connection.status)}
        />
        <DetailRow
          label="Provider"
          value={formatHumanReadableOrCopy(connection.provider, "—")}
        />
        <DetailRow
          label="Last Sync"
          value={
            connection.lastSyncAt
              ? formatDateTime(connection.lastSyncAt, "—")
              : "—"
          }
        />
        <DetailRow
          label="Open Wearables Account"
          value={
            connection.openWearablesUserIdPresent === null
              ? "—"
              : connection.openWearablesUserIdPresent
                ? "Linked"
                : "Not linked"
          }
        />
      </dl>
    </div>
  );
}

function ProviderCard({
  provider,
  connection,
  connectBusy,
  refreshBusy,
  actionError,
  authorizationUrl,
  onConnect,
  onRefresh,
}: {
  provider: WearableProvider;
  connection: WearableConnection | null;
  connectBusy: boolean;
  refreshBusy: boolean;
  actionError: string | null;
  authorizationUrl: string | null;
  onConnect: () => void;
  onRefresh: () => void;
}) {
  const iconUrl = isSafeProviderIconUrl(provider.iconUrl) ? provider.iconUrl : null;

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-border bg-card object-contain"
            />
          ) : null}
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-textPrimary">{provider.name}</p>
            {provider.liveSyncMode ? (
              <p className="text-xs text-textMuted">
                Sync mode:{" "}
                {formatHumanReadableOrCopy(provider.liveSyncMode, provider.liveSyncMode)}
              </p>
            ) : null}
            {connection ? (
              <p className="text-xs text-textSecondary">
                Connection: {formatWearableConnectionStatusLabel(connection.status)}
              </p>
            ) : (
              <p className="text-xs text-textSecondary">No connection for this provider yet.</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {provider.connectSupported ? (
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button
                type="button"
                variant="primary"
                loading={connectBusy}
                disabled={connectBusy || refreshBusy}
                onClick={onConnect}
              >
                Connect
              </Button>
              {authorizationUrl && isSafeWearableAuthorizationUrl(authorizationUrl) ? (
                <a
                  href={authorizationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  Open authorization page
                </a>
              ) : null}
            </div>
          ) : (
            <Button type="button" variant="secondary" disabled>
              Mobile app required
            </Button>
          )}
          {connection ? (
            <Button
              type="button"
              variant="secondary"
              loading={refreshBusy}
              disabled={connectBusy || refreshBusy}
              onClick={onRefresh}
            >
              Refresh connection status
            </Button>
          ) : null}
        </div>
      </div>

      {!provider.connectSupported ? (
        <p className="mt-3 text-xs text-textMuted">
          {provider.disabledReason?.trim() !== ""
            ? provider.disabledReason
            : "This provider requires mobile app / SDK integration."}
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-3 text-xs text-danger">{actionError}</p>
      ) : null}
    </div>
  );
}

export function WearableConnectionsSettings() {
  const { accessContext, accessGateReady } = useAthleteInvitationGate();
  const planningIds = useAthletePlanningIdentifiers({ accessContext, accessGateReady });
  const entityId = planningIds.ids?.entityId ?? "";
  const athleteId = planningIds.ids?.athleteId ?? "";

  const [loading, setLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [providers, setProviders] = useState<WearableProvider[]>([]);
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
  const [authorizationUrlByProvider, setAuthorizationUrlByProvider] = useState<
    Record<string, string>
  >({});
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [refreshingConnectionId, setRefreshingConnectionId] = useState<string | null>(
    null,
  );
  const [cardActionError, setCardActionError] = useState<string | null>(null);
  const [activeCardProvider, setActiveCardProvider] = useState<string | null>(null);

  const canLoad =
    accessGateReady &&
    planningIds.phase === "ready" &&
    entityId !== "" &&
    athleteId !== "";

  const connectionsByProvider = useMemo(() => {
    const map = new Map<string, WearableConnection>();
    for (const connection of connections) {
      map.set(normalizeWearableProviderKey(connection.provider), connection);
    }
    return map;
  }, [connections]);

  const loadWearables = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setProvidersError(null);
    setConnectionsError(null);

    const [providersResult, connectionsResult] = await Promise.allSettled([
      fetchWearableProviders(entityId, athleteId),
      fetchWearableConnections(entityId, athleteId),
    ]);

    if (providersResult.status === "fulfilled") {
      setProviders(providersResult.value);
    } else {
      setProviders([]);
      setProvidersError(
        formatApiError(
          providersResult.reason,
          "Could not load wearable providers.",
        ),
      );
    }

    if (connectionsResult.status === "fulfilled") {
      setConnections(connectionsResult.value);
    } else {
      setConnections([]);
      setConnectionsError(
        formatApiError(
          connectionsResult.reason,
          "Could not load wearable connections.",
        ),
      );
    }

    setLoading(false);
  }, [athleteId, canLoad, entityId]);

  useEffect(() => {
    if (!canLoad) {
      setLoading(accessGateReady && planningIds.phase === "loading");
      setProviders([]);
      setConnections([]);
      return;
    }
    void loadWearables();
  }, [canLoad, accessGateReady, planningIds.phase, loadWearables, reloadKey]);

  const handleConnect = async (provider: WearableProvider) => {
    if (!canLoad) return;
    setActiveCardProvider(provider.provider);
    setCardActionError(null);
    setRedirectMessage(null);
    setConnectingProvider(provider.provider);
    const providerKey = normalizeWearableProviderKey(provider.provider);
    try {
      const result = await connectWearableProvider(
        entityId,
        athleteId,
        provider.provider,
      );
      if (
        result.authorizationUrl &&
        isSafeWearableAuthorizationUrl(result.authorizationUrl)
      ) {
        setAuthorizationUrlByProvider((prev) => ({
          ...prev,
          [providerKey]: result.authorizationUrl!,
        }));
        openWearableAuthorizationInNewTab(result.authorizationUrl);
        setRedirectMessage(
          "Authorization opened in a new tab. You can also right-click “Open authorization page” below if the tab did not open.",
        );
        return;
      }
      await loadWearables();
    } catch (e) {
      setCardActionError(
        formatApiError(e, "Could not start provider connection."),
      );
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleRefresh = async (connection: WearableConnection) => {
    if (!canLoad) return;
    setActiveCardProvider(connection.provider);
    setCardActionError(null);
    setRefreshingConnectionId(connection.connectionId);
    try {
      await refreshWearableConnection(
        entityId,
        athleteId,
        connection.connectionId,
      );
      const nextConnections = await fetchWearableConnections(entityId, athleteId);
      setConnections(nextConnections);
      setConnectionsError(null);
    } catch (e) {
      setCardActionError(
        formatApiError(e, "Could not refresh connection status."),
      );
    } finally {
      setRefreshingConnectionId(null);
    }
  };

  if (!accessGateReady || planningIds.phase === "loading") {
    return (
      <DashboardCardShell majorOuter title="Wearables / Connected Devices">
        <p className="text-sm text-textSecondary">Loading wearable settings…</p>
      </DashboardCardShell>
    );
  }

  if (planningIds.phase === "not_ready" || entityId === "" || athleteId === "") {
    return (
      <DashboardCardShell majorOuter title="Wearables / Connected Devices">
        <Alert variant="warning">
          Wearable connection settings are unavailable until your athlete profile
          and academy context are ready.
        </Alert>
      </DashboardCardShell>
    );
  }

  return (
    <DashboardCardShell
      majorOuter
      title="Wearables / Connected Devices"
      subtitle="Connect supported cloud providers. Mobile-only providers require the CETECH mobile app."
    >
      <div className="space-y-4">
        {redirectMessage ? (
          <Alert variant="success">{redirectMessage}</Alert>
        ) : null}
        {providersError ? <Alert variant="danger">{providersError}</Alert> : null}
        {connectionsError ? (
          <Alert variant="warning">{connectionsError}</Alert>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-textSecondary">
            Current connection status
          </h3>
          {loading ? (
            <p className="text-sm text-textSecondary">Loading connections…</p>
          ) : connections.length === 0 ? (
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-sm text-textPrimary">Not Connected</p>
              <p className="mt-1 text-xs text-textMuted">
                Connect a supported provider below to link your wearable data.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((connection) => (
                <ConnectionStatusBlock
                  key={connection.connectionId}
                  connection={connection}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-textSecondary">
            Available providers
          </h3>
          {loading ? (
            <p className="text-sm text-textSecondary">Loading providers…</p>
          ) : providersError ? null : providers.length === 0 ? (
            <p className="text-sm text-textSecondary">No wearable providers available.</p>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => {
                const connection =
                  connectionsByProvider.get(
                    normalizeWearableProviderKey(provider.provider),
                  ) ?? null;
                const isActiveCard =
                  activeCardProvider !== null &&
                  normalizeWearableProviderKey(activeCardProvider) ===
                    normalizeWearableProviderKey(provider.provider);
                return (
                  <ProviderCard
                    key={provider.provider}
                    provider={provider}
                    connection={connection}
                    connectBusy={connectingProvider === provider.provider}
                    refreshBusy={
                      connection !== null &&
                      refreshingConnectionId === connection.connectionId
                    }
                    actionError={isActiveCard ? cardActionError : null}
                    authorizationUrl={
                      authorizationUrlByProvider[
                        normalizeWearableProviderKey(provider.provider)
                      ] ?? null
                    }
                    onConnect={() => void handleConnect(provider)}
                    onRefresh={() => {
                      if (connection) void handleRefresh(connection);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => setReloadKey((value) => value + 1)}
        >
          Reload providers and connections
        </Button>
      </div>
    </DashboardCardShell>
  );
}
