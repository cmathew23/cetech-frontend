import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <AuthLayout sidePanelVariant="login">
      <AuthCard
        title="Set new password"
        subtitle="Enter a new password to regain access to your account"
      >
        <Suspense fallback={<p className="text-sm text-textSecondary">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </AuthCard>
    </AuthLayout>
  );
}

