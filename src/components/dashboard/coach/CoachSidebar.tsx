"use client";

import { DashboardSidebarFrame } from "@/components/layout/DashboardSidebarFrame";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { coachSidebarNavItems } from "@/config/dashboardNav";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CoachSidebar() {
  const pathname = usePathname();
  const { link, linkActive } = designSystem.layout.sidebar;
  const { unreadCount: chatUnreadCount } = useChatUnreadCount({ enabled: true });
  const coachChatRoute = "/coach/chat";

  return (
    <DashboardSidebarFrame
      navAriaLabel="Coach sidebar"
      brand={
        <>
          <p className="text-sm font-medium tracking-wide text-white/90">
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
        const linkClass = cn(link, "font-normal", active && linkActive, active && "!font-medium");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={linkClass}
            aria-current={active ? "page" : undefined}
          >
            <span className="inline-flex min-w-0 flex-1 items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
              {item.href === coachChatRoute && chatUnreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">
                  {chatUnreadCount}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </DashboardSidebarFrame>
  );
}
