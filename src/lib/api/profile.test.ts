import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { fetchMyProfile } from "@/lib/api/profile";

describe("fetchMyProfile", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("parses snake_case profile name fields", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        user_id: "coach-user-1",
        email: "kendra@example.com",
        first_name: "Kendra",
        last_name: "James",
      },
    });

    const result = await fetchMyProfile();

    expect(result).toMatchObject({
      userId: "coach-user-1",
      email: "kendra@example.com",
      firstName: "Kendra",
      lastName: "James",
    });
  });

  it("uses display-style profile name when first and last are absent", async () => {
    apiRequestMock.mockResolvedValue({
      success: true,
      data: {
        id: "coach-user-1",
        email: "kendra@example.com",
        displayName: "Kendra James",
      },
    });

    const result = await fetchMyProfile();

    expect(result.firstName).toBe("Kendra James");
    expect(result.lastName).toBe("");
  });
});
