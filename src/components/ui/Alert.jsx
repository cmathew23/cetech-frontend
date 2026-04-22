import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function Alert({
  variant = "success",
  className = "",
  children,
  ...props
}) {
  const v = variant ?? "success";
  const styles = {
    success: designSystem.alert.success,
    warning: designSystem.alert.warning,
    danger: designSystem.alert.danger,
  };

  if (!styles[v]) {
    throw new Error(`Invalid Alert variant: ${variant}`);
  }

  return (
    <div
      className={cn(designSystem.alert.base, styles[v], className)}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}
