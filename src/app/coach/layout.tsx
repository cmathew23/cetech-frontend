"use client";

import { CoachSidebar } from "@/components/dashboard/coach/CoachSidebar";
import { DashboardGate } from "@/components/layout/DashboardGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { ReactNode } from "react";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardGate>
      <DashboardLayout sidebar={<CoachSidebar />}>{children}</DashboardLayout>
    </DashboardGate>
  );
}
