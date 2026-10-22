import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhereOnEarth",
  description: "A geography guessing game: find where on Earth you are.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React loads.
          This ignores attribute differences on <body> only — not its contents. */}
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        {children}
      </body>
    </html>
  );
}
