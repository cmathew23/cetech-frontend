import type { ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  Loader2,
  Minus,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardStatusNoticeType =
  | "info"
  | "success"
  | "warning"
  | "blocker"
  | "error"
  | "loading"
  | "empty";

const NOTICE_STYLES: Record<DashboardStatusNoticeType, string> = {
  info: "border-sky-200/80 border-l-sky-600 bg-sky-50 text-slate-800",
  success: "border-emerald-200/80 border-l-emerald-600 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200/80 border-l-amber-500 bg-amber-50 text-amber-950",
  blocker: "border-orange-200/80 border-l-orange-500 bg-orange-50 text-orange-950",
  error: "border-red-200/80 border-l-red-600 bg-red-50 text-red-950",
  loading: "border-sky-200/80 border-l-primary bg-primary/5 text-textPrimary",
  empty: "border-slate-200/80 border-l-slate-400 bg-slate-50 text-textSecondary",
};

const DEFAULT_ICONS: Record<DashboardStatusNoticeType, ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CircleCheck className="h-4 w-4" />,
  warning: <TriangleAlert className="h-4 w-4" />,
  blocker: <TriangleAlert className="h-4 w-4" />,
  error: <CircleAlert className="h-4 w-4" />,
  loading: <Loader2 className="h-4 w-4 animate-spin" />,
  empty: <Minus className="h-4 w-4" />,
};

export function DashboardStatusNotice({
  type,
  title,
  children,
  message,
  nextStep,
  action,
  compact = false,
  items,
  icon,
  showPrefix = true,
  className,
}: {
  type: DashboardStatusNoticeType;
  title?: ReactNode;
  children?: ReactNode;
  message?: ReactNode;
  nextStep?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  items?: string[];
  icon?: ReactNode;
  showPrefix?: boolean;
  className?: string;
}) {
  const content = children ?? message;
  const prefix = icon ?? (showPrefix ? DEFAULT_ICONS[type] : null);
  const role = type === "error" || type === "blocker" ? "alert" : "status";

  return (
    <div
      className={cn(
        "min-w-0 rounded-md border border-l-[3px] px-3 text-sm leading-5 shadow-sm",
        compact ? "py-2" : "py-2.5",
        NOTICE_STYLES[type],
        className,
      )}
      role={role}
      aria-live={type === "loading" ? "polite" : undefined}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {prefix ? (
          <span
            className="mt-0.5 shrink-0 leading-none text-current"
            aria-hidden="true"
          >
            {prefix}
          </span>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          {title ? <div className="font-medium text-current">{title}</div> : null}
          {content ? <div className="break-words text-current/90">{content}</div> : null}
          {items && items.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4">
              {items.map((item) => (
                <li key={item} className="whitespace-pre-wrap break-words">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {nextStep ? <div className="text-current/80">Next: {nextStep}</div> : null}
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
