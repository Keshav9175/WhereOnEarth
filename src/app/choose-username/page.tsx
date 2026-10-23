import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GLASS_PANEL, PageShell } from "@/components/PageShell";
import { safeNextPath } from "@/lib/safeNextPath";
import { USERNAME_RULES } from "@/lib/username";
import { auth } from "@/server/auth";
import { ChooseUsernameForm } from "./ChooseUsernameForm";

export const metadata: Metadata = {
  title: "Choose a username — WhereOnEarth",
};

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

// Turns "Keshav Divate" (from Google) into a valid starting suggestion: "keshav_divate".
function suggestFrom(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, USERNAME_RULES.max);
  return cleaned.length >= USERNAME_RULES.min ? cleaned : "";
}

async function ChooseUsername({ searchParams }: PageProps) {
  const [{ next }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ]);
  if (!session) redirect("/sign-in");

  const goTo = safeNextPath(next);
  const current = session.user.displayUsername ?? session.user.username ?? null;
  return <ChooseUsernameForm suggestion={current ?? suggestFrom(session.user.name)} next={goTo} />;
}

// /choose-username?next=… — new Google players (and anyone without one yet) pick a unique username.
export default function ChooseUsernamePage({ searchParams }: PageProps) {
  return (
    <PageShell>
      <div className="grid flex-1 place-items-center pb-8">
        <section className={`flex w-full max-w-md flex-col gap-6 p-6 sm:p-8 ${GLASS_PANEL}`}>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold">Choose your username</h1>
            <p className="text-white/70">This is the name other players see.</p>
          </div>
          {/* Reads the session and ?next (per-request data), so it sits inside Suspense. */}
          <Suspense fallback={<p className="text-center text-white/70">Loading…</p>}>
            <ChooseUsername searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </PageShell>
  );
}
