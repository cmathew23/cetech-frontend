import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export type StatusBadgeVariant = "success" | "warning" | "neutral" | "error" | "accent";

const STATUS_STYLES: Record<StatusBadgeVariant, string> = {
  success: designSystem.badge.success,
  warning: designSystem.badge.warning,
  neutral: designSystem.badge.neutral,
  error: designSystem.badge.error,
  accent: designSystem.badge.accent,
};

export function statusBadgeVariantFromValue(status: string): StatusBadgeVariant {
  const upper = status.trim().toUpperCase();
  if (upper === "ACTIVE" || upper === "ACCEPTED" || upper === "COMPLETED") {
    return "success";
  }
  if (upper === "PENDING" || upper === "WAITLISTED" || upper === "IN_PROGRESS") {
    return "warning";
  }
  if (upper === "REVOKED" || upper === "ARCHIVED") {
    return "accent";
  }
  if (upper === "DECLINED" || upper === "EXPIRED" || upper === "REMOVED") {
    return "error";
  }
  return "neutral";
}

export function StatusBadge({
  children,
  className = "",
  status,
  variant,
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  status?: string;
  variant?: StatusBadgeVariant;
}) {
  const resolvedVariant = variant ?? (status ? statusBadgeVariantFromValue(status) : "neutral");
  return (
    <span
      className={cn(designSystem.badge.base, STATUS_STYLES[resolvedVariant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
