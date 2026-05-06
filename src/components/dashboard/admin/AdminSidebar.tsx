"use client";

import { adminSidebarNavItems } from "@/config/dashboardNav";
import { DashboardSidebarFrame } from "@/components/layout/DashboardSidebarFrame";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminSidebarSection =
  | "overview"
  | "aboutAcademy"
  | "members"
  | "invitations"
  | "assignments"
  | "coaches"
  | "athletes"
  | "settings";

export function AdminSidebar() {
  const pathname = usePathname();
  const { link, linkActive } = designSystem.layout.sidebar;

  return (
    <DashboardSidebarFrame
      navAriaLabel="Academy admin sidebar"
      brand={
        <>
          <p className="text-sm font-semibold tracking-wide text-white/90">
            PEAKFLOW AMS
          </p>
          <p className="mt-1 text-xs text-gray-400">Academy Admin</p>
        </>
      }
    >
      {adminSidebarNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(link, isActive && linkActive)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </DashboardSidebarFrame>
  );
}
