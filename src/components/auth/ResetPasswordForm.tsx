"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/ui/FormSection";
import { Stack } from "@/components/ui/Stack";
import { removeToken } from "@/lib/auth";
import { resetPasswordWithToken } from "@/lib/api/auth";
import { isNormalizedApiError } from "@/lib/apiClient";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ChangeEvent } from "react";

const SUCCESS_MESSAGE = "Password has been reset successfully";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setInvalidToken(false);

    if (!token) {
      setFormError("This reset link is invalid or incomplete.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters.");
      return;
    }
    if (confirmPassword !== newPassword) {
      setFormError("Confirm password must match new password.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithToken(token, newPassword);
      removeToken();
      setSuccess(true);
      setTimeout(() => {
        router.replace("/login");
      }, 1000);
    } catch (e) {
      if (isNormalizedApiError(e)) {
        if (
          e.code === "INVALID_OR_EXPIRED_RESET_TOKEN" ||
          (e.status === 400 &&
            e.message.toUpperCase().includes("INVALID_OR_EXPIRED_RESET_TOKEN"))
        ) {
          setInvalidToken(true);
        } else if (e.code === "VALIDATION_ERROR" || e.status === 400) {
          setFormError(e.message || "Please check your password inputs.");
        } else if (e.status >= 500) {
          setFormError("Server error. Please try again later.");
        } else {
          setFormError(e.message || "Unable to reset password right now.");
        }
      } else {
        setFormError("Unable to reset password right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Stack spacing="md">
        <Alert variant="warning">This reset link is invalid or incomplete.</Alert>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-textPrimary underline underline-offset-4 hover:opacity-90"
        >
          Request new reset link
        </Link>
      </Stack>
    );
  }

  if (invalidToken) {
    return (
      <Stack spacing="md">
        <Alert variant="danger">
          This link is invalid or expired. Request a new reset link.
        </Alert>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-textPrimary underline underline-offset-4 hover:opacity-90"
        >
          Request new reset link
        </Link>
      </Stack>
    );
  }

  if (success) {
    return (
      <Stack spacing="md">
        <Alert variant="success">{SUCCESS_MESSAGE}</Alert>
        <AuthButton type="button" onClick={() => router.replace("/login")}>
          Go to login
        </AuthButton>
      </Stack>
    );
  }

  return (
    <Stack spacing="md">
      {formError ? <Alert variant="danger">{formError}</Alert> : null}
      <form onSubmit={handleSubmit}>
        <FormSection>
          <AuthInput
            id="newPassword"
            label="New Password"
            required
            helperText="Minimum 6 characters"
            inputProps={{
              name: "newPassword",
              type: "password",
              autoComplete: "new-password",
              required: true,
              value: newPassword,
              onChange: (e: ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value),
            }}
          />
          <AuthInput
            id="confirmPassword"
            label="Confirm Password"
            required
            inputProps={{
              name: "confirmPassword",
              type: "password",
              autoComplete: "new-password",
              required: true,
              value: confirmPassword,
              onChange: (e: ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value),
            }}
          />
          <AuthButton type="submit" loading={loading} disabled={loading}>
            Reset Password
          </AuthButton>
        </FormSection>
      </form>
      <div className="text-sm text-textSecondary">
        <Link
          href="/login"
          className="font-medium text-textPrimary underline underline-offset-4 hover:opacity-90"
        >
          Back to login
        </Link>
      </div>
    </Stack>
  );
}

