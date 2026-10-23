import "flag-icons/css/flag-icons.min.css";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Landmark } from "lucide-react";
import {
  DEFAULT_MAP_ID,
  LISTED_MAPS,
  MIN_COUNTRY_MAP_LOCATIONS,
  type Continent,
  type GameMap,
} from "@/lib/maps/catalog";
import { ROUNDS_PER_GAME } from "@/server/models/Game";
import {
  getMapStats,
  listCountryMaps,
  type CountryMapEntry,
  type MapCountry,
  type MapStats,
} from "@/server/services/mapService";
import worldMap from "../../../public/Vibrant Cartoon World Map Ocean Background.png";

// One accent per continent (top stripe + hover ring), so the cards don't all look the same.
const ACCENTS: Record<Continent, { stripe: string; ring: string; text: string }> = {
  europe: { stripe: "bg-sky-400", ring: "hover:ring-sky-400/60", text: "text-sky-300" },
  asia: { stripe: "bg-rose-400", ring: "hover:ring-rose-400/60", text: "text-rose-300" },
  africa: { stripe: "bg-amber-400", ring: "hover:ring-amber-400/60", text: "text-amber-300" },
  "north-america": { stripe: "bg-emerald-400", ring: "hover:ring-emerald-400/60", text: "text-emerald-300" },
  "south-america": { stripe: "bg-lime-400", ring: "hover:ring-lime-400/60", text: "text-lime-300" },
  oceania: { stripe: "bg-cyan-400", ring: "hover:ring-cyan-400/60", text: "text-cyan-300" },
};

const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-amber-300";

// A flag from the flag-icons package (`fi fi-fr`). Decorative: the country names are given as text.
function Flag({ country, className = "" }: { country: MapCountry; className?: string }) {
  return (
    <span
      aria-hidden="true"
      title={country.name}
      className={`fi fi-${country.code.toLowerCase()} rounded-[3px] shadow-sm ring-1 ring-black/20 ${className}`}
    />
  );
}

function statsLine(stats: MapStats) {
  return `${stats.countries.length} ${stats.countries.length === 1 ? "country" : "countries"} · ${stats.locations.toLocaleString()} locations`;
}

// The big default card: a faint world map behind it and a wall of flags from everywhere.
function WorldCard({ map, stats }: { map: GameMap; stats: MapStats }) {
  const wall = stats.countries.slice(0, 36);

  return (
    <Link
      href={`/play?map=${map.id}`}
      className={`group relative isolate grid gap-6 overflow-hidden rounded-3xl bg-[#012a66] p-6 ring-1 ring-white/15 transition hover:ring-amber-300/70 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center ${FOCUS}`}
    >
      <Image
        src={worldMap}
        alt=""
        fill
        sizes="(min-width: 1024px) 64rem, 100vw"
        className="-z-10 object-cover opacity-45 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-40"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#011c47] via-[#011c47]/80 to-transparent" />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold tracking-[0.2em] text-amber-300 uppercase">Default map</p>
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{map.name}</h2>
        <p className="max-w-md text-white/80">{map.description}</p>
        <p className="text-sm text-white/60 tabular-nums">{statsLine(stats)}</p>
        <span className="mt-2 inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-b from-sky-500 to-blue-700 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-900/50 transition group-hover:from-sky-400 group-hover:to-blue-600">
          Play the world
          <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>

      {/* Flags are sized by font size (flag-icons makes each flag 1.33em × 1em). */}
      <div aria-hidden="true" className="flex max-w-md flex-wrap gap-2 text-[26px] lg:justify-end">
        {wall.map((country) => (
          <Flag key={country.code} country={country} />
        ))}
      </div>
    </Link>
  );
}

const FLAGS_PER_CARD = 7;

