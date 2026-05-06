import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { AthleteCoachesPageContent } from "@/components/dashboard/athlete/AthleteCoachesPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AthleteCoachesPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="space-y-4">
        <PageHeader
          title="Coaches"
          subtitle="Coaches currently assigned to you."
          trailing={<AthleteHeaderIdentityMetadata />}
        />
        <AthleteCoachesPageContent />
      </div>
    </DashboardLayout>
  );
}
