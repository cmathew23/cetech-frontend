"use client";

type AdminDashboardHeaderProps = {
  /** Academy name from GET /academies/me context only; empty/whitespace shows fallback. */
  academyName: string;
};

export function AdminDashboardHeader({ academyName }: AdminDashboardHeaderProps) {
  const displayName = academyName.trim() !== "" ? academyName.trim() : "—";

  return (
    <header className="flex w-full min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
          Academy Admin Dashboard
        </h1>
        <p className="text-sm text-textSecondary">
          Manage members, invitations, and assignments.
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-textSecondary">Academy</span>
          <span
            className="text-sm font-medium text-textPrimary"
            aria-live="polite"
          >
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
