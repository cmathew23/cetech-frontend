import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

const SPACING_MAP = {
  sm: "dense",
  md: "form",
  lg: "section",
  page: "page",
};

export function Stack({ spacing = "md", className = "", children, ...props }) {
  const s = spacing ?? "md";
  const tokenKey = SPACING_MAP[s];
  if (!tokenKey) {
    throw new Error(`Invalid Stack spacing: ${spacing}`);
  }
  const spacingClass = designSystem.spacing[tokenKey];
  return (
    <div className={cn(spacingClass, className)} {...props}>
      {children}
    </div>
  );
}
