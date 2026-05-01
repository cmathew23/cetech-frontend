"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { toTitleCaseInput } from "@/lib/textFormat";

type AdminDashboardHeaderProps = {
  /** Academy name from GET /academies/me context only; empty/whitespace shows fallback. */
  academyName: string;
};

export function AdminDashboardHeader({ academyName }: AdminDashboardHeaderProps) {
  const raw = academyName.trim();
  const displayName = raw !== "" ? toTitleCaseInput(raw) : "—";

  return (
    <PageHeader
      title="Academy Admin Dashboard"
      subtitle="Manage members, invitations, and assignments."
      trailing={
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-textSecondary">Academy</span>
          <span
            className="text-sm font-medium text-textPrimary"
            aria-live="polite"
          >
            {displayName}
          </span>
        </div>
      }
    />
  );
}
