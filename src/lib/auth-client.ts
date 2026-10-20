import { createAuthClient } from "better-auth/react";

// The browser side of Better Auth. It calls our /api/auth/* endpoints for us.
// No baseURL needed: the app and the API are on the same website (same domain).
export const authClient = createAuthClient();

// Pull out the pieces we use, so components can import them by name.
export const { signUp, signIn, signOut, useSession } = authClient;
