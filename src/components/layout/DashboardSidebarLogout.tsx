"use client";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { designSystem } from "@/config/design-system";
import { useSharedLogout } from "@/hooks/useSharedLogout";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useState } from "react";

/**
 * Sidebar logout control shared by athlete, coach, and academy admin dashboards.
 * Opens the global {@link LogoutConfirmDialog} before signing out.
 */
export function DashboardSidebarLogout() {
  const [open, setOpen] = useState(false);
  const { link, logout } = designSystem.layout.sidebar;
  const logoutUser = useSharedLogout();

  return (
    <>
      <button
        type="button"
        className={cn(link, logout)}
        onClick={() => setOpen(true)}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Logout</span>
      </button>
      <LogoutConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={logoutUser}
      />
    </>
  );
}
