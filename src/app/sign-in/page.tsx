import type { Metadata } from "next";
import { Suspense } from "react";
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
        {/* The form reads ?next from the address (per-request), so it sits inside Suspense. */}
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </AuthCard>
    </PageShell>
  );
}
