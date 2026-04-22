import { AthleteProfilePlanningPageContent } from "@/components/dashboard/athlete/AthleteProfilePlanningPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AthleteProfilePlanningPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
            Athlete Profile Planning
          </h1>
          <p className="text-sm text-textSecondary">
            View your planning profile bootstrap state from the backend.
          </p>
        </header>
        <AthleteProfilePlanningPageContent />
      </div>
    </DashboardLayout>
  );
}
