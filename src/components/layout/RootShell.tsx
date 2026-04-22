"use client";

import { designSystem } from "@/config/design-system";
import { usePathname } from "next/navigation";

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/membership-inactive" ||
    pathname?.startsWith("/login/") ||
    pathname?.startsWith("/register/") ||
    pathname?.startsWith("/forgot-password/") ||
    pathname?.startsWith("/reset-password/");
  const isAthleteRoute =
    pathname === "/athlete" || pathname?.startsWith("/athlete/");
  /** Full-width app shell: sidebar dashboards (no marketing header / max-w-4xl column). */
  const isRoleDashboardRoute =
    isAthleteRoute ||
    pathname === "/admin" ||
    pathname?.startsWith("/admin/") ||
    pathname === "/coach" ||
    pathname?.startsWith("/coach/");

  if (isAuthRoute || isRoleDashboardRoute) {
    return <div className={designSystem.layout.outerShell}>{children}</div>;
  }

  return (
    <div className={designSystem.layout.outerShell}>
      <div className={designSystem.layout.centeredColumn}>
        <header className={designSystem.layout.marketingHeader}>
          <h1 className={designSystem.layout.marketingTitle}>PEAKFLOW</h1>
          <p className={designSystem.layout.marketingSubtitle}>
            Athlete Management System (AMS)
          </p>
        </header>
        <div className={designSystem.layout.mainSlot}>{children}</div>
      </div>
    </div>
  );
}

