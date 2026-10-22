"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Box, House, Trophy, Users, type LucideIcon } from "lucide-react";
import logo from "../../public/WhereOn Earth 3D Logo.png";

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

// Pages that show only the logo, so nothing distracts from their form.
const LOGO_ONLY_PAGES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/email-verified"];

const PILL = "relative z-10 flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-colors";

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

// The menu. ONE blue highlight slides to the active tab (instead of each tab switching its own colour),
// so moving between pages feels like one continuous motion.
function NavPills({ pathname }: { pathname: string }) {
  const listRef = useRef<HTMLUListElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  // The tab just clicked, while its page is still loading — the highlight slides there AT ONCE instead
  // of waiting for the server. It only counts while we're still on the page it was clicked from, so it
  // clears itself as soon as the new page arrives.
  const [clicked, setClicked] = useState<{ href: string; from: string } | null>(null);
  const target = clicked && clicked.from === pathname ? clicked.href : null;

  // Move the highlight under the active tab. A layout effect runs before the browser paints, so the
  // highlight never shows in the wrong place. It's moved directly (no React state) for smoothness.
  useLayoutEffect(() => {
    const list = listRef.current;
    const highlight = highlightRef.current;
    if (!list || !highlight) return;

    const place = () => {
      const active =
        list.querySelector<HTMLElement>("a[data-highlight-target]") ??
        list.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!active) {
        highlight.style.opacity = "0";
        return;
      }
      highlight.style.opacity = "1";
      highlight.style.width = `${active.offsetWidth}px`;
      highlight.style.height = `${active.offsetHeight}px`;
      highlight.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    };

    place();
    // From now on, moves animate (the very first placement above doesn't slide in from the corner).
    requestAnimationFrame(() => highlight.setAttribute("data-ready", ""));
    // Re-place when the menu changes size (window resized, font loaded, menu wraps on small screens).
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [pathname, target]);

  return (
    <nav aria-label="Main" className="order-last w-full lg:order-none lg:w-auto">
      <ul
        ref={listRef}
        className="relative flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-slate-950/40 p-1.5 backdrop-blur-md"
      >
        <span
          ref={highlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 rounded-xl bg-gradient-to-b from-sky-500 to-blue-700 opacity-0 shadow-lg shadow-blue-900/50 data-[ready]:transition-[transform,width,height,opacity] data-[ready]:duration-300 data-[ready]:ease-[cubic-bezier(0.22,1,0.36,1)]"
        />
        {NAV_ITEMS.map((item) => {
          const href = item.href;
          const active = href ? isActive(href, pathname) : false;
          // The highlighted tab: the clicked one while it loads, otherwise the current page.
          const highlighted = target ? href === target : active;
          return (
            <li key={item.label}>
              {href ? (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  data-highlight-target={target && href === target ? "" : undefined}
                  onClick={() => {
                    if (!isActive(href, pathname)) setClicked({ href, from: pathname });
                  }}
                  className={`${PILL} ${highlighted ? "text-white" : "text-white/85 hover:bg-white/10"} focus-visible:outline-2 focus-visible:outline-amber-300`}
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
  );
}

// The site's top bar. It lives in the ROOT LAYOUT, so it stays on screen while you move between pages
// (only the page below it changes). The game has its own bar, so it's hidden there.
// `userArea` (who's signed in) is rendered on the server and passed in.
export function NavBar({ userArea }: { userArea: ReactNode }) {
  const pathname = usePathname();
  // The game and party screens are full-screen with their own top bars.
  if (pathname.startsWith("/play") || pathname.startsWith("/party")) return null;

  const logoOnly = LOGO_ONLY_PAGES.some((page) => pathname.startsWith(page));

  return (
    // Its own transition name: during a page crossfade the bar is shown live, not faded (see globals.css).
    <header
      style={{ viewTransitionName: "site-header" }}
      className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-5 pt-5 lg:px-10"
    >
      <Link href="/" className="shrink-0" aria-label="WhereOnEarth home">
        <Image src={logo} alt="WhereOnEarth" preload className="h-14 w-auto drop-shadow-lg" />
      </Link>
      {!logoOnly && (
        <>
          <NavPills pathname={pathname} />
          {userArea}
        </>
      )}
    </header>
  );
}