// Famous places (UNESCO World Heritage Sites): a highlight, so it sits right under World.
function FamousCard({ map, stats }: { map: GameMap; stats: MapStats }) {
  return (
    <Link
      href={`/play?map=${map.id}`}
      className={`group flex flex-col gap-4 rounded-2xl bg-[#011c47]/90 p-5 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#012a66] hover:ring-sky-400/60 sm:flex-row sm:items-center sm:gap-6 ${FOCUS}`}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-400/15 text-sky-300 ring-1 ring-sky-300/30">
        <Landmark aria-hidden="true" className="size-6" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold">{map.name}</h2>
          <span className="rounded-full bg-sky-400/15 px-2.5 py-0.5 text-xs font-semibold text-sky-200">
            UNESCO
          </span>
        </div>
        <p className="text-sm text-white/70">
          {map.description} {stats.locations.toLocaleString()} World Heritage Sites with Street View.
        </p>
      </div>
      <div aria-hidden="true" className="flex flex-wrap items-center gap-1.5 text-lg sm:max-w-xs sm:justify-end">
        {stats.countries.slice(0, 10).map((country) => (
          <Flag key={country.code} country={country} />
        ))}
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-300">
        Play
        <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ContinentCard({ map, stats }: { map: GameMap & { continent: Continent }; stats: MapStats }) {
  const accent = ACCENTS[map.continent];
  const shown = stats.countries.slice(0, FLAGS_PER_CARD);
  const more = stats.countries.length - shown.length;
  const playable = stats.locations >= ROUNDS_PER_GAME;

  const body = (
    <>
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accent.stripe}`} />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">{map.name}</h2>
        <span className="text-xs text-white/55 tabular-nums">{stats.locations.toLocaleString()} spots</span>
      </div>
      <p className="text-sm text-white/70">{map.description}</p>

      <div className="mt-auto flex items-center gap-1.5" aria-hidden="true">
        {shown.map((country) => (
          <Flag key={country.code} country={country} className="text-lg" />
        ))}
        {more > 0 && <span className="ml-1 text-xs font-semibold text-white/55">+{more}</span>}
      </div>
      <p className="sr-only">Countries include {shown.map((country) => country.name).join(", ")}.</p>

      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
        <span className="text-white/55">
          {stats.countries.length} {stats.countries.length === 1 ? "country" : "countries"}
        </span>
        {playable ? (
          <span className={`inline-flex items-center gap-1 font-semibold ${accent.text}`}>
            Play
            <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        ) : (
          <span className="text-white/45">Not enough spots yet</span>
        )}
      </div>
    </>
  );

  const card = `group relative flex min-h-56 w-full flex-col gap-3 overflow-hidden rounded-2xl bg-[#011c47]/90 p-5 pt-6 ring-1 ring-white/10 transition`;

  return playable ? (
    <Link href={`/play?map=${map.id}`} className={`${card} hover:-translate-y-0.5 hover:bg-[#012a66] ${accent.ring} ${FOCUS}`}>
      {body}
    </Link>
  ) : (
    <div className={`${card} opacity-60`}>{body}</div>
  );
}

// A country map: a big flag, the name and how many spots it has. The whole tile is the link.
function CountryTile({ map }: { map: CountryMapEntry }) {
  const accent = map.region ? ACCENTS[map.region] : null;
  return (
    <Link
      href={`/play?map=${map.id}`}
      className={`group flex items-center gap-3 rounded-xl bg-[#011c47]/90 p-3 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#012a66] ${accent?.ring ?? "hover:ring-white/40"} ${FOCUS}`}
    >
      <span
        aria-hidden="true"
        className={`fi fi-${map.countryCode.toLowerCase()} shrink-0 rounded-[3px] text-[30px] shadow-sm ring-1 ring-black/20`}
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold">{map.name}</span>
        <span className="text-xs text-white/55 tabular-nums">{map.locations} spots</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="ml-auto size-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/80"
      />
    </Link>
  );
}

// Country maps grouped under their continent (continents in the same order as the cards above).
function CountrySection({ countries }: { countries: CountryMapEntry[] }) {
  const groups = LISTED_MAPS.filter((map) => map.continent).map((map) => ({
    map,
    countries: countries.filter((country) => country.region === map.continent),
  }));

  return (
    <section aria-labelledby="countries-heading" className="flex flex-col gap-5 pt-4">
      <div className="flex flex-col gap-1">
        <h2 id="countries-heading" className="text-2xl font-black tracking-tight">
          Countries
        </h2>
        <p className="text-sm text-white/65">
          Every round inside one country. A country gets its own map once it has{" "}
          {MIN_COUNTRY_MAP_LOCATIONS} spots — more unlock as the location pool grows.
        </p>
      </div>

      {groups.map(({ map, countries: inGroup }) =>
        inGroup.length === 0 ? null : (
          <div key={map.id} className="flex flex-col gap-2.5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white/80">
              <span aria-hidden="true" className={`size-2 rounded-full ${ACCENTS[map.continent as Continent].stripe}`} />
              {map.name}
              <span className="font-normal text-white/45">· {inGroup.length}</span>
            </h3>
            <ul className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {inGroup.map((country) => (
                <li key={country.id} className="flex [&>a]:w-full">
                  <CountryTile map={country} />
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </section>
  );
}

// Server component: the World card on top, one card per continent, then the country maps.
// Wrap it in <Suspense>.
export async function MapLibrary() {
  // The pool grows when the generator runs, so count at request time.
  await connection();
  const [stats, countries] = await Promise.all([getMapStats(), listCountryMaps()]);

  return (
    <div className="flex flex-col gap-5">
      {LISTED_MAPS.map((map) =>
        map.id === DEFAULT_MAP_ID ? (
          <WorldCard key={map.id} map={map} stats={stats[map.id]} />
        ) : map.tag ? (
          <FamousCard key={map.id} map={map} stats={stats[map.id]} />
        ) : null,
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LISTED_MAPS.map((map) =>
          !map.continent ? null : (
            <li key={map.id} className="flex">
              <ContinentCard map={{ ...map, continent: map.continent }} stats={stats[map.id]} />
            </li>
          ),
        )}
      </ul>
      <CountrySection countries={countries} />
    </div>
  );
}
