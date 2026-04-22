import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";

export function AthleteInsightsCard() {
  return (
    <DashboardCardShell title="AI Insights" className="min-h-[280px]">
      <ul className="list-disc space-y-2 pl-5 text-sm text-textSecondary">
        <li>Placeholder insight line one.</li>
        <li>Placeholder insight line two.</li>
      </ul>
    </DashboardCardShell>
  );
}

