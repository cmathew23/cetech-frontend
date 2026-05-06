import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function DashboardCardShell({
  title,
  subtitle,
  children,
  className = "",
  accent = false,
}: {
  /** Omit or leave empty to render a title-less card (content only). */
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  const showTitle = (title ?? "").trim() !== "";
  return (
    <Card
      title={showTitle ? title : undefined}
      subtitle={subtitle}
      className={cn("space-y-3", className)}
      accent={accent}
    >
      {children}
    </Card>
  );
}

