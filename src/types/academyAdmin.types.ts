/**
 * Academy Admin Slice 1 — UI and normalized membership rows (not backend DTOs).
 */

export type SelectedAcademy = {
  academyId: string;
  name: string;
};

export type EntityMemberRow = {
  membershipId: string;
  /** User id for entity member actions (e.g. deactivate); empty if not returned by API. */
  targetUserId: string;
  /** First + last from nested user when present (e.g. deactivate prompt). */
  memberDisplayName: string;
  /** Email only when parseable (prompt fallback when name missing). */
  memberEmailOnly: string;
  userEmail: string;
  role: string;
  status: string;
  joinedAt: string;
};

/** Pending invitation row (aligned with `InvitationResponse` in `trainingEntity.types.ts`). */
export type PendingInvitationRow = {
  invitationId: string;
  entityName?: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

/** Dropdown option: AthleteProfile.id from `user.athlete` on membership rows. */
export type AthleteAssignmentOption = {
  athleteProfileId: string;
  /** First + last from profile or row; empty if only email is known. */
  displayName: string;
  displayEmail: string;
};

/** Dropdown option: CoachProfile.id from `user.coach` on membership rows. */
export type CoachAssignmentOption = {
  coachProfileId: string;
  displayName: string;
  displayEmail: string;
};

export type EntityAssignmentRow = {
  assignmentId: string;
  athleteProfileId: string;
  athleteName: string;
  athleteEmail: string;
  coachProfileId: string;
  coachName: string;
  coachEmail: string;
  relationshipType: string;
  location: string;
  isPrimary: boolean;
  createdAt: string;
  status: string;
};
