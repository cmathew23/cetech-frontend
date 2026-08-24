import {
  currentCoachIsHeadCoach,
  coachFunctionToPlanDomain,
  type CoachPlanCreationDomain,
} from "@/lib/coachAuthority";

export type AdminAssignmentWorkflowId = "W1" | "W2A" | "W2B" | "W3";

export type AdminAssignmentWorkflowCoachInput = {
  coachProfileId: string;
  displayName: string;
  role: string | null;
  functions: readonly string[];
  canGeneratePlan: boolean;
};

export type AdminAssignmentWorkflowDomainLine = {
  domain: CoachPlanCreationDomain;
  domainLabel: string;
  ownerCoachProfileId: string | null;
  ownerLabel: string;
  assigned: boolean;
  canGeneratePlan: boolean;
  summary: string;
};

export type AdminAssignmentWorkflowDisplay = {
  workflowId: AdminAssignmentWorkflowId | null;
  workflowTitle: string;
  operational: boolean;
  statusMessage: string | null;
  guidanceLine: string | null;
  headCoachAssigned: boolean;
  headCoachLabel: string;
  domainLines: AdminAssignmentWorkflowDomainLine[];
};

const DOMAIN_LABELS: Record<CoachPlanCreationDomain, string> = {
  SKILLS: "Skills",
  NUTRITION: "Nutrition",
  S_AND_C: "Strength & Conditioning",
};

const DOMAIN_COACH_LABELS: Record<CoachPlanCreationDomain, string> = {
  SKILLS: "Skills Coach",
  NUTRITION: "Nutrition Coach",
  S_AND_C: "S&C Coach",
};

const PLAN_GENERATION_NOT_ENABLED = "Plan generation not enabled.";
const INCOMPLETE_TITLE = "Incomplete planning configuration";
const OPERATIONAL_SUCCESS_MESSAGE =
  "All assigned plan generators currently have plan generation enabled.";
const OPERATIONAL_BLOCKED_MESSAGE =
  "Assigned configuration — one or more coaches do not have plan generation enabled.";

function coachHasDomain(
  coach: AdminAssignmentWorkflowCoachInput,
  domain: CoachPlanCreationDomain,
): boolean {
  return coach.functions.some((fn) => coachFunctionToPlanDomain(fn) === domain);
}

function isHeadCoachRow(coach: AdminAssignmentWorkflowCoachInput): boolean {
  return currentCoachIsHeadCoach(coach.role);
}

function resolveDomainOwner(
  coaches: readonly AdminAssignmentWorkflowCoachInput[],
  domain: CoachPlanCreationDomain,
  headCoach: AdminAssignmentWorkflowCoachInput | null,
): AdminAssignmentWorkflowCoachInput | null {
  const specialists = coaches.filter(
    (coach) =>
      coachHasDomain(coach, domain) &&
      (headCoach === null ||
        coach.coachProfileId.trim() !== headCoach.coachProfileId.trim()),
  );
  if (specialists.length > 0) return specialists[0] ?? null;
  if (headCoach && coachHasDomain(headCoach, domain)) return headCoach;
  return null;
}

function assignedStateSummary(
  coachLabel: string,
  assigned: boolean,
  canGeneratePlan: boolean,
): string {
  if (!assigned) return `No ${coachLabel} is assigned.`;
  if (canGeneratePlan) {
    return `${coachLabel} is assigned and plan generation is enabled.`;
  }
  return `${coachLabel} is assigned. ${PLAN_GENERATION_NOT_ENABLED}`;
}

function generatorSummary(
  coachLabel: string,
  canGeneratePlan: boolean,
  generateCopy: string,
): string {
  if (canGeneratePlan) return generateCopy;
  return `${coachLabel} is assigned. ${PLAN_GENERATION_NOT_ENABLED}`;
}

function domainLine(
  domain: CoachPlanCreationDomain,
  owner: AdminAssignmentWorkflowCoachInput | null,
  ownerLabel: string,
  summary: string,
): AdminAssignmentWorkflowDomainLine {
  return {
    domain,
    domainLabel: DOMAIN_LABELS[domain],
    ownerCoachProfileId: owner?.coachProfileId.trim() ?? null,
    ownerLabel,
    assigned: owner !== null,
    canGeneratePlan: owner?.canGeneratePlan === true,
    summary,
  };
}

/**
 * A workflow id is returned only when every required structural coach is present.
 */
