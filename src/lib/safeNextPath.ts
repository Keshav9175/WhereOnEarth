// "Where to go after this form" comes from the address bar (?next=/party), which anyone can edit.
// Only paths on OUR site are allowed: "/party" yes; "https://evil.example" or "//evil.example" no.
// Otherwise a link could send players to a fake site right after they sign in (an "open redirect").
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
