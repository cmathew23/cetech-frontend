import { Input } from "@/components/ui/Input";

export function AthleteDashboardHeader() {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">
          Athlete Dashboard
        </h1>
        <p className="text-sm text-textSecondary">
          Layout shell preview with placeholder content.
        </p>
      </div>

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
    </header>
  );
}

