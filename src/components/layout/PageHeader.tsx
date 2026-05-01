"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Below subtitle, inside the accented column (e.g. dashboard context labels). */
  trailing?: ReactNode;
  /** Right side on md+ (e.g. Edit, Back links). */
  actions?: ReactNode;
  className?: string;
};

/**
 * Shared dashboard page chrome: title, optional subtitle, subtle orange left accent,
 * bottom divider, optional trailing/actions.
 */
export function PageHeader({
  title,
  subtitle,
  trailing,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "w-full min-w-0 border-b border-border bg-bg/70 pb-5 pt-1 sm:pb-6 sm:pt-2",
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0 flex-1 border-l-4 border-l-primary pl-4 sm:pl-5">
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-textSecondary sm:text-base">
              {subtitle}
            </p>
          ) : null}
          {trailing ? (
            <div className="mt-3 min-w-0">{trailing}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:pt-1">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
