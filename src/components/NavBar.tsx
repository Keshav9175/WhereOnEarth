import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Box, House, Trophy, Users, type LucideIcon } from "lucide-react";
import logo from "../../public/WhereOn Earth 3D Logo.png";
import { HomeUserArea } from "./home/HomeUserArea";

type NavItem = {
  label: string;
  icon: LucideIcon;
  // Items without `href` are features we haven't built yet.
  href?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: House, href: "/" },
  { label: "Map", icon: Box, href: "/maps" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Community", icon: Users },
];

const PILL = "flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold";

type NavBarProps = {
  // The page we're on, so its pill is highlighted. Pages outside the menu (sign-in) pass nothing.
  current?: string;
  // Only the logo (a link back home) — used on the sign-in / sign-up pages.
  minimal?: boolean;
};

// The top bar on every page except the game: logo, main navigation, and the player area.
export function NavBar({ current, minimal = false }: NavBarProps) {
  const homeLink = (
    <Link href="/" className="shrink-0" aria-label="WhereOnEarth home">
      <Image src={logo} alt="WhereOnEarth" preload className="h-14 w-auto drop-shadow-lg" />
    </Link>
  );

  if (minimal) {
    return <header className="flex items-center">{homeLink}</header>;
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      {homeLink}

      <nav aria-label="Main" className="order-last w-full lg:order-none lg:w-auto">
        <ul className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-1.5 backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const active = item.href === current;
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`${PILL} ${
                      active
                        ? "bg-gradient-to-b from-sky-500 to-blue-700 text-white shadow-lg shadow-blue-900/50"
                        : "text-white/85 hover:bg-white/10"
                    } focus-visible:outline-2 focus-visible:outline-amber-300`}
                  >
                    <item.icon aria-hidden="true" className="size-5" />
                    {item.label}
                  </Link>
                ) : (
                  <span aria-disabled="true" title="Coming soon" className={`${PILL} text-white/45`}>
                    <item.icon aria-hidden="true" className="size-5" />
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <Suspense fallback={<div className="h-12 w-48 rounded-full bg-white/10" />}>
        <HomeUserArea />
      </Suspense>
    </header>
  );
}
