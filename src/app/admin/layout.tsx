"use client";

import { AdminSidebar } from "@/components/dashboard/admin/AdminSidebar";
import { DashboardGate } from "@/components/layout/DashboardGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardGate>
      <DashboardLayout sidebar={<AdminSidebar />}>{children}</DashboardLayout>
    </DashboardGate>
  );
}
