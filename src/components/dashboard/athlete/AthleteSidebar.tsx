"use client";

import { DashboardSidebarFrame } from "@/components/layout/DashboardSidebarFrame";
import { useAthleteInvitationGate } from "@/components/dashboard/athlete/useAthleteInvitationGate";
import {
  ATHLETE_CHAT_PAGE_READY_EVENT,
  useChatUnreadCount,
} from "@/hooks/useChatUnreadCount";
import { athleteSidebarNavItems } from "@/config/dashboardNav";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AthleteSidebar() {
  const pathname = usePathname();
  const { link, linkActive } = designSystem.layout.sidebar;
  const { invitationAccessLocked, pendingCount, isGateReady } =
    useAthleteInvitationGate();
  const athleteChatRoute = "/athlete/chat";
  const [isAthleteChatPageReady, setIsAthleteChatPageReady] = useState(
    pathname !== athleteChatRoute,
  );
  const { unreadCount: chatUnreadCount } = useChatUnreadCount({
    enabled: pathname !== athleteChatRoute || isAthleteChatPageReady,
    clearOnError: true,
  });
  const athleteNavLocked = isGateReady && invitationAccessLocked;

  useEffect(() => {
    setIsAthleteChatPageReady(pathname !== athleteChatRoute);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== athleteChatRoute) return;

    const handleChatPageReady = () => {
      setIsAthleteChatPageReady(true);
    };

    window.addEventListener(ATHLETE_CHAT_PAGE_READY_EVENT, handleChatPageReady);

    return () => {
      window.removeEventListener(ATHLETE_CHAT_PAGE_READY_EVENT, handleChatPageReady);
    };
  }, [pathname]);

  return (
    <DashboardSidebarFrame
      navAriaLabel="Athlete sidebar"
      brand={
        <>
          <p className="text-sm font-semibold tracking-wide text-white/90">
            PEAKFLOW AMS
          </p>
          <p className="mt-1 text-xs text-gray-400">Athlete</p>
        </>
      }
    >
      {athleteSidebarNavItems.map((item) => {
        const Icon = item.icon;
        const invitationRoute = "/athlete/dashboard/invitations";
        const gatedOff =
          athleteNavLocked && item.href !== invitationRoute;
        const active = athleteNavLocked
          ? item.href === invitationRoute
          : item.href === "/athlete/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
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
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
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
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                  {item.href === athleteChatRoute && chatUnreadCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">
                      {chatUnreadCount}
                    </span>
                  ) : null}
                  {item.href === invitationRoute &&
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
