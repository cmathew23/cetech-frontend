import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { AthleteProfilePlanningPageContent } from "@/components/dashboard/athlete/AthleteProfilePlanningPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AthleteProfilePlanningPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="space-y-4">
        <PageHeader
          title="Athlete Profile Planning"
          subtitle="View your planning profile bootstrap state from the backend."
          trailing={<AthleteHeaderIdentityMetadata />}
        />
        <AthleteProfilePlanningPageContent />
      </div>
    </DashboardLayout>
  );
}
