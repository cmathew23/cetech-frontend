import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  disabled = false,
  loading = false,
  children,
  ...props
}) {
  const v = variant ?? "primary";
  const styles = {
    primary: designSystem.button.primary,
    secondary: designSystem.button.secondary,
    neutral: designSystem.button.neutral,
    danger: designSystem.button.danger,
    destructive: designSystem.button.destructive ?? designSystem.button.danger,
  };

  if (!styles[v]) {
    throw new Error(`Invalid Button variant: ${variant}`);
  }

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        designSystem.button.base,
        styles[v],
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
      type={type}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
