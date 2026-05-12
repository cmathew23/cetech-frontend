export type GenerationDomain = "SKILLS" | "NUTRITION" | "S_AND_C";
export type CoachFunction =
  | "SKILLS_COACH"
  | "NUTRITION_COACH"
  | "STRENGTH_AND_CONDITIONING_COACH";

export function normalizeCoachFunctionValue(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function currentCoachHasSkillsFunction(
  functions: ReadonlyArray<CoachFunction | string>,
): boolean {
  return functions.some((value) => {
    const normalized = normalizeCoachFunctionValue(value);
    return normalized === "SKILLS" || normalized === "SKILLS_COACH";
  });
}

export function currentCoachIsHeadCoach(role: string | null | undefined): boolean {
  return role?.trim().toUpperCase() === "HEAD_COACH";
}

export function canCoachValidateLevel(input: {
  hasHeadCoachConfigured: boolean;
  academyCoachRole: string | null | undefined;
  functions: ReadonlyArray<CoachFunction | string>;
}): boolean {
  return input.hasHeadCoachConfigured
    ? currentCoachIsHeadCoach(input.academyCoachRole)
    : currentCoachHasSkillsFunction(input.functions);
}

/** Single plan-creation track derived from coach authority.functions (same domain order as planning profile generation). */
export type CoachPlanCreationDomain = GenerationDomain;

const PLAN_DOMAIN_ORDER: CoachPlanCreationDomain[] = [
  "SKILLS",
  "NUTRITION",
  "S_AND_C",
];

export function coachFunctionToPlanDomain(
  value: CoachFunction | string,
): CoachPlanCreationDomain | null {
  const normalized = normalizeCoachFunctionValue(value);
  if (normalized === "SKILLS" || normalized === "SKILLS_COACH") return "SKILLS";
  if (normalized === "NUTRITION" || normalized === "NUTRITION_COACH") {
    return "NUTRITION";
  }
  if (
    normalized === "S_AND_C" ||
    normalized === "STRENGTH_AND_CONDITIONING" ||
    normalized === "S_AND_C_COACH" ||
    normalized === "STRENGTH_AND_CONDITIONING_COACH"
  ) {
    return "S_AND_C";
  }
  return null;
}

export function derivePrimaryCoachPlanDomain(
  functions: ReadonlyArray<CoachFunction | string>,
): CoachPlanCreationDomain | null {
  const domains = new Set<CoachPlanCreationDomain>();
  for (const value of functions) {
    const domain = coachFunctionToPlanDomain(value);
    if (domain) domains.add(domain);
  }
  for (const domain of PLAN_DOMAIN_ORDER) {
    if (domains.has(domain)) return domain;
  }
  return null;
}

export function coachPlanCreationButtonLabel(
  domain: CoachPlanCreationDomain,
): string {
  if (domain === "SKILLS") return "Create Skills Plan";
  if (domain === "NUTRITION") return "Create Nutrition Plan";
  return "Create S&C Plan";
}

export function generationDomainToCoachFunction(
  domain: GenerationDomain,
): CoachFunction {
  if (domain === "SKILLS") return "SKILLS_COACH";
  if (domain === "NUTRITION") return "NUTRITION_COACH";
  return "STRENGTH_AND_CONDITIONING_COACH";
}
