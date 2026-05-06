"use client";

import { PageHeader } from "@/components/layout/PageHeader";

/** Identity (Admin Name / Academy) is rendered globally from `app/admin/layout.tsx`. */
export function AdminDashboardHeader() {
  return (
    <PageHeader
      title="Academy Admin Dashboard"
      subtitle="Manage members, invitations, and assignments."
    />
  );
}
