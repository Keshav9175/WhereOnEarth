import Image from "next/image";
import { CompassRose } from "@/components/home/CompassRose";
import { GameModeCards } from "@/components/home/GameModeCards";
import worldMap from "../../public/Vibrant Cartoon World Map Ocean Background.png";

// The home screen ( / ): the game-mode cards on the left and the cartoon world map on the right.
// The top bar and the ocean background come from the root layout. Only Singleplayer is playable today.
export default function HomePage() {
  return (
    <main className="relative isolate flex flex-1 flex-col text-white">
      {/* World map. Decorative, so alt="" (screen readers skip it).
          Large screens: a big map on the right that slides softly under the cards.
          Small screens: a faint background.
          The mask sits on the IMAGE itself (not its container), so the fades start exactly at the
          picture's own edges. Two gradients fade all 4 edges ("intersect" = both apply). */}
      <div className="absolute inset-0 -z-10 flex items-center overflow-hidden opacity-30 lg:left-[28%] lg:opacity-100">
        <Image
          src={worldMap}
          alt=""
          sizes="(min-width: 1024px) 72vw, 100vw"
          placeholder="blur"
          loading="eager"
          fetchPriority="high"
          className="h-auto w-full [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent),linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]"
        />
      </div>

      <div className="flex flex-1 flex-col px-5 pt-6 pb-5 lg:px-10">
        <div className="flex w-full max-w-sm flex-1 flex-col justify-center">
          {/* Invisible heading: screen readers announce the page by its <h1>. */}
          <h1 className="sr-only">WhereOnEarth — choose a game mode</h1>
          <GameModeCards />
        </div>
      </div>

      <div className="pointer-events-none absolute right-6 bottom-6 hidden lg:block">
        <CompassRose />
      </div>
    </main>
  );
}
