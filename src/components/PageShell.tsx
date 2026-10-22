import Image from "next/image";
import type { ReactNode } from "react";
import worldMap from "../../public/Vibrant Cartoon World Map Ocean Background.png";

// The ocean-blue background used across the site. It's painted once on <body> (src/app/layout.tsx),
// so it stays still while you move between pages.
export const OCEAN_BACKGROUND =
  "bg-[#01275e] bg-[radial-gradient(ellipse_at_70%_55%,#013b7f_0%,#01275e_55%,#011c47_100%)]";

// A dark see-through panel: the "card" style for content on top of the ocean background.
export const GLASS_PANEL =
  "rounded-2xl border border-white/15 bg-slate-950/55 shadow-xl shadow-black/30 backdrop-blur-md";

// The frame of the inner pages (leaderboard, maps, sign-in…): a faint world map behind the content and
// the page padding. The top bar is NOT here — it lives in the root layout and stays on screen.
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex flex-1 flex-col text-white">
      {/* Decorative, so alt="". Faded on all 4 edges so it melts into the background. */}
      <div className="absolute inset-0 -z-10 flex items-center overflow-hidden opacity-20">
        <Image
          src={worldMap}
          alt=""
          sizes="100vw"
          placeholder="blur"
          className="h-auto w-full [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent),linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]"
        />
      </div>

      <div className="flex flex-1 flex-col px-5 pt-8 pb-5 lg:px-10">{children}</div>
    </main>
  );
}
