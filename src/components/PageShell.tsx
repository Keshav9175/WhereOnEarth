import Image from "next/image";
import type { ReactNode } from "react";
import { NavBar } from "./NavBar";
import worldMap from "../../public/Vibrant Cartoon World Map Ocean Background.png";

// The ocean-blue background used across the site (same colours as the home page).
export const OCEAN_BACKGROUND =
  "bg-[#01275e] bg-[radial-gradient(ellipse_at_70%_55%,#013b7f_0%,#01275e_55%,#011c47_100%)]";

// A dark see-through panel: the "card" style for content on top of the ocean background.
export const GLASS_PANEL =
  "rounded-2xl border border-white/15 bg-slate-950/55 shadow-xl shadow-black/30 backdrop-blur-md";

type PageShellProps = {
  // Which nav item to highlight (e.g. "/leaderboard").
  current?: string;
  // Sign-in / sign-up / email pages: show only the logo, so nothing distracts from the form.
  minimal?: boolean;
  children: ReactNode;
};

// The frame shared by the inner pages (leaderboard, sign-in, sign-up): home's background,
// a faint world map behind everything, and the same top bar — so every page feels like one app.
export function PageShell({ current, minimal = false, children }: PageShellProps) {
  return (
    <main className={`relative isolate flex flex-1 flex-col overflow-hidden text-white ${OCEAN_BACKGROUND}`}>
      {/* Decorative, so alt="". Faded on all 4 edges so it melts into the background. */}
      <div className="absolute inset-0 -z-10 flex items-center opacity-20">
        <Image
          src={worldMap}
          alt=""
          sizes="100vw"
          placeholder="blur"
          className="h-auto w-full [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent),linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-8 px-5 py-5 lg:px-10">
        <NavBar current={current} minimal={minimal} />
        {children}
      </div>
    </main>
  );
}