function identifyCompleteWorkflow(
  headCoach: AdminAssignmentWorkflowCoachInput | null,
  separateSkillsCoach: AdminAssignmentWorkflowCoachInput | null,
  nutritionCoach: AdminAssignmentWorkflowCoachInput | null,
  sandCCoach: AdminAssignmentWorkflowCoachInput | null,
): AdminAssignmentWorkflowId | null {
  if (!nutritionCoach || !sandCCoach) return null;
  if (headCoach === null) {
    return separateSkillsCoach ? "W3" : null;
  }
  const headHasSkills = coachHasDomain(headCoach, "SKILLS");
  if (separateSkillsCoach && headHasSkills) return "W2B";
  if (!separateSkillsCoach && headHasSkills) return "W2A";
  if (separateSkillsCoach && !headHasSkills) return "W1";
  return null;
}

function workflowTitle(id: AdminAssignmentWorkflowId): string {
  switch (id) {
    case "W1":
      return "W1 — Head Coach reviews; domain coaches generate";
    case "W2A":
      return "W2A — Head Coach generates Skills; specialists generate other domains";
    case "W2B":
      return "W2B — Head Coach reviews; separate Skills Coach generates Skills";
    case "W3":
      return "W3 — No Head Coach";
  }
}

function incompleteGuidance(
  headCoach: AdminAssignmentWorkflowCoachInput | null,
  separateSkillsCoach: AdminAssignmentWorkflowCoachInput | null,
  nutritionCoach: AdminAssignmentWorkflowCoachInput | null,
  sandCCoach: AdminAssignmentWorkflowCoachInput | null,
): string | null {
  if (headCoach === null) {
    if (!separateSkillsCoach) {
      return "A Skills Coach is required to establish Workflow 3.";
    }
    if (!nutritionCoach) {
      return "A Nutrition Coach is required to establish Workflow 3.";
    }
    if (!sandCCoach) {
      return "An S&C Coach is required to establish Workflow 3.";
    }
    return null;
  }
  const headHasSkills = coachHasDomain(headCoach, "SKILLS");
  if (!headHasSkills && !separateSkillsCoach) {
    return "A Skills Coach is required to establish Workflow 1.";
  }
  if (headHasSkills && !separateSkillsCoach) {
    if (!nutritionCoach) {
      return "A Nutrition Coach is required to establish Workflow 2A.";
    }
    if (!sandCCoach) {
      return "An S&C Coach is required to establish Workflow 2A.";
    }
  }
  if (headHasSkills && separateSkillsCoach) {
    if (!nutritionCoach) {
      return "A Nutrition Coach is required to establish Workflow 2B.";
    }
    if (!sandCCoach) {
      return "An S&C Coach is required to establish Workflow 2B.";
    }
  }
  if (!headHasSkills && separateSkillsCoach) {
    if (!nutritionCoach) {
      return "A Nutrition Coach is required to establish Workflow 1.";
    }
    if (!sandCCoach) {
      return "An S&C Coach is required to establish Workflow 1.";
    }
  }
  return null;
}

/**
 * Informational description of the athlete's current assignments.
 * Uses existing `canGeneratePlan` flags; does not mutate them or invent permissions.
 */
