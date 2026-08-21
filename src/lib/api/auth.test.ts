import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

import { createAcademyAdmin } from "@/lib/api/auth";
import { paths } from "@/config/endpoints";

describe("createAcademyAdmin", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("POSTs setupToken, email, password, firstName, lastName and does not send role", async () => {
    apiRequestMock.mockResolvedValue({ success: true });

    await createAcademyAdmin({
      setupToken: "setup-token-1",
      email: "admin@example.com",
      password: "secret1",
      firstName: "Ada",
      lastName: "Admin",
    });

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const [path, options] = apiRequestMock.mock.calls[0] as [
      string,
      { method?: string; body?: string; omitAuth?: boolean },
    ];

    expect(path).toBe(paths.auth.createAcademyAdmin);
    expect(path).toBe("/auth/create/academy-admin");
    expect(options.method).toBe("POST");
    expect(options.omitAuth).toBe(true);

    const body = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(body).toEqual({
      setupToken: "setup-token-1",
      email: "admin@example.com",
      password: "secret1",
      firstName: "Ada",
      lastName: "Admin",
    });
    expect(body).not.toHaveProperty("role");
  });
});
