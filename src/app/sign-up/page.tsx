import type { Metadata } from "next";
import { SignUpForm } from "./SignUpForm";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";


export const metadata: Metadata = {
  title: "Create account — WhereOnEarth",
};

// /sign-up — a server component frame around the interactive form.
export default function SignUpPage() {
  return (
    <main className="grid flex-1 place-items-center p-4">
      <section className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted">
            Save your games, track your stats and join the leaderboard. You can also play as a
            guest without an account.
          </p>
        </div>
                <GoogleSignInButton />

        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-px flex-1 bg-border" />
          or use email
          <span className="h-px flex-1 bg-border" />
        </div>

        <SignUpForm />

      </section>
    </main>
  );
}
