import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { AthleteSettingsPageContent } from "@/components/dashboard/athlete/AthleteSettingsPageContent";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AthleteSettingsPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="space-y-4">
        <PageHeader
          title="Settings"
          subtitle="Read-only account and athlete profile details captured by the system."
          trailing={<AthleteHeaderIdentityMetadata />}
        />
        <AthleteSettingsPageContent />
      </div>
    </DashboardLayout>
  );
}