export function describeAthletePlanningWorkflow(
  coaches: readonly AdminAssignmentWorkflowCoachInput[],
): AdminAssignmentWorkflowDisplay {
  const assigned = coaches.filter((c) => c.coachProfileId.trim() !== "");
  const headCoach = assigned.find((c) => isHeadCoachRow(c)) ?? null;
  const separateSkillsCoach =
    assigned.find(
      (c) =>
        coachHasDomain(c, "SKILLS") &&
        (headCoach === null ||
          c.coachProfileId.trim() !== headCoach.coachProfileId.trim()),
    ) ?? null;
  const nutritionCoach = resolveDomainOwner(assigned, "NUTRITION", headCoach);
  const sandCCoach = resolveDomainOwner(assigned, "S_AND_C", headCoach);

  const workflowId = identifyCompleteWorkflow(
    headCoach,
    separateSkillsCoach,
    nutritionCoach,
    sandCCoach,
  );

  if (workflowId === null) {
    const skillsAssigned = separateSkillsCoach !== null;
    return {
      workflowId: null,
      workflowTitle: INCOMPLETE_TITLE,
      operational: false,
      statusMessage: null,
      guidanceLine: incompleteGuidance(
        headCoach,
        separateSkillsCoach,
        nutritionCoach,
        sandCCoach,
      ),
      headCoachAssigned: headCoach !== null,
      headCoachLabel: headCoach
        ? "Head Coach is assigned."
        : "No Head Coach is assigned.",
      domainLines: [
        domainLine(
          "SKILLS",
          separateSkillsCoach,
          "Skills Coach",
          assignedStateSummary(
            "Skills Coach",
            skillsAssigned,
            separateSkillsCoach?.canGeneratePlan === true,
          ),
        ),
        domainLine(
          "NUTRITION",
          nutritionCoach,
          "Nutrition Coach",
          assignedStateSummary(
            "Nutrition Coach",
            nutritionCoach !== null,
            nutritionCoach?.canGeneratePlan === true,
          ),
        ),
        domainLine(
          "S_AND_C",
          sandCCoach,
          "S&C Coach",
          assignedStateSummary(
            "S&C Coach",
            sandCCoach !== null,
            sandCCoach?.canGeneratePlan === true,
          ),
        ),
      ],
    };
  }

  const skillsGenerator =
    workflowId === "W2A" ? headCoach : separateSkillsCoach;
  const skillsCanGenerate = skillsGenerator?.canGeneratePlan === true;
  const nutritionCanGenerate = nutritionCoach?.canGeneratePlan === true;
  const sandCCanGenerate = sandCCoach?.canGeneratePlan === true;

  const nutritionLine = domainLine(
    "NUTRITION",
    nutritionCoach,
    "Nutrition Coach",
    generatorSummary(
      "Nutrition Coach",
      nutritionCanGenerate,
      "Nutrition Coach generates the Nutrition plan.",
    ),
  );
  const sandCLine = domainLine(
    "S_AND_C",
    sandCCoach,
    "S&C Coach",
    generatorSummary(
      "S&C Coach",
      sandCCanGenerate,
      "S&C Coach generates the Strength & Conditioning plan.",
    ),
  );

  let headCoachLabel: string;
  let skillsLine: AdminAssignmentWorkflowDomainLine;

  if (workflowId === "W2A") {
    headCoachLabel = generatorSummary(
      "Head Coach",
      skillsCanGenerate,
      "Head Coach builds the Planning Context and generates the Skills plan.",
    );
    skillsLine = domainLine(
      "SKILLS",
      skillsGenerator,
      "Head Coach",
      generatorSummary(
        "Head Coach",
        skillsCanGenerate,
        "Head Coach builds the Planning Context and generates the Skills plan.",
      ),
    );
  } else if (workflowId === "W3") {
    headCoachLabel = "No Head Coach is assigned.";
    skillsLine = domainLine(
      "SKILLS",
      skillsGenerator,
      "Skills Coach",
      generatorSummary(
        "Skills Coach",
        skillsCanGenerate,
        "Skills Coach builds the Planning Context and generates the Skills plan.",
      ),
    );
  } else if (workflowId === "W2B") {
    headCoachLabel = "Head Coach builds the Planning Context only.";
    skillsLine = domainLine(
      "SKILLS",
      skillsGenerator,
      "Skills Coach",
      generatorSummary(
        "Skills Coach",
        skillsCanGenerate,
        "Skills Coach generates the Skills plan.",
      ),
    );
  } else {
    headCoachLabel = "Head Coach builds the Planning Context.";
    skillsLine = domainLine(
      "SKILLS",
      skillsGenerator,
      "Skills Coach",
      generatorSummary(
        "Skills Coach",
        skillsCanGenerate,
        "Skills Coach generates the Skills plan.",
      ),
    );
  }

  const domainLines = [skillsLine, sandCLine, nutritionLine];
  const operational = domainLines.every((line) => line.canGeneratePlan);

  return {
    workflowId,
    workflowTitle: workflowTitle(workflowId),
    operational,
    statusMessage: operational
      ? OPERATIONAL_SUCCESS_MESSAGE
      : OPERATIONAL_BLOCKED_MESSAGE,
    guidanceLine: null,
    headCoachAssigned: headCoach !== null,
    headCoachLabel,
    domainLines,
  };
}

export const PLAN_GENERATION_NOT_ENABLED_COPY = PLAN_GENERATION_NOT_ENABLED;
export const INCOMPLETE_PLANNING_CONFIGURATION_TITLE = INCOMPLETE_TITLE;
export const OPERATIONAL_SUCCESS_MESSAGE_COPY = OPERATIONAL_SUCCESS_MESSAGE;
