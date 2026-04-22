import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function Select({ className = "", ...props }) {
  return (
    <select
      className={cn(designSystem.select.root, className)}
      {...props}
    />
  );
}
