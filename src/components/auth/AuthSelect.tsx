"use client";

import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";

export function AuthSelect({
  id,
  label,
  required,
  selectProps,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  selectProps: React.ComponentProps<typeof Select>;
  children: React.ReactNode;
}) {
  return (
    <FormField id={id} label={label} required={required}>
      <Select id={id} {...selectProps}>
        {children}
      </Select>
    </FormField>
  );
}

