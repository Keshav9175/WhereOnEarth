import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Suspense } from "react";
import { HomeUserArea } from "@/components/home/HomeUserArea";
import { NavBar } from "@/components/NavBar";
import { PageTransition } from "@/components/PageTransition";
import { OCEAN_BACKGROUND } from "@/components/PageShell";
import { INTRO_INLINE_SCRIPT } from "@/lib/intro";
import "./globals.css";

// The site font. next/font downloads it at build time and serves it from our own domain, so players'
// browsers never contact Google. It's a variable font (one file, weights 300–900). globals.css uses
// the --font-figtree variable for the whole site.
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: "WhereOnEarth",
  description: "A geography guessing game: find where on Earth you are.",
};

// Everything here stays on screen while you move between pages: the ocean background and the top bar.
// Only {children} (the page) changes — with a soft crossfade.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the intro script below may add data-intro to <html> before React loads.
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <head>
        {/* First-visit intro (D-025): decides before the first paint whether to show it. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_INLINE_SCRIPT }} />
      </head>
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
