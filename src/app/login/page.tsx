"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormSection } from "@/components/ui/FormSection";
import { Stack } from "@/components/ui/Stack";
import { useAuth } from "@/hooks/useAuth";
import {
  routeFromAccessContext,
} from "@/lib/accessContext";
import { getOnboardingStatus } from "@/lib/api/onboarding";
import { isNormalizedApiError, type NormalizedApiError } from "@/lib/apiClient";
import { parseOnboardingPayload } from "@/lib/onboarding-status";
import { resolvePostLoginDestination } from "@/lib/post-login-route";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

function getLoginErrorMessage(err: NormalizedApiError): string {
  if (err.code === "INVALID_CREDENTIALS") return "Invalid email or password";
  if (err.code === "VALIDATION_ERROR") return "Invalid input";
  return err.message || "Login failed";
}

export default function LoginPage() {
  const router = useRouter();
  const { login, refreshSession, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void runLogin();
  }

  async function runLogin() {
    setFormError(null);

    const emailOk = email.trim() !== "";
    const passwordOk = password.length >= 6;

    if (!emailOk || !passwordOk) {
      setFormError(
        "Please enter valid email and password (min 6 characters).",
      );
      return;
    }
    setSubmitLoading(true);
    try {
      let session = await login({ email, password });
      let resolvedAccessContext = session.accessContext;

      async function loadOnboardingStatusOnce() {
        try {
          const raw = await getOnboardingStatus();
          return parseOnboardingPayload(raw);
        } catch {
          return null;
        }
      }

      let parsedOnboarding: ReturnType<typeof parseOnboardingPayload> | null =
        await loadOnboardingStatusOnce();

      // Keep transition on login spinner until session/onboarding stabilize.
      if (resolvedAccessContext == null || parsedOnboarding == null) {
        const refreshed = await refreshSession();
        if (refreshed) {
          session = refreshed;
          resolvedAccessContext = refreshed.accessContext;
        }
        if (parsedOnboarding == null) {
          parsedOnboarding = await loadOnboardingStatusOnce();
        }
      }

      const routeFromBootstrap = routeFromAccessContext(resolvedAccessContext);
      if (routeFromBootstrap) {
        router.replace(routeFromBootstrap);
        return;
      }

      if (resolvedAccessContext == null) {
        router.replace("/onboarding");
        return;
      }

      const me = session;
      /** Fallback only when app-context resolves but has no explicit destination. */
      let destination = "/onboarding";
      try {
        if (parsedOnboarding) {
          destination = resolvePostLoginDestination(parsedOnboarding, me.roles);
        }
      } catch {
        destination = "/onboarding";
      }

      router.replace(destination);
    } catch (e) {
      if (isNormalizedApiError(e)) {
        setFormError(getLoginErrorMessage(e));
      } else {
        setFormError("Login failed. Please try again.");
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <AuthLayout sidePanelVariant="login">
      <AuthCard
        title="Sign in"
        subtitle="Access your dashboard and invitations."
        footer={
          <div className="text-sm text-textSecondary">
            Don’t have an account?{" "}
            <button
              type="button"
              className="font-medium text-textPrimary underline underline-offset-4 hover:opacity-90"
              onClick={() => router.push("/register")}
            >
              Create one
            </button>
          </div>
        }
      >
        <Stack spacing="md">
          {formError ? <Alert variant="danger">{formError}</Alert> : null}
          {!formError && authError ? (
            <Alert variant="danger">{getLoginErrorMessage(authError)}</Alert>
          ) : null}

          <form method="post" onSubmit={handleFormSubmit}>
            <FormSection>
              <AuthInput
                id="email"
                label="Email"
                required
                inputProps={{
                  name: "email",
                  type: "email",
                  autoComplete: "email",
                  required: true,
                  value: email,
                  onChange: (e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value),
                }}
              />
              <AuthInput
                id="password"
                label="Password"
                required
                helperText="Minimum 6 characters"
                inputProps={{
                  name: "password",
                  type: "password",
                  autoComplete: "current-password",
                  required: true,
                  value: password,
                  onChange: (e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value),
                }}
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-textSecondary underline underline-offset-4 hover:text-textPrimary"
                >
                  Forgot password?
                </Link>
              </div>
              <AuthButton
                type="submit"
                loading={submitLoading}
                disabled={submitLoading}
              >
                Sign in
              </AuthButton>
            </FormSection>
          </form>
        </Stack>
      </AuthCard>
    </AuthLayout>
  );
}
