import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { PRIMARY_BUTTON } from "@/components/formStyles";
import { FIRST_GAME_URL } from "@/lib/maps/catalog";
import { GLASS_PANEL, PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Email verification — WhereOnEarth",
};

// Better Auth sends the user here after they click the link in their email.
// Success: they are already signed in. Failure: it adds ?error=TOKEN_EXPIRED / INVALID_TOKEN / ….
const ERROR_MESSAGES: Record<string, string> = {
  TOKEN_EXPIRED: "This link has expired (links work for 1 hour).",
  INVALID_TOKEN: "This link is not valid. It may have been copied incompletely.",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function VerificationResult({ searchParams }: PageProps) {
  const { error } = await searchParams;

  if (error) {
    return (
      <>
        <CircleX aria-hidden="true" className="size-14 text-rose-300" />
        <h1 className="text-3xl font-bold">Couldn&apos;t verify your email</h1>
        <p className="text-white/70">
          {ERROR_MESSAGES[error] ?? "Something went wrong with this link."} Sign in with your email
          and password and we&apos;ll send you a fresh link.
        </p>
        <Link href="/sign-in" className={PRIMARY_BUTTON}>
          Go to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <CircleCheck aria-hidden="true" className="size-14 text-emerald-300" />
      <h1 className="text-3xl font-bold">Email verified!</h1>
      <p className="text-white/70">
        Your account is ready and you&apos;re signed in. Warm up with a first game of world-famous
        landmarks — can you place them all?
      </p>
      <Link href={FIRST_GAME_URL} className={PRIMARY_BUTTON}>
        Play your first game
      </Link>
      <Link href="/" className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">
        Skip for now
      </Link>
    </>
  );
}

// /email-verified — the result of clicking the verification link.
export default function EmailVerifiedPage({ searchParams }: PageProps) {
  return (
    <PageShell>
      <div className="grid flex-1 place-items-center pb-8">
        <section
          className={`flex w-full max-w-md flex-col items-center gap-4 p-6 text-center sm:p-8 ${GLASS_PANEL}`}
        >
          {/* searchParams is per-request data, so (with Cache Components) it is read inside Suspense. */}
          <Suspense fallback={<p className="text-white/70">Checking your link…</p>}>
            <VerificationResult searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </PageShell>
  );
}
