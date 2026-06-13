import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { PageHeader } from "@/components/layout/PageHeader";

export function AthleteDashboardHeader() {
  return (
    <PageHeader
      title="Athlete Dashboard"
      subtitle="Your training overview and academy activity."
      trailing={<AthleteHeaderIdentityMetadata />}
    />
  );
}
