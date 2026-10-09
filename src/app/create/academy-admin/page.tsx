"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormSection } from "@/components/ui/FormSection";
import { Stack } from "@/components/ui/Stack";
import { createAcademyAdmin } from "@/lib/api/auth";
import { isNormalizedApiError } from "@/lib/apiClient";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ChangeEvent } from "react";

function AcademyAdminSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupToken = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!setupToken) {
      setFormError("This setup link is invalid or incomplete.");
      return;
    }

    const emailOk = email.trim() !== "";
    const passwordOk = password.length >= 6;
    const firstNameOk = firstName.trim() !== "";
    const lastNameOk = lastName.trim() !== "";

    if (!emailOk || !passwordOk || !firstNameOk || !lastNameOk) {
      setFormError(
        "Please fill all fields correctly. Password must be at least 6 characters.",
      );
      return;
    }

    setSubmitLoading(true);
    try {
      await createAcademyAdmin({
        setupToken,
        email,
        password,
        firstName,
        lastName,
      });

      setSuccessMessage("Account created successfully.");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      if (isNormalizedApiError(err)) {
        setFormError(err.message);
      } else {
        setFormError("Account creation failed. Please try again.");
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  if (!setupToken) {
    return (
      <Stack spacing="md">
        <Alert variant="warning">This setup link is invalid or incomplete.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing="md">
      {successMessage ? (
        <Alert variant="success">{successMessage}</Alert>
      ) : null}
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
          <AuthInput
            id="password"
            label="Password"
            required
            helperText="Minimum 6 characters"
            inputProps={{
              name: "password",
              type: "password",
              autoComplete: "new-password",
              required: true,
              value: password,
              onChange: (e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value),
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthInput
              id="firstName"
              label="First Name"
              required
              inputProps={{
                name: "firstName",
                type: "text",
                autoComplete: "given-name",
                required: true,
                value: firstName,
                onChange: (e: ChangeEvent<HTMLInputElement>) =>
                  setFirstName(e.target.value),
              }}
            />
            <AuthInput
              id="lastName"
              label="Last Name"
              required
              inputProps={{
                name: "lastName",
                type: "text",
                autoComplete: "family-name",
                required: true,
                value: lastName,
                onChange: (e: ChangeEvent<HTMLInputElement>) =>
                  setLastName(e.target.value),
              }}
            />
          </div>

          <AuthButton
            type="submit"
            loading={submitLoading}
            disabled={!!successMessage}
          >
            Register
          </AuthButton>
        </FormSection>
      </form>
    </Stack>
  );
}

export default function CreateAcademyAdminPage() {
  const router = useRouter();

  return (
    <AuthLayout sidePanelVariant="register">
      <AuthCard
        title="Create an account"
        footer={
          <div className="text-sm text-textSecondary">
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-textPrimary underline underline-offset-4 hover:opacity-90"
              onClick={() => router.push("/login")}
            >
              Sign in
            </button>
          </div>
        }
      >
        <Suspense
          fallback={<p className="text-sm text-textSecondary">Loading…</p>}
        >
          <AcademyAdminSetupForm />
        </Suspense>
      </AuthCard>
    </AuthLayout>
  );
}
