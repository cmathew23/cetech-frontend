/**
 * Shared profile API — GET/PATCH /profile/me (envelope unwrapped via adaptBackendSuccess).
 */

import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";
import { adaptBackendSuccess } from "@/lib/api/adaptBackendSuccess";

export type ProfileMe = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
};

function readProfileString(o: Record<string, unknown>, key: string): string {
  const v = o[key];
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function parseProfileMe(data: unknown): ProfileMe {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw {
      message: "Invalid profile response body",
      status: 500,
      code: "PROFILE_ME_INVALID_BODY",
      details: data,
    };
  }
  const o = data as Record<string, unknown>;
  const userId =
    readProfileString(o, "userId") || readProfileString(o, "id");
  return {
    userId,
    email: readProfileString(o, "email"),
    firstName: readProfileString(o, "firstName"),
    lastName: readProfileString(o, "lastName"),
    phone: readProfileString(o, "phone"),
    addressLine1: readProfileString(o, "addressLine1"),
    city: readProfileString(o, "city"),
    state: readProfileString(o, "state"),
    country: readProfileString(o, "country"),
  };
}

export async function fetchMyProfile(): Promise<ProfileMe> {
  const raw = await apiRequest(paths.profile.me, { method: "GET" });
  const data = adaptBackendSuccess(raw);
  return parseProfileMe(data);
}

export type PatchProfileMeInput = {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
};

export async function patchMyProfile(
  input: PatchProfileMeInput,
): Promise<ProfileMe> {
  const raw = await apiRequest(paths.profile.me, {
    method: "PATCH",
    body: JSON.stringify({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone.trim(),
      addressLine1: input.addressLine1.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      country: input.country.trim(),
    }),
  });
  const data = adaptBackendSuccess(raw);
  return parseProfileMe(data);
}
