import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function DashboardCardShell({
  title,
  children,
  className = "",
}: {
  /** Omit or leave empty to render a title-less card (content only). */
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const showTitle = (title ?? "").trim() !== "";
  return (
    <Card className={cn("space-y-3 p-4 md:p-5", className)}>
      {showTitle ? (
        <h3 className="text-base font-semibold text-textPrimary">{title}</h3>
      ) : null}
      {children}
    </Card>
  );
}

