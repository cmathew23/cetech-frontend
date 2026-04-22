"use client";

import { Alert } from "@/components/ui/Alert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { FormSection } from "@/components/ui/FormSection";
import { Stack } from "@/components/ui/Stack";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

const ROLES = ["ATHLETE", "COACH", "ACADEMY_ADMIN"] as const;
type Role = (typeof ROLES)[number];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("ATHLETE");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

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
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      setSuccessMessage("Account created successfully.");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch {
      // Error state is sourced from useAuth.
    }
  }

  return (
    <AuthLayout sidePanelVariant="register">
      <AuthCard
        title="Create an account"
        subtitle="Start with your role and we’ll guide the rest."
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
        <Stack spacing="md">
          {successMessage ? (
            <Alert variant="success">{successMessage}</Alert>
          ) : null}
          {formError ? <Alert variant="danger">{formError}</Alert> : null}
          {!formError && authError ? (
            <Alert variant="danger">{authError.message}</Alert>
          ) : null}

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
              <AuthSelect
                id="role"
                label="Role"
                required
                selectProps={{
                  name: "role",
                  required: true,
                  value: role,
                  onChange: (e: ChangeEvent<HTMLSelectElement>) =>
                    setRole(e.target.value as Role),
                }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </AuthSelect>

              <AuthButton
                type="submit"
                loading={authLoading}
                disabled={!!successMessage}
              >
                Register
              </AuthButton>
            </FormSection>
          </form>
        </Stack>
      </AuthCard>
    </AuthLayout>
  );
}
