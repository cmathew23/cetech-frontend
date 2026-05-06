"use client";

import { AdminAcademyProvider } from "@/components/dashboard/admin/AdminAcademyProvider";
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
      <AdminAcademyProvider>
        <DashboardLayout sidebar={<AdminSidebar />}>{children}</DashboardLayout>
      </AdminAcademyProvider>
    </DashboardGate>
  );
}
