"use client";

import { InvitationInboxSection } from "@/components/invitations/InvitationInboxSection";
import { useAuth } from "@/hooks/useAuth";
import { routeFromAccessContext } from "@/lib/accessContext";
import { dashboardPanelClass } from "@/lib/auth-ui";
import { useRouter } from "next/navigation";

export default function CoachDashboardInvitationsPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();

  async function handleActionComplete() {
    const session = await refreshSession();
    const nextRoute = routeFromAccessContext(session?.accessContext);
    if (nextRoute && nextRoute !== "/coach/dashboard/invitations") {
      router.replace(nextRoute);
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Invitations
        </h2>
        <p className="text-base text-gray-500">
          Pending academy invitations. Accept or decline to continue.
        </p>
      </header>

      <InvitationInboxSection
        className={dashboardPanelClass}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
