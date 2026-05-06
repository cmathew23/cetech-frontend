"use client";

import { PageHeader } from "@/components/layout/PageHeader";

/** Coach Name / Academy metadata comes from {@link PageHeader} on `/coach/*` routes. */
export function CoachDashboardHeader() {
  return (
    <PageHeader
      title="Coach Dashboard"
      subtitle="Your academy context, release settings, and assigned athletes."
    />
  );
}
