"use client";

import { AdminHeaderIdentityMetadata } from "@/components/dashboard/admin/AdminHeaderIdentityMetadata";
import { CoachHeaderIdentityMetadata } from "@/components/dashboard/coach/CoachHeaderIdentityMetadata";
import { resolveDashboardHeaderIcon } from "@/config/dashboardNav";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { createElement, type ReactNode } from "react";

/** Canonical left accent for all dashboard PageHeaders (`border-l-4 border-l-primary`). */
const PAGE_HEADER_ACCENT_COLUMN_CLASS =
  "page-header-accent min-w-0 flex-1 border-l-4 border-l-primary pl-4 sm:pl-5";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Below subtitle, inside the accented column (e.g. dashboard context labels). */
  trailing?: ReactNode;
  /** Right side on md+ (e.g. Edit, Back links). */
  actions?: ReactNode;
  className?: string;
  /** Optional override for the page title typography. */
  titleClassName?: string;
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
  titleClassName,
}: PageHeaderProps) {
  const pathname = usePathname();
  const HeaderIcon = resolveDashboardHeaderIcon(pathname);
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isCoachRoute = pathname?.startsWith("/coach") ?? false;

  return (
    <header
      className={cn(
        "w-full min-w-0 border-b border-border bg-bg/70 pb-5 pt-1 sm:pb-6 sm:pt-2",
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className={PAGE_HEADER_ACCENT_COLUMN_CLASS}>
          <div className="flex items-center gap-2.5">
            {HeaderIcon ? (
              createElement(HeaderIcon, {
                className: "page-header-icon h-5 w-5 text-primary/80",
                "aria-hidden": true,
              })
            ) : null}
            <h1
              className={cn(
                "text-2xl font-medium tracking-tight text-textPrimary sm:text-3xl",
                titleClassName,
              )}
            >
              {title}
            </h1>
          </div>
          {subtitle ? (
            <p className="mt-1 max-w-3xl text-sm font-normal leading-relaxed text-textSecondary sm:text-base">
              {subtitle}
            </p>
          ) : null}
          {isAdminRoute || isCoachRoute || trailing ? (
            <div className="mt-3 min-w-0 space-y-3">
              {isAdminRoute ? <AdminHeaderIdentityMetadata /> : null}
              {isCoachRoute ? <CoachHeaderIdentityMetadata /> : null}
              {trailing ?? null}
            </div>
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
