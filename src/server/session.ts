import { auth } from "@/server/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

// Returns the signed-in user for this request, or null for guests.
// Reads the session cookie the browser sends; Better Auth verifies it against the database.
export async function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return null;
  }

  const { id, name, email, createdAt } = session.user;
  return { id, name, email, createdAt };
}
