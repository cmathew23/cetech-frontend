"use client";

import {
  acceptEntityInvitation,
  declineEntityInvitation,
  fetchMyEntityInvitations,
  type MyEntityInvitationRow,
} from "@/lib/api/entityInvitationsMe";
import { useAuth, type AuthSessionResult } from "@/hooks/useAuth";
import { isNormalizedApiError } from "@/lib/apiClient";
import {
  bootstrapAthleteRequiresInvitationInbox,
  type AccessContextPayload,
} from "@/lib/accessContext";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

function isPendingStatus(status: string): boolean {
  return status.trim().toUpperCase() === "PENDING";
}

type AthleteInvitationContextValue = {
  invitations: MyEntityInvitationRow[];
  loading: boolean;
  loadError: string | null;
  refreshInvitations: () => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<AuthSessionResult | null>;
  declineInvitation: (invitationId: string) => Promise<void>;
  isGateReady: boolean;
  /** True when GET /me/app-context reports an active academy membership. */
  hasActiveAcademyMembership: boolean;
  /** Invitation-locked athlete state from GET /me/app-context. */
  invitationAccessLocked: boolean;
  hasPendingInvitations: boolean;
  pendingCount: number;
  /** Shared auth state — avoids redundant useAuth() bootstraps in child hooks. */
  accessContext: AccessContextPayload | null;
  /** Shared auth gate readiness from the single provider-level useAuth() instance. */
  accessGateReady: boolean;
};

const AthleteInvitationContext =
  createContext<AthleteInvitationContextValue | null>(null);

function formatLoadError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

export function AthleteInvitationProvider({ children }: { children: ReactNode }) {
  const { accessContext, accessGateReady, refreshSession } = useAuth();
  const [invitations, setInvitations] = useState<MyEntityInvitationRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshInvitations = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await fetchMyEntityInvitations();
      setInvitations(rows);
    } catch (e) {
      setLoadError(formatLoadError(e, "Could not load invitations."));
      setInvitations([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      const invResult = await fetchMyEntityInvitations().then(
        (rows) => ({ ok: true as const, rows }),
        (e) => ({ ok: false as const, e }),
      );
      if (cancelled) return;
      if (invResult.ok) {
        setInvitations(invResult.rows);
      } else {
        setLoadError(formatLoadError(invResult.e, "Could not load invitations."));
        setInvitations([]);
      }
      setInitialLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      await acceptEntityInvitation(invitationId);
      const [, session] = await Promise.all([refreshInvitations(), refreshSession()]);
      return session;
    },
    [refreshInvitations, refreshSession],
  );

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      await declineEntityInvitation(invitationId);
      await Promise.all([refreshInvitations(), refreshSession()]);
    },
    [refreshInvitations, refreshSession],
  );

  const hasActiveAcademyMembership = accessContext?.academy.hasMembership === true;

  const invitationAccessLocked = useMemo(
    () => bootstrapAthleteRequiresInvitationInbox(accessContext),
    [accessContext],
  );

  const hasPendingInvitations = useMemo(
    () => invitations.some((i) => isPendingStatus(i.status)),
    [invitations],
  );

  const pendingCount = useMemo(
    () => invitations.filter((i) => isPendingStatus(i.status)).length,
    [invitations],
  );

  const isGateReady = !initialLoading && accessGateReady;

  const value = useMemo(
    () => ({
      invitations,
      loading: initialLoading,
      loadError,
      refreshInvitations,
      acceptInvitation,
      declineInvitation,
      isGateReady,
      hasActiveAcademyMembership,
      invitationAccessLocked,
      hasPendingInvitations,
      pendingCount,
      accessContext: accessContext ?? null,
      accessGateReady,
    }),
    [
      invitations,
      initialLoading,
      loadError,
      refreshInvitations,
      acceptInvitation,
      declineInvitation,
      isGateReady,
      hasActiveAcademyMembership,
      invitationAccessLocked,
      hasPendingInvitations,
      pendingCount,
      accessContext,
      accessGateReady,
    ],
  );

  return (
    <AthleteInvitationContext.Provider value={value}>
      {children}
    </AthleteInvitationContext.Provider>
  );
}

export function useAthleteInvitationGate(): AthleteInvitationContextValue {
  const ctx = useContext(AthleteInvitationContext);
  if (!ctx) {
    throw new Error(
      "useAthleteInvitationGate must be used within AthleteInvitationProvider",
    );
  }
  return ctx;
}

export type { MyEntityInvitationRow };
