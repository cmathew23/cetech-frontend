"use client";

import { DashboardSidebarFrame } from "@/components/layout/DashboardSidebarFrame";
import { coachSidebarNavItems } from "@/config/dashboardNav";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CoachSidebar() {
  const pathname = usePathname();
  const { link, linkActive } = designSystem.layout.sidebar;

  return (
    <DashboardSidebarFrame
      navAriaLabel="Coach sidebar"
      brand={
        <>
          <p className="text-sm font-semibold tracking-wide text-white/90">
            PEAKFLOW AMS
          </p>
          <p className="mt-1 text-xs text-gray-400">Coach</p>
        </>
      }
    >
      {coachSidebarNavItems.map((item) => {
        const active =
          item.href === "/coach/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(link, active && linkActive)}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </DashboardSidebarFrame>
  );
}
