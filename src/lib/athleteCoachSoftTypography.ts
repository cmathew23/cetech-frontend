/** True when the current route is under athlete or coach dashboards. */
export function isAthleteOrCoachRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/athlete") || pathname.startsWith("/coach");
}
