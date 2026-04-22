import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Button } from "@/components/ui/Button";

export function AthleteTodayPlanCard() {
  return (
    <DashboardCardShell title="Today’s Plan" className="min-h-[280px]">
      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-bg p-3">
          <p className="text-sm font-medium text-textPrimary">Session 1</p>
          <p className="text-sm text-textSecondary">Placeholder workout details</p>
        </div>
        <div className="rounded-lg border border-border bg-bg p-3">
          <p className="text-sm font-medium text-textPrimary">Session 2</p>
          <p className="text-sm text-textSecondary">Placeholder recovery block</p>
        </div>
        <div className="pt-1">
          <Button type="button" variant="secondary">
            View full plan
          </Button>
        </div>
      </div>
    </DashboardCardShell>
  );
}

