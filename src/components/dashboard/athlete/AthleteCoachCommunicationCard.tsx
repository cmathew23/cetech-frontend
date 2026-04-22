import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";
import { Button } from "@/components/ui/Button";

export function AthleteCoachCommunicationCard() {
  return (
    <DashboardCardShell title="Coach Communication">
      <p className="text-sm text-textSecondary">Latest message preview placeholder.</p>
      <div className="pt-1">
        <Button type="button" variant="secondary">
          Open chat
        </Button>
      </div>
    </DashboardCardShell>
  );
}

