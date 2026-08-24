import { adminPaths } from "@/config/adminNav";
import {
  Activity,
  Building2,
  Calendar,
  MessageSquare,
  ClipboardList,
  LayoutDashboard,
  Link2,
  Mail,
  Settings,
  Sparkles,
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
  { href: "/coach/athlete-performance", label: "Athlete Performance", icon: Activity },
  { href: "/coach/athletes", label: "Athletes", icon: Users },
  { href: "/coach/chat", label: "Chat with Athlete", icon: MessageSquare },
  { href: "/coach/fyn", label: "Fyn Assistant", icon: Sparkles },
  { href: "/coach/training-plans", label: "Training Plan", icon: Calendar },
  { href: "/coach/dashboard/invitations", label: "Invitations", icon: Mail },
  { href: "/coach/settings", label: "Settings", icon: Settings },
];

export const athleteSidebarNavItems: DashboardNavItem[] = [
  { href: "/athlete/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/athlete/weekly-plan", label: "Weekly Plan", icon: Calendar },
  { href: "/athlete/chat", label: "Chat with Coach", icon: MessageSquare },
  { href: "/athlete/fyn", label: "Fyn Assistant", icon: Sparkles },
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

/** Athlete-scoped training-plan workflow routes hosted under `/coach/athletes/...`. */
const COACH_ATHLETE_TRAINING_PLAN_ROUTE =
  /^\/coach\/athletes\/[^/]+\/(?:planning-profile|level-validation)(?:\/|$)/;

export function isCoachTrainingPlanRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = normalizePathname(pathname);
  if (path === "/coach/training-plans" || path.startsWith("/coach/training-plans/")) {
    return true;
  }
  return COACH_ATHLETE_TRAINING_PLAN_ROUTE.test(path);
}

/**
 * Sidebar active-state resolution for coach nav items.
 * Training Plan owns all training-plan workflow routes, including athlete-specific
 * planning/detail/review pages under `/coach/athletes/...`.
 */
export function isCoachSidebarNavItemActive(
  pathname: string | null | undefined,
  href: string,
): boolean {
  if (!pathname) return false;
  const path = normalizePathname(pathname);
  const itemHref = normalizePathname(href);

  if (itemHref === "/coach/dashboard") {
    return path === itemHref;
  }

  if (itemHref === "/coach/training-plans") {
    return isCoachTrainingPlanRoute(path);
  }

  if (itemHref === "/coach/athletes") {
    if (isCoachTrainingPlanRoute(path)) return false;
    return path === itemHref || path.startsWith(`${itemHref}/`);
  }

  return path === itemHref || path.startsWith(`${itemHref}/`);
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
