import type { Metadata } from "next";
import { Suspense } from "react";
import { GLASS_PANEL, PageShell } from "@/components/PageShell";
import { PlayerProfile } from "@/components/profile/PlayerProfile";

export const metadata: Metadata = {
  title: "Your profile — WhereOnEarth",
};

// /profile — the signed-in player's stats and recent games. Guests are redirected to /sign-in.
export default function ProfilePage() {
  return (
    <PageShell>
      <section className={`mx-auto flex w-full max-w-3xl flex-col gap-6 p-5 sm:p-8 ${GLASS_PANEL}`}>
        <Suspense fallback={<p className="py-6 text-center text-white/70">Loading your profile…</p>}>
          <PlayerProfile />
        </Suspense>
      </section>
    </PageShell>
  );
}
