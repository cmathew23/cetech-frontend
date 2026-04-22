"use client";

import { adminPaths } from "@/config/adminNav";
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

type NavItem = {
  id: AdminSidebarSection;
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Dashboard", href: adminPaths.dashboard },
  {
    id: "aboutAcademy",
    label: "About Academy",
    href: adminPaths.aboutAcademy,
  },
  { id: "members", label: "Members", href: adminPaths.members },
  {
    id: "invitations",
    label: "Invitations",
    href: adminPaths.invitations,
  },
  {
    id: "assignments",
    label: "Assignments",
    href: adminPaths.assignments,
  },
  {
    id: "coaches",
    label: "Coaches",
    href: adminPaths.coaches,
  },
  {
    id: "athletes",
    label: "Athletes",
    href: adminPaths.athletes,
  },
  {
    id: "settings",
    label: "Settings",
    href: adminPaths.profileSettings,
  },
];

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
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(link, isActive && linkActive)}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </DashboardSidebarFrame>
  );
}
