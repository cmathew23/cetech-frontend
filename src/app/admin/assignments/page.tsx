"use client";

import { AcademyAdminWorkspacePage } from "@/components/dashboard/admin/AcademyAdminWorkspacePage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Reads `?athleteProfileId=` via client-safe API; wrapped in Suspense for Next.js `useSearchParams` rules.
 */
function AdminAssignmentsWithSearchParams() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("athleteProfileId");
  const initialAthleteProfileId =
    typeof raw === "string" ? raw.trim() : "";

  return (
    <AcademyAdminWorkspacePage
      section="assignments"
      initialAthleteProfileId={initialAthleteProfileId}
    />
  );
}

export default function AdminAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
          Loading…
        </div>
      }
    >
      <AdminAssignmentsWithSearchParams />
    </Suspense>
  );
}
