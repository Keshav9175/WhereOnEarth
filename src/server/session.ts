import { headers } from "next/headers";
import { auth } from "@/server/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  // The unique username (D-027); null for accounts made before usernames existed.
  username: string | null;
};

// Reads the session cookie from the given request headers; Better Auth verifies it in the database.
async function userFromHeaders(requestHeaders: Headers): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }

  const { id, name, email, createdAt } = session.user;
  return { id, name, email, createdAt, username: session.user.displayUsername ?? session.user.username ?? null };
}

// For API route handlers: the signed-in user for this request, or null for guests.
export async function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  return userFromHeaders(request.headers);
}

// For server components (pages): same answer, read from the incoming request's headers.
// Reading headers makes the component request-specific, so wrap it in <Suspense>.
export async function getSignedInUser(): Promise<CurrentUser | null> {
  return userFromHeaders(await headers());
}
