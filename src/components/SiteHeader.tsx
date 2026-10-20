"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

const NAV_LINK =
  "rounded-md px-2 py-1 text-fg hover:bg-card focus-visible:outline-2 focus-visible:outline-primary";

// The bar at the top of every page: site name, navigation, and who is signed in.
export function SiteHeader() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold">
            WhereOnEarth
          </Link>
          <Link href="/play" className={NAV_LINK}>
            Play
          </Link>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {isPending ? null : session ? (
            <>
              <span className="text-muted">
                Signed in as <strong className="text-fg">{session.user.name}</strong>
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className={`${NAV_LINK} cursor-pointer border border-border`}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={NAV_LINK}>
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-fg hover:brightness-110"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
