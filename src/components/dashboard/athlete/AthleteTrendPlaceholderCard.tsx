import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";

export function AthleteTrendPlaceholderCard() {
  return (
    <DashboardCardShell title="Trends">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-dashed border-border bg-bg p-4">
          <p className="text-sm font-medium text-textPrimary">Training Load Trend</p>
          <div className="mt-3 h-24 rounded-md border border-border bg-card" />
        </div>
        <div className="rounded-lg border border-dashed border-border bg-bg p-4">
          <p className="text-sm font-medium text-textPrimary">
            Recovery vs Readiness
          </p>
          <div className="mt-3 h-24 rounded-md border border-border bg-card" />
        </div>
      </div>
    </DashboardCardShell>
  );
}

