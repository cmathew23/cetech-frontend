import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function Card({ children, className = "" }) {
  return (
    <div
      className={cn(
        designSystem.card.root,
        designSystem.spacing.section,
        className,
      )}
    >
      {children}
    </div>
  );
}
