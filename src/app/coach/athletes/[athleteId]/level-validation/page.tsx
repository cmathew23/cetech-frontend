import { CoachAthleteLevelValidationView } from "@/components/dashboard/coach/CoachAthleteLevelValidationView";

export default async function CoachAthleteLevelValidationPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  return <CoachAthleteLevelValidationView athleteId={athleteId} />;
}
