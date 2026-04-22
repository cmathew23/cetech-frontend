import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout sidePanelVariant="login">
      <AuthCard
        title="Forgot your password?"
        subtitle="Enter your email to receive a reset link"
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthLayout>
  );
}

