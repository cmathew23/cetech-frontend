import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function Badge({
  variant = "success",
  className = "",
  children,
  ...props
}) {
  const v = variant ?? "success";
  const styles = {
    success: designSystem.badge.success,
    warning: designSystem.badge.warning,
    neutral: designSystem.badge.neutral,
    error: designSystem.badge.error,
    accent: designSystem.badge.accent,
    // backwards compatibility
    danger: designSystem.badge.danger,
  };

  if (!styles[v]) {
    throw new Error(`Invalid Badge variant: ${variant}`);
  }

  return (
    <span
      className={cn(designSystem.badge.base, styles[v], className)}
      {...props}
    >
      {children}
    </span>
  );
}
