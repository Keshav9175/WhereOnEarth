import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { PageShell } from "@/components/PageShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password — WhereOnEarth",
};

// /forgot-password — ask for a reset link by email.
export default function ForgotPasswordPage() {
  return (
    <PageShell minimal>
      <AuthCard
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a link to choose a new one."
        showGoogle={false}
      >
        <ForgotPasswordForm />
      </AuthCard>
    </PageShell>
  );
}
