"use client";

import { DashboardSidebarFrame } from "@/components/layout/DashboardSidebarFrame";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const COACH_NAV_ITEMS = [
  { href: "/coach/dashboard", label: "Dashboard" },
  { href: "/coach/invitations", label: "Invitations" },
] as const;

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
      {COACH_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(link, active && linkActive)}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </DashboardSidebarFrame>
  );
}
