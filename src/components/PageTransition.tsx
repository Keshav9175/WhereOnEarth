"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";

// Page-to-page animation. Keyed by the page address, so React sees "old page leaves, new page arrives"
// (exit + enter) instead of "one page changes shape" (which stretched a tall page into a short one).
// The old page fades out where it is and the new one fades in; the CSS lives in globals.css
// (.page-exit / .page-enter). `default="none"`: nothing else animates.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
