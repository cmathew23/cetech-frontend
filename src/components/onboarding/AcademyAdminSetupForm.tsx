"use client";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { FormSection } from "@/components/ui/FormSection";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { designSystem } from "@/config/design-system";
import type { AcademySetupPayload } from "@/lib/api/onboarding";
import { type ChangeEvent, type FormEvent, useState } from "react";

type AcademyAdminSetupFormProps = {
  disabled: boolean;
  onSubmit: (payload: AcademySetupPayload) => Promise<void>;
};

function fieldMessage(label: string): string {
  return `${label} is required.`;
}

export function AcademyAdminSetupForm({
  disabled,
  onSubmit,
}: AcademyAdminSetupFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>(
    {},
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const a = address.trim();
    const em = email.trim();
    const ph = phone.trim();
    const next: Partial<Record<string, string>> = {};
    if (n === "") next.name = fieldMessage("Academy name");
    if (a === "") next.address = fieldMessage("Address");
    if (em === "") next.email = fieldMessage("Email");
    if (ph === "") next.phone = fieldMessage("Phone");
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    await onSubmit({ name: n, address: a, email: em, phone: ph });
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <FormSection>
        <Heading variant="h3">Create your academy</Heading>
        <p className={designSystem.typography.muted}>
          Your academy is created on the server only after you submit this form.
          All fields are required.
        </p>

        <Stack spacing="md" className="mt-4">
          <FormField id="academy-setup-name" label="Academy name" required>
            <Input
              id="academy-setup-name"
              name="name"
              autoComplete="organization"
              value={name}
              disabled={disabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value);
                setFieldErrors((f) => ({ ...f, name: undefined }));
              }}
              aria-invalid={fieldErrors.name ? true : undefined}
            />
            {fieldErrors.name ? (
              <p className="text-sm text-danger" role="alert">
                {fieldErrors.name}
              </p>
            ) : null}
          </FormField>

          <FormField id="academy-setup-address" label="Address" required>
            <Input
              id="academy-setup-address"
              name="address"
              autoComplete="street-address"
              value={address}
              disabled={disabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setAddress(e.target.value);
                setFieldErrors((f) => ({ ...f, address: undefined }));
              }}
              aria-invalid={fieldErrors.address ? true : undefined}
            />
            {fieldErrors.address ? (
              <p className="text-sm text-danger" role="alert">
                {fieldErrors.address}
              </p>
            ) : null}
          </FormField>

          <FormField id="academy-setup-email" label="Email" required>
            <Input
              id="academy-setup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={disabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
              aria-invalid={fieldErrors.email ? true : undefined}
            />
            {fieldErrors.email ? (
              <p className="text-sm text-danger" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </FormField>

          <FormField id="academy-setup-phone" label="Phone" required>
            <Input
              id="academy-setup-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              disabled={disabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setPhone(e.target.value);
                setFieldErrors((f) => ({ ...f, phone: undefined }));
              }}
              aria-invalid={fieldErrors.phone ? true : undefined}
            />
            {fieldErrors.phone ? (
              <p className="text-sm text-danger" role="alert">
                {fieldErrors.phone}
              </p>
            ) : null}
          </FormField>
        </Stack>

        <div className={designSystem.layout.registerForm.actions}>
          <Button
            type="submit"
            variant="primary"
            loading={disabled}
            className="w-full md:w-auto"
          >
            Create academy and continue
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
