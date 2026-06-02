import { AthleteSidebar } from "@/components/dashboard/athlete/AthleteSidebar";
import { AthleteFynAssistantPageContent } from "@/components/dashboard/athlete/AthleteFynAssistantPageContent";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AthleteFynPage() {
  return (
    <DashboardLayout sidebar={<AthleteSidebar />}>
      <AthleteFynAssistantPageContent />
    </DashboardLayout>
  );
}
