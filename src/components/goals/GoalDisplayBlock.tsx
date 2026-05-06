import { Badge } from "@/components/ui/Badge";
import type { TrainingPlanGenerationDomain } from "@/lib/api/coachAthletePlanningReadiness";
import {
  cleanGoalText,
  formatGoalDate,
  formatGoalDomain,
  formatGoalStatus,
  renderGoalSuccessCriteria,
} from "@/lib/goalDisplay";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GoalDisplayBlockProps = {
  title: string | null | undefined;
  status?: string | null;
  priority?: string | null;
  successCriteria?: string | null;
  targetDate?: string | null;
  domain?: TrainingPlanGenerationDomain | null;
  secondaryLabel?: string | null;
  className?: string;
  control?: ReactNode;
  showDomain?: boolean;
};

function badgeVariantForStatus(status: string | null): "neutral" | "warning" | "danger" {
  if (!status) return "warning";
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE" || normalized === "CONFIRMED" || normalized === "COMPLETED") {
    return "neutral";
  }
  if (normalized === "INACTIVE" || normalized === "PENDING") {
    return "warning";
  }
  return "danger";
}

export function GoalDisplayBlock({
  title,
  status,
  priority,
  successCriteria,
  targetDate,
  domain,
  secondaryLabel,
  className,
  control,
  showDomain = false,
}: GoalDisplayBlockProps) {
  const cleanTitle = cleanGoalText(title);
  const formattedStatus = formatGoalStatus(status);
  const formattedPriority = cleanGoalText(priority);
  const formattedDate = formatGoalDate(targetDate);
  const formattedDomain = showDomain ? formatGoalDomain(domain) : null;
  const formattedSecondaryLabel = cleanGoalText(secondaryLabel);
  const criteriaLines = renderGoalSuccessCriteria(successCriteria);

  return (
    <div className={cn("flex items-start gap-2 text-sm text-textPrimary", className)}>
      {control ? <div className="pt-0.5">{control}</div> : null}
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {cleanTitle ? <span className="font-medium">{cleanTitle}</span> : null}
          {formattedStatus ? (
            <Badge variant={badgeVariantForStatus(formattedStatus)}>{formattedStatus}</Badge>
          ) : null}
          {formattedPriority ? (
            <span className="text-xs text-textSecondary">{formattedPriority}</span>
          ) : null}
          {formattedDomain ? (
            <span className="text-xs text-textSecondary">{formattedDomain}</span>
          ) : null}
        </div>
        {formattedSecondaryLabel || formattedDate ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-textSecondary">
            {formattedSecondaryLabel ? <span>{formattedSecondaryLabel}</span> : null}
            {formattedDate ? <span>{formattedDate}</span> : null}
          </div>
        ) : null}
        {criteriaLines.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-textSecondary">
            {criteriaLines.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
