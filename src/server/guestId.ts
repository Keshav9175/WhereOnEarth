import { cookies } from "next/headers";
import { z } from "zod";

// Guests have no account, so to remember which locations a guest has already seen we give their
// browser a random anonymous ID in a cookie. It identifies a browser, not a person, and holds no
// personal data. httpOnly = page JavaScript can't read it.
const COOKIE_NAME = "woe_guest";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

// Returns this browser's guest ID, creating one if needed.
// Only call it from a Route Handler or Server Function: Next.js can't set cookies anywhere else.
export async function getOrCreateGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = z.uuid().safeParse(cookieStore.get(COOKIE_NAME)?.value);
  if (existing.success) return existing.data;

  const guestId = crypto.randomUUID();
  cookieStore.set(COOKIE_NAME, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_IN_SECONDS,
    path: "/",
  });
  return guestId;
}
