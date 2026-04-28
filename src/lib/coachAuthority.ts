export function normalizeCoachFunctionValue(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function currentCoachHasSkillsFunction(functions: string[]): boolean {
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
  functions: string[];
}): boolean {
  return input.hasHeadCoachConfigured
    ? currentCoachIsHeadCoach(input.academyCoachRole)
    : currentCoachHasSkillsFunction(input.functions);
}
