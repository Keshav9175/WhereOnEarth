import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { PageShell } from "@/components/PageShell";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in — WhereOnEarth",
};

// /sign-in — Google button + email/password form.
export default function SignInPage() {
  return (
    <PageShell>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to save your games and climb the leaderboard."
      >
        <SignInForm />
      </AuthCard>
    </PageShell>
  );
}
