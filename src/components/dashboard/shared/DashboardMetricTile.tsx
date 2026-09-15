import {
  DASHBOARD_METRIC_STATUS_CLASS,
  DASHBOARD_METRIC_SUPPORTING_CLASS,
  DASHBOARD_METRIC_TILE_CLASS,
  DASHBOARD_METRIC_TITLE_CLASS,
  DASHBOARD_METRIC_VALUE_CLASS,
} from "@/components/dashboard/shared/dashboardTypography";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function DashboardMetricTile({
  title,
  value,
  caption,
  supporting,
  className,
}: {
  title: string;
  value: string;
  caption?: string;
  supporting?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn(DASHBOARD_METRIC_TILE_CLASS, className)}>
      <h4 className={DASHBOARD_METRIC_TITLE_CLASS}>{title}</h4>
      <p className={DASHBOARD_METRIC_VALUE_CLASS}>{value}</p>
      {caption ? <p className={DASHBOARD_METRIC_STATUS_CLASS}>{caption}</p> : null}
      {supporting ? (
        <div className={DASHBOARD_METRIC_SUPPORTING_CLASS}>{supporting}</div>
      ) : null}
    </article>
  );
}
