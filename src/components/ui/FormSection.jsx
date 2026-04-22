import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function FormSection({ children, className = "" }) {
  return (
    <div className={cn(designSystem.spacing.form, className)}>{children}</div>
  );
}
