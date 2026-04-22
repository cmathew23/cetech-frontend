import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";

const ROWS = ["Thu • Placeholder", "Fri • Placeholder", "Sat • Placeholder"] as const;

export function AthleteUpcomingScheduleCard() {
  return (
    <DashboardCardShell title="Upcoming Schedule">
      <ul className="space-y-2 text-sm text-textSecondary">
        {ROWS.map((row) => (
          <li key={row} className="rounded-md border border-border bg-bg px-2 py-1.5">
            {row}
          </li>
        ))}
      </ul>
    </DashboardCardShell>
  );
}

