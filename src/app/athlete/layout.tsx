"use client";

import { AthleteInvitationProvider } from "@/components/dashboard/athlete/AthleteInvitationProvider";
import { DashboardGate } from "@/components/layout/DashboardGate";

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardGate>
      <AthleteInvitationProvider>
        {children}
      </AthleteInvitationProvider>
    </DashboardGate>
  );
}
