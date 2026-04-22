import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

export function Modal({ children, className = "" }) {
  return (
    <div className={cn(designSystem.modal.backdrop)} role="presentation">
      <div
        className={cn(designSystem.modal.panel, className)}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
