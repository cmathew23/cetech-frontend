import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { PeakFlowSwingPageContent } from "@/components/dashboard/athlete/PeakFlowSwingPageContent";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function PeakFlowSwingPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <PeakFlowSwingPageContent />
    </DashboardLayout>
  );
}
