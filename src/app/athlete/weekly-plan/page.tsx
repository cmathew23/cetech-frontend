import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { AthleteWeeklyPlanJournalPageContent } from "@/components/dashboard/athlete/AthleteWeeklyPlanJournalPageContent";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AthleteWeeklyPlanPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <AthleteWeeklyPlanJournalPageContent />
    </DashboardLayout>
  );
}
