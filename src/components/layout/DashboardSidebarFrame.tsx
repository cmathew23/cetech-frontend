"use client";

import { DashboardSidebarLogout } from "@/components/layout/DashboardSidebarLogout";
import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DashboardSidebarFrameProps = {
  navAriaLabel: string;
  brand: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Shared chrome for role sidebars: brand block, nav stack, then logout (not flex-pinned to bottom).
 */
export function DashboardSidebarFrame({
  navAriaLabel,
  brand,
  children,
  className,
}: DashboardSidebarFrameProps) {
  const { root, brand: brandSlot, nav } = designSystem.layout.sidebar;

  return (
    <aside className={cn(root, className)}>
      <div className={brandSlot}>{brand}</div>
      <nav className={cn(nav, "min-h-0 overflow-y-auto")} aria-label={navAriaLabel}>
        {children}
        <DashboardSidebarLogout />
      </nav>
    </aside>
  );
}
