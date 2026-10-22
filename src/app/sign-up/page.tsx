import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { PageShell } from "@/components/PageShell";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create account — WhereOnEarth",
};

// /sign-up — Google button + email/password form.
export default function SignUpPage() {
  return (
    <PageShell minimal>
      <AuthCard
        title="Create your account"
        subtitle="Save your games, track your stats and join the leaderboard. You can also play as a guest."
      >
        <SignUpForm />
      </AuthCard>
    </PageShell>
  );
}
