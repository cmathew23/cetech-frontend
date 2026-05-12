import { adminPaths } from "@/config/adminNav";
import {
  Building2,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Link2,
  Mail,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  id?: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const adminSidebarNavItems: DashboardNavItem[] = [
  { id: "overview", label: "Dashboard", href: adminPaths.dashboard, icon: LayoutDashboard },
  { id: "aboutAcademy", label: "About Academy", href: adminPaths.aboutAcademy, icon: Building2 },
  { id: "members", label: "Members", href: adminPaths.members, icon: Users },
  { id: "invitations", label: "Invitations", href: adminPaths.invitations, icon: Mail },
  { id: "assignments", label: "Assignments", href: adminPaths.assignments, icon: Link2 },
  { id: "coaches", label: "Coaches", href: adminPaths.coaches, icon: ShieldCheck },
  { id: "athletes", label: "Athletes", href: adminPaths.athletes, icon: UserRound },
  { id: "settings", label: "Settings", href: adminPaths.profileSettings, icon: Settings },
];

export const coachSidebarNavItems: DashboardNavItem[] = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/athletes", label: "Athletes", icon: Users },
  { href: "/coach/training-plans", label: "Training Plan", icon: Calendar },
  { href: "/coach/dashboard/invitations", label: "Invitations", icon: Mail },
];

export const athleteSidebarNavItems: DashboardNavItem[] = [
  { href: "/athlete/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/athlete/weekly-plan", label: "Weekly Plan", icon: Calendar },
  { href: "/athlete/coaches", label: "Coaches", icon: Users },
  { href: "/athlete/dashboard/invitations", label: "Invitations", icon: Mail },
  { href: "/athlete/profile-planning", label: "Athlete Profile Planning", icon: ClipboardList },
  { href: "/athlete/settings", label: "Settings", icon: Settings },
];

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function resolveDashboardHeaderIcon(pathname: string | null | undefined): LucideIcon | null {
  if (!pathname) return null;
  const normalized = normalizePathname(pathname);
  const allItems = [
    ...adminSidebarNavItems,
    ...coachSidebarNavItems,
    ...athleteSidebarNavItems,
  ];

  let best: DashboardNavItem | null = null;
  let bestScore = -1;
  for (const item of allItems) {
    if (normalized === item.href) {
      const score = item.href.length + 1000;
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
      continue;
    }
    if (normalized.startsWith(`${item.href}/`)) {
      const score = item.href.length;
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
  }
  return best?.icon ?? null;
}
