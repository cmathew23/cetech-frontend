"use client";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { useSharedLogout } from "@/hooks/useSharedLogout";
import { useState } from "react";

/**
 * Inline logout control (e.g. headers) using the same confirmation dialog as dashboard sidebars.
 */
export function DashboardLogoutButton() {
  const [open, setOpen] = useState(false);
  const logoutUser = useSharedLogout();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 text-sm font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
      >
        Logout
      </button>
      <LogoutConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={logoutUser}
      />
    </>
  );
}
