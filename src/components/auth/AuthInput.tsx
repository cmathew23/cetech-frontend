"use client";

import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

export function AuthInput({
  id,
  label,
  helperText,
  required,
  inputProps,
}: {
  id: string;
  label: string;
  helperText?: string;
  required?: boolean;
  inputProps: React.ComponentProps<typeof Input>;
}) {
  return (
    <FormField id={id} label={label} required={required} helperText={helperText}>
      <Input id={id} {...inputProps} />
    </FormField>
  );
}

