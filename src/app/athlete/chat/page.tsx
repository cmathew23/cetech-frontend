import { AthleteChatPageContent } from "@/components/dashboard/athlete/AthleteChatPageContent";
import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AthleteChatPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <AthleteChatPageContent />
    </DashboardLayout>
  );
}
