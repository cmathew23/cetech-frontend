import { AthleteDashboardHeader } from "@/components/dashboard/athlete/AthleteDashboardHeader";
import { AthleteInvitationsPageContent } from "@/components/dashboard/athlete/AthleteInvitationsPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AthleteInvitationsPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="space-y-4">
        <AthleteDashboardHeader />
        <AthleteInvitationsPageContent />
      </div>
    </DashboardLayout>
  );
}

