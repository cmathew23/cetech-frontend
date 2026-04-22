"use client";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { designSystem } from "@/config/design-system";
import { performClientLogout } from "@/lib/logoutClient";
import { cn } from "@/lib/utils";
import { useState } from "react";

/**
 * Sidebar logout control shared by athlete, coach, and academy admin dashboards.
 * Opens the global {@link LogoutConfirmDialog} before signing out.
 */
export function DashboardSidebarLogout() {
  const [open, setOpen] = useState(false);
  const { link, logout } = designSystem.layout.sidebar;

  return (
    <>
      <button
        type="button"
        className={cn(link, logout)}
        onClick={() => setOpen(true)}
      >
        Logout
      </button>
      <LogoutConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => performClientLogout()}
      />
    </>
  );
}
