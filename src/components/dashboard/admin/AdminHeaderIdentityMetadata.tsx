"use client";

import { useAdminAcademy } from "@/components/dashboard/admin/AdminAcademyProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  resolveAcademyHeaderDisplayName,
  resolveAdminDisplayName,
} from "@/lib/adminHeaderIdentity";
import { useMemo } from "react";

/**
 * Admin Name / Academy rows for {@link PageHeader} `trailing` on `/admin/*` routes.
 * Same data + typography as the previous layout-level strip.
 */
export function AdminHeaderIdentityMetadata() {
  const { accessContext } = useAuth();
  const { academyProfile, profileMe } = useAdminAcademy();

  const adminDisplay = useMemo(() => {
    const raw = resolveAdminDisplayName(
      accessContext?.user,
      academyProfile,
      profileMe,
    ).trim();
    return raw !== "" ? raw : "—";
  }, [accessContext?.user, academyProfile, profileMe]);

  const academyDisplay = useMemo(() => {
    const raw = resolveAcademyHeaderDisplayName(academyProfile).trim();
    return raw !== "" ? raw : "—";
  }, [academyProfile]);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-textSecondary">
          Admin Name:
        </span>
        <span className="text-sm font-medium text-textPrimary">{adminDisplay}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-textSecondary">Academy:</span>
        <span
          className="text-sm font-medium text-textPrimary"
          aria-live="polite"
        >
          {academyDisplay}
        </span>
      </div>
    </div>
  );
}
