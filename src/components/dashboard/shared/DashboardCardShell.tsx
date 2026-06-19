import { Card } from "@/components/ui/Card";
import { DASHBOARD_MAJOR_OUTER_CARD_CLASS } from "@/components/dashboard/shared/dashboardOuterCardStyles";
import { cn } from "@/lib/utils";

export function DashboardCardShell({
  title,
  subtitle,
  children,
  className = "",
  accent = false,
  titleClassName,
  majorOuter = false,
}: {
  /** Omit or leave empty to render a title-less card (content only). */
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  titleClassName?: string;
  /** Apply orange 80% border for major section cards only. */
  majorOuter?: boolean;
}) {
  const showTitle = (title ?? "").trim() !== "";
  return (
    <Card
      title={showTitle ? title : undefined}
      subtitle={subtitle}
      className={cn(
        "space-y-3",
        majorOuter && DASHBOARD_MAJOR_OUTER_CARD_CLASS,
        className,
      )}
      accent={accent}
      titleClassName={titleClassName}
    >
      {children}
    </Card>
  );
}

