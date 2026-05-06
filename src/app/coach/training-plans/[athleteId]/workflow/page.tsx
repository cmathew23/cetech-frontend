import { CoachAthletePlanningProfileView } from "@/components/dashboard/coach/CoachAthletePlanningProfileView";

export default async function CoachTrainingPlanWorkflowPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  return <CoachAthletePlanningProfileView athleteId={athleteId} />;
}
