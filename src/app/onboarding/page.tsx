"use client";

import { AccessGateLoadingState } from "@/components/access/AccessGateLoadingState";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { designSystem } from "@/config/design-system";
import { AcademyAdminSetupForm } from "@/components/onboarding/AcademyAdminSetupForm";
import { createEntity, type CreateEntityPayload } from "@/lib/api/entities";
import {
  submitAcademySetup as submitAcademySetupApi,
  type AthleteProfilePayload,
  type CoachProfilePayload,
  type AcademySetupPayload,
} from "@/lib/api/onboarding";
import { ATHLETE_LEVELS } from "@/lib/athlete-levels";
import { type ParsedOnboardingStatus } from "@/lib/onboarding-status";
import { SPORT_VALUES } from "@/lib/sports";
import { useAuth } from "@/hooks/useAuth";
import { routeFromAccessContext } from "@/lib/accessContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { RegistrationRole } from "@/types/auth.types";
import type { OnboardingStatusEnum } from "@/types/onboarding.types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

/**
 * Role selection for `ROLE_SELECTION_REQUIRED` — must match registration (`register/page.tsx`):
 * ATHLETE, COACH, ACADEMY_ADMIN. Separate concerns: (1) which role is selected here,
 * (2) post-login / post-onboarding destination (`@/lib/post-login-route` + guard),
 * (3) academy creation for ACADEMY_ADMIN only via POST /onboarding/academy-setup (not role selection).
 */
const ROLE_OPTIONS = ["ATHLETE", "COACH", "ACADEMY_ADMIN"] as const satisfies readonly RegistrationRole[];
type OnboardingRoleChoice = (typeof ROLE_OPTIONS)[number];

/** TrainingEntityType values used in athlete onboarding entity creation. */
const ONBOARDING_ENTITY_TYPE = {
  ATHLETE_GROUP: "ATHLETE_GROUP",
} as const;

function onboardingPageTitle(
  phase: OnboardingStatusEnum,
  parsed: ParsedOnboardingStatus,
): string {
  switch (phase) {
    case "ROLE_SELECTION_REQUIRED":
      return "Choose your role";
    case "PROFILE_REQUIRED":
      if (parsed.activeOnboardingRole === "ATHLETE") return "Athlete profile";
      if (parsed.activeOnboardingRole === "COACH") return "Coach profile";
      return "Complete your profile";
    case "ENTITY_ACTION_REQUIRED":
      if (parsed.activeOnboardingRole === "ATHLETE") {
        return "Connect as an athlete";
      }
      return "Finish onboarding";
    case "INVITE_PENDING_ACTION":
      return "Invitations";
    case "WAITING_FOR_INVITE":
      if (parsed.activeOnboardingRole === "COACH") {
        return "Waiting for academy invite";
      }
      return "Invitations";
    case "ACADEMY_SETUP_REQUIRED":
      return "Academy setup";
    case "COMPLETE":
      return "Onboarding complete";
    default:
      return "Onboarding";
  }
}

