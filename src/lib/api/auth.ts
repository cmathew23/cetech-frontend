import { paths } from "@/config/endpoints";
import { apiRequest } from "@/lib/apiClient";

type BackendMessageResponse = {
  success?: boolean;
  message?: string;
};

function toMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const msg = (payload as { message?: unknown }).message;
  return typeof msg === "string" && msg.trim() !== "" ? msg.trim() : fallback;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const payload = await apiRequest<BackendMessageResponse>(paths.auth.forgotPassword, {
    method: "POST",
    body: JSON.stringify({ email }),
    omitAuth: true,
  });
  return toMessage(payload, "If an account exists, a reset link has been sent");
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<string> {
  const payload = await apiRequest<BackendMessageResponse>(paths.auth.resetPassword, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
    omitAuth: true,
  });
  return toMessage(payload, "Password has been reset successfully");
}

