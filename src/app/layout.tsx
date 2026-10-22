import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeUserArea } from "@/components/home/HomeUserArea";
import { NavBar } from "@/components/NavBar";
import { PageTransition } from "@/components/PageTransition";
import { OCEAN_BACKGROUND } from "@/components/PageShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhereOnEarth",
  description: "A geography guessing game: find where on Earth you are.",
};

// Everything here stays on screen while you move between pages: the ocean background and the top bar.
// Only {children} (the page) changes — with a soft crossfade.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React loads.
          This ignores attribute differences on <body> only — not its contents. */}
      <body suppressHydrationWarning className={`flex min-h-screen flex-col text-white ${OCEAN_BACKGROUND}`}>
        <NavBar
          userArea={
            <Suspense fallback={<div className="h-12 w-48 rounded-full bg-white/10" />}>
              <HomeUserArea />
            </Suspense>
          }
        />
        {/* Page changes fade smoothly instead of cutting from one page to the next. Next.js
            navigations trigger it automatically; browsers without support simply switch instantly. */}
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
