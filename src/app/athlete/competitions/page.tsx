import { AthleteCompetitionsPageContent } from "@/components/dashboard/athlete/AthleteCompetitionsPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AthleteCompetitionsPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <AthleteCompetitionsPageContent />
    </DashboardLayout>
  );
}
