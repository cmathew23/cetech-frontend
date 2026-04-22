import { DashboardCardShell } from "@/components/dashboard/shared/DashboardCardShell";

const KPI_ITEMS = [
  { title: "Training Load", value: "Placeholder", meta: "Status" },
  { title: "Recovery Score", value: "Placeholder", meta: "Status" },
  { title: "Nutrition Adherence", value: "Placeholder", meta: "Status" },
  { title: "Weekly Readiness", value: "Placeholder", meta: "Status" },
] as const;

export function AthleteKpiRow() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KPI_ITEMS.map((item) => (
        <DashboardCardShell key={item.title} title={item.title} className="space-y-2">
          <p className="text-lg font-semibold text-textPrimary">{item.value}</p>
          <p className="text-xs text-textSecondary">{item.meta}</p>
        </DashboardCardShell>
      ))}
    </section>
  );
}

