/**
 * Training entity / invitation DTOs from `src/lib/api/entities.ts`, `invitations.ts`,
 * and onboarding entity constants (cetech-backend trainingEntity routes).
 */

export const TRAINING_ENTITY_TYPE_VALUES = [
  "ACADEMY",
  "COACH_GROUP",
  "ATHLETE_GROUP",
  "FACILITY_GROUP",
] as const;

export type TrainingEntityType = (typeof TRAINING_ENTITY_TYPE_VALUES)[number];

export const TrainingEntityType = {
  ACADEMY: "ACADEMY",
  COACH_GROUP: "COACH_GROUP",
  ATHLETE_GROUP: "ATHLETE_GROUP",
  FACILITY_GROUP: "FACILITY_GROUP",
} as const satisfies Record<string, TrainingEntityType>;

export type TrainingEntityTypeValue = TrainingEntityType;

/** POST /entities request (validator: name, type required; optional head coach fields). */
export interface CreateEntityRequest {
  name: string;
  type: TrainingEntityType;
  hasHeadCoach?: boolean;
  headCoachId?: string;
}

export interface TrainingEntityResponse {
  id: string;
  name: string;
  type: TrainingEntityType;
  createdByUserId: string;
  hasHeadCoach: boolean;
  headCoachId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MembershipRole = "ENTITY_ADMIN" | "COACH" | "ATHLETE" | "STAFF";
export type MembershipStatus = "ACTIVE" | "INVITED" | "REJECTED" | "REMOVED";

export interface MembershipResponse {
  membershipId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string | null;
  entity: TrainingEntityResponse;
}

export interface InvitationResponse {
  id: string;
  entityId: string;
  email: string;
  role: MembershipRole;
  invitedByUserId: string;
  status: MembershipStatus;
  createdAt: string;
  expiresAt: string;
}

export interface UpdateRoleRequest {
  role: MembershipRole;
}
