import { AthleteHeaderIdentityMetadata } from "@/components/dashboard/athlete/AthleteHeaderIdentityMetadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AthleteDashboardHeader() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Athlete Dashboard"
        subtitle="Your training overview, schedule, and academy activity."
        trailing={<AthleteHeaderIdentityMetadata />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full min-w-0 sm:w-56">
          <Input type="text" placeholder="Search" />
        </div>
        <Button type="button" variant="neutral" className="h-10 px-3 text-sm">
          Notifications
        </Button>
        <Button type="button" variant="neutral" className="h-10 px-3 text-sm">
          Profile
        </Button>
        <Button type="button" variant="neutral" className="h-10 px-3 text-sm">
          Date
        </Button>
      </div>
    </div>
  );
}

