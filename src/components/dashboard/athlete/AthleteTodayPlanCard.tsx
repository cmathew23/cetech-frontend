import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AthleteTodayPlanCard() {
  return (
    <DashboardCardShell title="Today’s Plan" className="min-h-[280px]">
      <div className="space-y-3">
        <Card padding="compact" accent={false} className="bg-bg">
          <p className="text-sm font-medium text-textPrimary">Session 1</p>
          <p className="text-sm text-textSecondary">Placeholder workout details</p>
        </Card>
        <Card padding="compact" accent={false} className="bg-bg">
          <p className="text-sm font-medium text-textPrimary">Session 2</p>
          <p className="text-sm text-textSecondary">Placeholder recovery block</p>
        </Card>
        <div className="pt-1">
          <Button type="button" variant="secondary">
            View full plan
          </Button>
        </div>
      </div>
    </DashboardCardShell>
  );
}

