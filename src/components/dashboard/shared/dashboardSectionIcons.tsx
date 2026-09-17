import {
  CalendarCheck,
  ChartColumnIncreasing,
  ClipboardClock,
  Dumbbell,
  Flag,
  ForkKnife,
  PersonStanding,
  Pyramid,
  Target,
  Trophy,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import { cn } from "@/lib/utils";

/** Shared size/weight/color for dashboard section heading icons. */
export const DASHBOARD_SECTION_ICON_CLASS =
  "h-5 w-5 shrink-0 text-primary md:h-[22px] md:w-[22px] lg:h-6 lg:w-6";

const DASHBOARD_SECTION_ICONS: Record<string, LucideIcon> = {
  "Weekly Adherence": CalendarCheck,
  "Weekly Training Load": Dumbbell,
  "Today's Plan": ClipboardClock,
  "Today’s Plan": ClipboardClock,
  "Weekly Goal Performance": Target,
  "Exercise Performance": PersonStanding,
  "Taxonomy Performance": Pyramid,
  "Practice Performance": Flag,
  "Competition Performance": Trophy,
  "Overall Golf Performance": ChartColumnIncreasing,
  "Nutrition Performance": ForkKnife,
  "Wearable Summary": Watch,
};

export function dashboardSectionIcon(
  title: string | null | undefined,
): LucideIcon | null {
  if (typeof title !== "string" || title.trim() === "") return null;
  return DASHBOARD_SECTION_ICONS[title] ?? null;
}

export function DashboardSectionHeading({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const Icon = dashboardSectionIcon(title);
  if (!Icon) {
    return <h3 className={className}>{title}</h3>;
  }

  return (
    <h3 className={cn("flex min-w-0 items-center gap-2", className)}>
      {createElement(Icon, {
        className: DASHBOARD_SECTION_ICON_CLASS,
        size: 24,
        "aria-hidden": true,
        strokeWidth: 2,
      })}
      <span className="min-w-0">{title}</span>
    </h3>
  );
}
