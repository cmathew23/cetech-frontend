import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
};

export function FormField({
  id,
  label,
  required = false,
  helperText,
  error,
  children,
  className = "",
  labelClassName,
}: FormFieldProps) {
  const { formField: f, typography: t } = designSystem;

  return (
    <div className={cn(f.root, className)}>
      <label htmlFor={id} className={cn(f.label, labelClassName)}>
        {label}
        {required ? (
          <>
            {" "}
            <span className={f.requiredMark} aria-hidden>
              *
            </span>
          </>
        ) : null}
      </label>
      {helperText ? (
        <div className={f.controlWithHelper}>
          {children}
          <p className={t.muted}>{helperText}</p>
        </div>
      ) : (
        children
      )}
      {error ? (
        <p className={f.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
