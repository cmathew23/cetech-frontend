const base = {
  isAuthenticated: true,
  availableRoles: ["ATHLETE", "COACH", "ACADEMY_ADMIN"],
  activeMembershipCount: 0,
  pendingInvitationCount: 0,
};

export const onboardingMockBodies = {
  completeAdmin: {
    success: true,
    data: {
      ...base,
      activeOnboardingRole: "ACADEMY_ADMIN",
      hasAthleteProfile: false,
      hasCoachProfile: false,
      onboardingStatus: "COMPLETE",
      nextStep: "GO_TO_DASHBOARD",
    },
  },
  completeCoach: {
    success: true,
    data: {
      ...base,
      activeOnboardingRole: "COACH",
      hasAthleteProfile: false,
      hasCoachProfile: true,
      onboardingStatus: "COMPLETE",
      nextStep: "GO_TO_DASHBOARD",
    },
  },
  completeAthlete: {
    success: true,
    data: {
      ...base,
      activeOnboardingRole: "ATHLETE",
      hasAthleteProfile: true,
      hasCoachProfile: false,
      activeMembershipCount: 1,
      onboardingStatus: "COMPLETE",
      nextStep: "GO_TO_DASHBOARD",
    },
  },
  roleSelection: {
    success: true,
    data: {
      ...base,
      activeOnboardingRole: null,
      hasAthleteProfile: false,
      hasCoachProfile: false,
      onboardingStatus: "ROLE_SELECTION_REQUIRED",
      nextStep: "SELECT_ROLE",
    },
  },
  /** New academy admin before POST /onboarding/academy-setup */
  academySetupRequiredAdmin: {
    success: true,
    data: {
      ...base,
      activeOnboardingRole: "ACADEMY_ADMIN",
      hasAthleteProfile: false,
      hasCoachProfile: false,
      onboardingStatus: "ACADEMY_SETUP_REQUIRED",
      nextStep: "COMPLETE_ACADEMY_SETUP",
    },
  },
} as const;

/** GET /me/app-context envelope bodies (aligned with backend bootstrap contract). */
export const accessContextMockBodies = {
  onboardingRequired: {
    success: true,
    data: {
      user: { userId: "e2e-user", roles: [] },
      activeRole: "ACADEMY_ADMIN",
      academy: {
        hasMembership: false,
        membershipStatus: "NONE",
        trainingEntityId: null,
        trainingEntityName: null,
      },
      invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
      access: {
        canAccessDashboard: false,
        dashboardType: "NONE",
        reasonCode: "PROFILE_REQUIRED",
      },
      coachSummary: { assignedAthleteCount: 0 },
    },
  },
  activeWithDefaultEntity: {
    success: true,
    data: {
      user: { userId: "e2e-user", roles: ["ACADEMY_ADMIN"] },
      activeRole: "ACADEMY_ADMIN",
      academy: {
        hasMembership: true,
        membershipStatus: "ACTIVE",
        trainingEntityId: "ent-e2e-1",
        trainingEntityName: "E2E Academy",
      },
      invitation: { hasPendingInvitation: false, pendingInvitationCount: 0 },
      access: {
        canAccessDashboard: true,
        dashboardType: "ACADEMY_ADMIN",
        reasonCode: "READY",
      },
      coachSummary: { assignedAthleteCount: 0 },
    },
  },
} as const;
