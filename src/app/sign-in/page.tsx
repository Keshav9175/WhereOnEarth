import type { Metadata } from "next";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in — WhereOnEarth",
};

// /sign-in — Google button + email/password form.
export default function SignInPage() {
  return (
    <main className="grid flex-1 place-items-center p-4">
      <section className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted">Sign in to save your games and climb the leaderboard.</p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-px flex-1 bg-border" />
          or use email
          <span className="h-px flex-1 bg-border" />
        </div>

        <SignInForm />
      </section>
    </main>
  );
}
