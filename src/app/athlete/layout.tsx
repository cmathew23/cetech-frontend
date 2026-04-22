"use client";

import { AthleteInvitationProvider } from "@/components/dashboard/athlete/AthleteInvitationProvider";
import { AthleteRouteGate } from "@/components/dashboard/athlete/AthleteRouteGate";

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AthleteInvitationProvider>
      <AthleteRouteGate>{children}</AthleteRouteGate>
    </AthleteInvitationProvider>
  );
}
