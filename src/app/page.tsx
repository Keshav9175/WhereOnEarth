import Link from "next/link";

// The home page ( / ). A server component: no "use client", because nothing here is interactive.
export default function HomePage() {
  return (
    <main className="grid flex-1 place-items-center p-4">
      <section className="flex max-w-xl flex-col items-start gap-5">
        <h1 className="text-5xl leading-tight font-bold sm:text-6xl">WhereOnEarth</h1>
        <p className="text-xl text-muted">
          You are dropped somewhere on Earth. Look around. Guess where you are.
        </p>

        <ul className="list-disc space-y-1 pl-5 leading-relaxed">
          <li>5 rounds, each a real Street View panorama</li>
          <li>Click the world map where you think you are</li>
          <li>The closer your guess, the more points — up to 5,000 per round</li>
        </ul>

        <Link
          href="/play"
          className="rounded-lg bg-primary px-8 py-3.5 text-lg font-semibold text-primary-fg no-underline hover:brightness-110 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-fg"
        >
          Play now
        </Link>
      </section>
    </main>
  );
}
