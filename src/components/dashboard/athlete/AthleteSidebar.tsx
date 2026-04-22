"use client";

import { DashboardSidebarFrame } from "@/components/layout/DashboardSidebarFrame";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ATHLETE_NAV_ITEMS = [
  { href: "/athlete/dashboard", label: "Dashboard" },
  { href: "/athlete/invitations", label: "Invitations" },
  { href: "/athlete/profile-planning", label: "Athlete Profile Planning" },
  { href: "/athlete/settings", label: "Settings" },
] as const;

export function AthleteSidebar() {
  const pathname = usePathname();
  const { link, linkActive } = designSystem.layout.sidebar;
  const { hasActiveAcademyMembership, pendingCount, isGateReady } =
    useAthleteInvitationGate();
  const athleteNavLocked = isGateReady && !hasActiveAcademyMembership;

  return (
    <DashboardSidebarFrame
      navAriaLabel="Athlete sidebar"
      brand={
        <p className="text-sm font-semibold tracking-wide text-white/90">
          PEAKFLOW AMS
        </p>
      }
    >
      {ATHLETE_NAV_ITEMS.map((item) => {
        const gatedOff =
          athleteNavLocked && item.href !== "/athlete/invitations";
        const active = athleteNavLocked
          ? item.href === "/athlete/invitations"
          : pathname === item.href;
        const linkClass = cn(
          link,
          active && linkActive,
          gatedOff && "cursor-not-allowed opacity-45",
        );
        return (
          <div key={item.href} className="block w-full">
            {gatedOff ? (
              <span
                className={linkClass}
                aria-disabled="true"
                title="Accept an academy invitation to unlock this section."
              >
                <span className="inline-flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{item.label}</span>
                </span>
              </span>
            ) : (
              <Link
                href={item.href}
                className={linkClass}
                aria-current={active ? "page" : undefined}
              >
                <span className="inline-flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{item.label}</span>
                  {item.href === "/athlete/invitations" &&
                  isGateReady &&
                  pendingCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">
                      {pendingCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            )}
          </div>
        );
      })}
    </DashboardSidebarFrame>
  );
}
