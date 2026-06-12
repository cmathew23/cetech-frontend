"use client";

"use client";

import { AthletePageReadyProvider } from "@/components/dashboard/athlete/AthletePageReadyContext";
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
        <AthletePageReadyProvider>{children}</AthletePageReadyProvider>
      </AthleteInvitationProvider>
    </DashboardGate>
  );
}
