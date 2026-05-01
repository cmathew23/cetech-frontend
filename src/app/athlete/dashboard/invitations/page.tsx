import { AthleteInvitationsPageContent } from "@/components/dashboard/athlete/AthleteInvitationsPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AthleteDashboardInvitationsPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="space-y-4">
        <PageHeader
          title="Invitations"
          subtitle="Pending academy invitations. Accept or decline to continue."
        />
        <AthleteInvitationsPageContent />
      </div>
    </DashboardLayout>
  );
}
