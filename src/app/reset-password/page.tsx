import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { ERROR_TEXT, PRIMARY_BUTTON } from "@/components/formStyles";
import { PageShell } from "@/components/PageShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password — WhereOnEarth",
};

type PageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

// Better Auth checks the emailed link first, then sends the player here with ?token=… (valid)
// or ?error=INVALID_TOKEN (expired, already used, or broken).
async function ResetContent({ searchParams }: PageProps) {
  const { token, error } = await searchParams;

  if (error || !token) {
    return (
      <div className="flex flex-col gap-4">
        <p className={ERROR_TEXT} role="alert">
          This reset link has expired, was already used, or is incomplete.
        </p>
        <Link href="/forgot-password" className={`${PRIMARY_BUTTON} text-center`}>
          Get a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

// /reset-password — choose a new password after clicking the emailed link.
export default function ResetPasswordPage({ searchParams }: PageProps) {
  return (
    <PageShell minimal>
      <AuthCard
        title="Choose a new password"
        subtitle="Pick something you haven't used here before."
        showGoogle={false}
      >
        {/* searchParams is per-request data, so (with Cache Components) it is read inside Suspense. */}
        <Suspense fallback={<p className="text-center text-white/70">Checking your link…</p>}>
          <ResetContent searchParams={searchParams} />
        </Suspense>
      </AuthCard>
    </PageShell>
  );
}
