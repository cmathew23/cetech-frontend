"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/ui/FormSection";
import { Stack } from "@/components/ui/Stack";
import { requestPasswordReset } from "@/lib/api/auth";
import { isNormalizedApiError } from "@/lib/apiClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

const SUCCESS_MESSAGE = "If an account exists, a reset link has been sent";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (email.trim() === "") {
      setFormError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (e) {
      if (isNormalizedApiError(e)) {
        if (e.code === "RATE_LIMIT_EXCEEDED" || e.status === 429) {
          setFormError("Too many requests. Please wait and try again.");
        } else if (e.code === "VALIDATION_ERROR" || e.status === 400) {
          setFormError(e.message || "Please enter a valid email address.");
        } else if (e.status >= 500) {
          setFormError("Server error. Please try again later.");
        } else {
          setFormError(e.message || "Unable to send reset link right now.");
        }
      } else {
        setFormError("Unable to send reset link right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Stack spacing="md">
        <Alert variant="success">{SUCCESS_MESSAGE}</Alert>
        <AuthButton type="button" onClick={() => router.push("/login")}>
          Back to login
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
          <AuthButton type="submit" loading={loading} disabled={loading}>
            Send reset link
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

