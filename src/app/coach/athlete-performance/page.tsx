"use client";

import { CoachAthletePerformancePageContent } from "@/components/dashboard/coach/CoachAthletePerformancePageContent";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CoachAthletePerformanceWithSearchParams() {
  const searchParams = useSearchParams();
  return (
    <CoachAthletePerformancePageContent
      basketballCoachEntrySearch={searchParams.toString()}
    />
  );
}

export default function CoachAthletePerformancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
          Loading…
        </div>
      }
    >
      <CoachAthletePerformanceWithSearchParams />
    </Suspense>
  );
}
