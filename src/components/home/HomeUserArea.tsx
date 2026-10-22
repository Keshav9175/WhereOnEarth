import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getPlayerStats } from "@/server/services/playerService";
import { getSignedInUser } from "@/server/session";

// Right side of the home nav bar: the signed-in player (initial, name, best score, sign out),
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
          className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-white"
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
      <SignOutButton className="size-10 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-300" />
    </div>
  );
}
