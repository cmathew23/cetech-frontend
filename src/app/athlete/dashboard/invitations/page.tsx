import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { AthleteInvitationsPageContent } from "@/components/dashboard/athlete/AthleteInvitationsPageContent";
import { AthleteWeeklyAdherenceOverview } from "@/components/dashboard/athlete/AthleteWeeklyAdherenceOverview";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AthleteDashboardInvitationsPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="w-full max-w-4xl space-y-4">
        <PageHeader
          title="Invitations"
          subtitle="Pending academy invitations. Accept or decline to continue."
          trailing={<AthleteHeaderIdentityMetadata />}
        />
        <AthleteWeeklyAdherenceOverview />
        <AthleteInvitationsPageContent />
      </div>
    </DashboardLayout>
  );
}
