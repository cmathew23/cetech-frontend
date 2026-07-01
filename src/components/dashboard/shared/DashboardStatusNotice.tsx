import type { ReactNode } from "react";

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
  info: "border-slate-300 bg-slate-50/70 text-slate-700",
  success: "border-emerald-300 bg-emerald-50/70 text-emerald-900",
  warning: "border-amber-300 bg-amber-50/70 text-amber-950",
  blocker: "border-orange-400 bg-orange-50/70 text-orange-950",
  error: "border-red-400 bg-red-50/70 text-red-950",
  loading: "border-primary/40 bg-primary/10 text-textPrimary",
  empty: "border-slate-200 bg-slate-50/50 text-textSecondary",
};

const DEFAULT_PREFIX: Partial<Record<DashboardStatusNoticeType, string>> = {
  success: "+",
  warning: "!",
  blocker: "!",
  error: "!",
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
  const prefix = icon ?? (showPrefix ? DEFAULT_PREFIX[type] : null);
  const role = type === "error" || type === "blocker" ? "alert" : "status";

  return (
    <div
      className={cn(
        "min-w-0 border-l-2 px-3 text-sm",
        compact ? "py-2" : "py-3",
        NOTICE_STYLES[type],
        className,
      )}
      role={role}
      aria-live={type === "loading" ? "polite" : undefined}
    >
      <div className="flex min-w-0 items-start gap-2">
        {prefix ? (
          <span
            className={cn(
              "mt-0.5 shrink-0 text-xs font-medium leading-none",
              type === "loading" ? "h-2 w-2 animate-pulse rounded-full bg-current text-transparent" : "",
            )}
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
