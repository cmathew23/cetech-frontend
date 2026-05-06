import { redirect } from "next/navigation";

/** Canonical workflow URL is under `/coach/training-plans/...` so sidebar highlights Training Plan. */
export default async function CoachAthletePlanningProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ athleteId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        qs.append(key, entry);
      }
    } else {
      qs.append(key, value);
    }
  }
  const query = qs.toString();
  const path = `/coach/training-plans/${encodeURIComponent(athleteId)}/workflow`;
  redirect(query === "" ? path : `${path}?${query}`);
}
