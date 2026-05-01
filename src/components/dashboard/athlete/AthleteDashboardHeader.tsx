import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";

export function AthleteDashboardHeader() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Athlete Dashboard"
        subtitle="Your training overview, schedule, and academy activity."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full min-w-0 sm:w-56">
          <Input type="text" placeholder="Search" />
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm text-textSecondary shadow-sm"
        >
          Notifications
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm text-textSecondary shadow-sm"
        >
          Profile
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm text-textSecondary shadow-sm"
        >
          Date
        </button>
      </div>
    </div>
  );
}

