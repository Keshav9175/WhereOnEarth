import Link from "next/link";
import { PRIMARY_FILL } from "@/components/formStyles";
import { CHOOSE_USERNAME_URL } from "@/lib/username";
import { getPlayerStats } from "@/server/services/playerService";
import { getSignedInUser } from "@/server/session";

// Right side of the nav bar: the signed-in player (initial, name, best score — a link to /profile,
// where "Sign out" lives),
// or sign-in links for guests. Server component — wrap in <Suspense> (it reads the session cookie).
export async function HomeUserArea() {
  const user = await getSignedInUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="rounded-full px-4 py-2 font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className={`rounded-full px-4 py-2 font-semibold ${PRIMARY_FILL} focus-visible:outline-2 focus-visible:outline-white`}
        >
          Create account
        </Link>
      </div>
    );
  }

  const stats = await getPlayerStats(user.id);
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3">
      {/* Accounts from before usernames existed (D-027): a gentle nudge to pick one. */}
      {!user.username && (
        <Link
          href={CHOOSE_USERNAME_URL}
          className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-sky-200 ring-1 ring-sky-300/50 hover:bg-sky-300/10 sm:inline-block focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          Pick a username
        </Link>
      )}
      <Link
        href="/profile"
        title="Your profile"
        className="flex items-center gap-3 rounded-full pr-3 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
      >
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-700 text-xl font-bold text-white ring-2 ring-sky-300/70"
        >
          {initial}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-bold text-white">{user.name}</span>
          <span className="text-sm text-white/70">
            Best score <span className="font-semibold text-amber-300">{stats.bestScore.toLocaleString()}</span>
          </span>
        </span>
      </Link>
    </div>
  );
}
