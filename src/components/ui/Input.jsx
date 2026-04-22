import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function Input({ className = "", ...props }) {
  return (
    <input
      suppressHydrationWarning
      className={cn(designSystem.input.root, className)}
      {...props}
    />
  );
}
