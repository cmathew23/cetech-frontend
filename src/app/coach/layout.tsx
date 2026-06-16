"use client";

import { CoachSidebar } from "@/components/dashboard/coach/CoachSidebar";
import { CoachPageReadyProvider } from "@/components/dashboard/coach/CoachPageReadyContext";
import { DashboardGate } from "@/components/layout/DashboardGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { ReactNode } from "react";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardGate>
      <CoachPageReadyProvider>
        <DashboardLayout sidebar={<CoachSidebar />}>{children}</DashboardLayout>
      </CoachPageReadyProvider>
    </DashboardGate>
  );
}