function getErrMessage(e: unknown): string {
  if (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  return "Something went wrong";
}

/** Short page-level context; does not drive routing (backend status does). */
function onboardingContextMessage(
  phase: OnboardingStatusEnum,
  parsed: ParsedOnboardingStatus,
): string {
  switch (phase) {
    case "ROLE_SELECTION_REQUIRED":
      return "Choose how you will use PEAKFLOW. You can continue setup right after you pick a role.";
    case "PROFILE_REQUIRED":
      if (parsed.activeOnboardingRole === "ATHLETE") {
        return "Add the details below to finish your athlete profile. Your dashboard stays unavailable until onboarding is complete.";
      }
      if (parsed.activeOnboardingRole === "COACH") {
        return "Create your coach profile below. Your coach dashboard stays unavailable until onboarding is complete.";
      }
      return "Resolve the message below to continue onboarding.";
    case "ENTITY_ACTION_REQUIRED":
      if (parsed.activeOnboardingRole === "ATHLETE") {
        return "Choose whether to join an academy or coach (invitation), or create a personal athlete workspace.";
      }
      return "This step is now athlete-only. Please refresh your onboarding status.";
    case "INVITE_PENDING_ACTION":
      return "Review your invitations below and accept or decline directly.";
    case "WAITING_FOR_INVITE":
      if (parsed.activeOnboardingRole === "COACH") {
        return "";
      }
      return "You can accept or decline invitations directly below as they arrive.";
    case "ACADEMY_SETUP_REQUIRED":
      return "Provide your academy details. Your admin dashboard opens only after the server creates your academy and membership.";
    default:
      return "";
  }
}

function RoleSelectionPanel({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (role: OnboardingRoleChoice) => void;
}) {
  return (
    <Stack spacing="md">
      <Heading variant="h3">Choose your role</Heading>
      <p className={designSystem.typography.muted}>
        Select how you will use PEAKFLOW for this account.
      </p>
      <Stack spacing="sm">
        {ROLE_OPTIONS.map((r) => (
          <Button
            key={r}
            type="button"
            variant="primary"
            disabled={disabled}
            className="w-full md:w-auto"
            onClick={() => onSelect(r)}
          >
            {r.replace("_", " ")}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}

function AthleteProfileForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (payload: AthleteProfilePayload) => Promise<void>;
}) {
  const [sport, setSport] = useState("");
  const [level, setLevel] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: AthleteProfilePayload = { sport };
    if (level.trim() !== "") {
      payload.level = level;
    }
    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormSection>
        <Heading variant="h3">Create your athlete profile</Heading>
        <p className={designSystem.typography.muted}>
          Sport is required. Level is optional but helps tailor your experience.
        </p>
        <FormField id="athlete-sport" label="Sport" required>
          <Select
            id="athlete-sport"
            name="sport"
            required
            value={sport}
            disabled={disabled}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSport(e.target.value)
            }
          >
            <option value="">Select a sport</option>
            {SPORT_VALUES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          id="athlete-level"
          label="Level"
          helperText="Optional. Matches server AthleteLevel values."
        >
          <Select
            id="athlete-level"
            name="level"
            value={level}
            disabled={disabled}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setLevel(e.target.value)
            }
          >
            <option value="">—</option>
            {ATHLETE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0) + l.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </FormField>
        <div className={designSystem.layout.registerForm.actions}>
          <Button
            type="submit"
            variant="primary"
            loading={disabled}
            className="w-full md:w-auto"
          >
            Save and continue
          </Button>
        </div>
      </FormSection>
    </form>
  );
}

function CoachProfileForm({
  disabled,
  showAcademyIdField,
  onSubmit,
}: {
  disabled: boolean;
  showAcademyIdField: boolean;
  onSubmit: (payload: CoachProfilePayload) => Promise<void>;
}) {
  const [academyId, setAcademyId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = academyId.trim();
    await onSubmit(trimmed ? { academyId: trimmed } : {});
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormSection>
        <Heading variant="h3">Create your coach profile</Heading>
        <p className={designSystem.typography.muted}>
          {showAcademyIdField
            ? "Invite-based setup detected (pending invitations on your account). Enter the academy UUID only if your organization shared one with you."
            : "Complete your coach profile to finish onboarding and continue to your dashboard."}
        </p>
        {showAcademyIdField ? (
          <FormField
            id="coach-academy"
            label="Academy ID"
            helperText="UUID from the academy that invited you, if applicable."
          >
            <Input
              id="coach-academy"
              name="academyId"
              value={academyId}
              disabled={disabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAcademyId(e.target.value)
              }
            />
          </FormField>
        ) : null}
        <div className={designSystem.layout.registerForm.actions}>
          <Button
            type="submit"
            variant="primary"
            loading={disabled}
            className="w-full md:w-auto"
          >
            Create coach profile
          </Button>
        </div>
      </FormSection>
    </form>
  );
}

type AthleteEntityStep = "choose" | "join" | "independent";

function AthleteEntityActionPanel({
  disabled,
  onCreate,
  onRefreshOnly,
}: {
  disabled: boolean;
  onCreate: (payload: CreateEntityPayload) => Promise<void>;
  onRefreshOnly: () => Promise<void>;
}) {
  const [step, setStep] = useState<AthleteEntityStep>("choose");
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    console.info(
      "[PEAKFLOW onboarding] Athlete ENTITY_ACTION_REQUIRED step is active. If you never see this screen, the backend is not returning onboardingStatus=ENTITY_ACTION_REQUIRED with activeOnboardingRole=ATHLETE.",
    );
  }, []);

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = workspaceName.trim();
    if (!trimmed) return;
    await onCreate({
      name: trimmed,
      type: ONBOARDING_ENTITY_TYPE.ATHLETE_GROUP,
    });
  }

  if (step === "choose") {
    return (
      <Stack spacing="md">
        <Heading variant="h3">How do you want to connect?</Heading>
        <p className={designSystem.typography.muted}>
          Join an existing academy or coach with an invitation, or create your
          own athlete workspace if you work independently first.
        </p>
        <Stack spacing="sm">
          <Button
            type="button"
            variant="primary"
            disabled={disabled}
            className="w-full md:w-auto"
            onClick={() => setStep("join")}
          >
            Join an academy or coach
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            className="w-full md:w-auto"
            onClick={() => setStep("independent")}
          >
            Independent athlete
          </Button>
        </Stack>
      </Stack>
    );
  }

  if (step === "join") {
    return (
      <Stack spacing="md">
        <Button
          type="button"
          variant="neutral"
          disabled={disabled}
          className="w-full md:w-auto"
          onClick={() => setStep("choose")}
        >
          Back
        </Button>
        <Heading variant="h3">Join an academy or coach</Heading>
        <p className={designSystem.typography.body}>
          This path is invitation-only: an academy or coach must invite you. When
          you accept, your onboarding status will move forward—nothing is created
          on this screen.
        </p>
        <p className={designSystem.typography.muted}>
          If you already have a pending invitation, your status may switch to
          pending-invite actions. Otherwise stay in touch with your organization
          and refresh after they send an invite.
        </p>
        <Button
          type="button"
          variant="primary"
          disabled={disabled}
          className="w-full md:w-auto"
          onClick={() => onRefreshOnly()}
        >
          Refresh onboarding status
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing="md">
      <Button
        type="button"
        variant="neutral"
        disabled={disabled}
        className="w-full md:w-auto"
        onClick={() => setStep("choose")}
      >
        Back
      </Button>
      <form onSubmit={handleCreateWorkspace}>
        <FormSection>
          <Heading variant="h3">Create your athlete workspace</Heading>
          <Alert variant="warning">
            Many backends still respond with <strong>403 Forbidden</strong> when
            an athlete calls create-entity. That is normal until the API allows
            athlete-created workspaces. Onboarding status is unchanged after a
            failed attempt—you can fix the name and retry, go back to join via
            invitation, or contact support.
          </Alert>
          <p className={designSystem.typography.muted}>
            Creates an athlete workspace for organizing your training and
            working with multiple coaches without joining an academy first. The
            workspace type is fixed for this step.
          </p>
          <FormField
            id="athlete-workspace-name"
            label="Workspace name"
            required
          >
            <Input
              id="athlete-workspace-name"
              name="workspaceName"
              required
              value={workspaceName}
              disabled={disabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setWorkspaceName(e.target.value)
              }
            />
          </FormField>
          <div className={designSystem.layout.registerForm.actions}>
            <Button
              type="submit"
              variant="primary"
              loading={disabled}
              className="w-full md:w-auto"
            >
              Create athlete workspace
            </Button>
          </div>
        </FormSection>
      </form>
    </Stack>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { refreshSession, accessContext, accessGateReady } = useAuth();
  /** Avoid duplicate refresh/replace when `refreshSession` updates roles and re-runs this effect. */
  const dashboardRedirectInFlightRef = useRef(false);
  const {
    onboardingData,
    onboardingStatus,
    loading: onboardingLoading,
    error: onboardingError,
    fetchStatus,
    selectRole,
    submitAthleteProfile,
    submitCoachProfile,
    getNextRoute,
  } = useOnboarding();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  /**
   * Intentional MVP split:
   * - useOnboarding owns backend-driven status/next-step + role/profile actions.
   * - This page orchestrates athlete entity creation, invitation acceptance, and logout,
   *   which are tightly coupled to page-only UI branching.
   */

  useEffect(() => {
    if (!onboardingData || !accessGateReady) return;
    const ctxFromAuth = accessContext;
    const appContextRoute = routeFromAccessContext(ctxFromAuth);

    // App-context is the single routing source of truth once bootstrap finishes.
    if (appContextRoute) {
      if (appContextRoute !== "/onboarding") {
        router.replace(appContextRoute);
      }
      return;
    }

    if (onboardingData.onboardingStatus === "COMPLETE") {
      if (dashboardRedirectInFlightRef.current) return;
      dashboardRedirectInFlightRef.current = true;
      void (async () => {
        const session = await refreshSession();
        const nextRoute = routeFromAccessContext(session?.accessContext);
        if (nextRoute && nextRoute !== "/onboarding") {
          router.replace(nextRoute);
          return;
        }
        dashboardRedirectInFlightRef.current = false;
      })();
      return;
    }

    const nextRoute = getNextRoute();
    if (nextRoute !== "/dashboard") return;

    if (dashboardRedirectInFlightRef.current) return;
    dashboardRedirectInFlightRef.current = true;
    void (async () => {
      const session = await refreshSession();
      const resolvedRoute = routeFromAccessContext(session?.accessContext);
      if (!resolvedRoute || resolvedRoute === "/onboarding") {
        dashboardRedirectInFlightRef.current = false;
        return;
      }
      router.replace(resolvedRoute);
    })();
  }, [
    accessContext,
    accessGateReady,
    getNextRoute,
    onboardingData,
    refreshSession,
    router,
  ]);

  async function runAction(
    fn: () => Promise<unknown>,
    options?: { refreshAfter?: boolean },
  ) {
    setActionLoading(true);
    setActionError(null);
    try {
      await fn();
      if (options?.refreshAfter) {
        await fetchStatus();
      }
    } catch (e) {
      setActionError(getErrMessage(e));
    } finally {
      setActionLoading(false);
    }
  }

  function refreshOnly() {
    return runAction(() => fetchStatus());
  }

  async function handleProfileSubmit<Payload>(
    submit: (payload: Payload) => Promise<ParsedOnboardingStatus>,
    payload: Payload,
  ) {
    setActionLoading(true);
    setActionError(null);
    try {
      await submit(payload);
      const session = await refreshSession();
      const nextRoute = routeFromAccessContext(session?.accessContext);
      if (nextRoute && nextRoute !== "/onboarding") {
        router.replace(nextRoute);
      }
    } catch (e) {
      setActionError(getErrMessage(e));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAcademyAdminSetupSubmit(payload: AcademySetupPayload) {
    setActionLoading(true);
    setActionError(null);
    try {
      await submitAcademySetupApi(payload);
      await fetchStatus();
      const session = await refreshSession();
      const path = routeFromAccessContext(session?.accessContext);
      if (path && path !== "/onboarding") {
        router.replace(path);
      } else {
        setActionError(
          "Academy setup finished, but dashboard access is not yet ready in app context. Please retry.",
        );
      }
    } catch (e) {
      setActionError(getErrMessage(e));
    } finally {
      setActionLoading(false);
    }
  }

  if (!accessGateReady || (onboardingLoading && !onboardingData)) {
    return <AccessGateLoadingState label="Loading access..." />;
  }

  if (!onboardingStatus || !onboardingData) {
    return (
      <Stack spacing="md">
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
        {!actionError && onboardingError ? (
          <Alert variant="danger">{onboardingError.message}</Alert>
        ) : null}
        <Alert variant="warning">
          Unable to read onboarding status from the server. Please try again.
        </Alert>
        <Button
          type="button"
          variant="primary"
          onClick={() => void fetchStatus()}
        >
          Retry
        </Button>
      </Stack>
    );
  }

  const busy = actionLoading || onboardingLoading;
  const phase = onboardingStatus;
  const parsed = onboardingData;
  const appContextRoute = accessGateReady ? routeFromAccessContext(accessContext) : null;
  /** While COMPLETE, hide chrome only when navigating to a non-onboarding destination. */
  const completeRedirecting =
    appContextRoute != null && appContextRoute !== "/onboarding";
  const contextMessage = onboardingContextMessage(phase, onboardingData);

  // Keep redirect-only phases silent to avoid transient onboarding flash before final destination.
  if (completeRedirecting) {
    return (
      <AccessGateLoadingState
        label="Resolving access..."
        minHeightClassName="min-h-[20vh]"
      />
    );
  }

  return (
    <Stack spacing="lg">
      {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
      {!actionError && onboardingError ? (
        <Alert variant="danger">{onboardingError.message}</Alert>
      ) : null}

      <Stack spacing="sm">
        <Heading variant="h2">
          {onboardingPageTitle(phase, parsed)}
        </Heading>
        {contextMessage ? (
          <p className={designSystem.typography.muted}>{contextMessage}</p>
        ) : null}
      </Stack>

      {phase === "ACADEMY_SETUP_REQUIRED" ? (
        parsed.activeOnboardingRole === "ACADEMY_ADMIN" ? (
          <AcademyAdminSetupForm
            disabled={busy}
            onSubmit={(p) => handleAcademyAdminSetupSubmit(p)}
          />
        ) : (
          <Alert variant="danger">
            Invalid onboarding state for academy setup. Please refresh or contact
            support.
          </Alert>
        )
      ) : null}

      {phase === "ROLE_SELECTION_REQUIRED" ? (
        <RoleSelectionPanel
          disabled={busy}
          onSelect={(role) => runAction(() => selectRole(role))}
        />
      ) : null}

      {phase === "PROFILE_REQUIRED" ? (
        parsed.activeOnboardingRole === "ATHLETE" ? (
          <AthleteProfileForm
            disabled={busy}
            onSubmit={(payload) =>
              handleProfileSubmit(submitAthleteProfile, payload)
            }
          />
        ) : parsed.activeOnboardingRole === "COACH" ? (
          <CoachProfileForm
            disabled={busy}
            showAcademyIdField={parsed.pendingInvitationCount > 0}
            onSubmit={(payload) =>
              handleProfileSubmit(submitCoachProfile, payload)
            }
          />
        ) : parsed.activeOnboardingRole === "ACADEMY_ADMIN" ? (
          <Alert variant="danger">
            Inconsistent onboarding state: academy administrators should complete
            onboarding without a profile step. Please refresh or contact support.
          </Alert>
        ) : (
          <Alert variant="warning">
            Profile step is required, but activeOnboardingRole was not ATHLETE or
            COACH. Please contact support.
          </Alert>
        )
      ) : null}

      {phase === "ENTITY_ACTION_REQUIRED" ? (
        parsed.activeOnboardingRole === "ATHLETE" ? (
          <AthleteEntityActionPanel
            disabled={busy}
            onCreate={(payload) =>
              runAction(() => createEntity(payload), { refreshAfter: true })
            }
            onRefreshOnly={refreshOnly}
          />
        ) : (
          <Alert variant="danger">
            Inconsistent onboarding state: entity action is now athlete-only.
            Please refresh or contact support.
          </Alert>
        )
      ) : null}

    </Stack>
  );
}

function OnboardingInner() {
  return <OnboardingContent />;
}

export default function OnboardingPage() {
  return (
    <ProtectedLayout mode="auth-only">
      <div className="flex min-h-screen w-full items-center justify-center py-8">
        <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
          <Card className="w-full">
            <OnboardingInner />
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}
