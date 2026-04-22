import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { AthleteSettingsPageContent } from "@/components/dashboard/athlete/AthleteSettingsPageContent";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AthleteSettingsPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
            Settings
          </h1>
          <p className="text-sm text-textSecondary">
            Read-only account and athlete profile details captured by the system.
          </p>
        </header>
        <AthleteSettingsPageContent />
      </div>
    </DashboardLayout>
  );
}
