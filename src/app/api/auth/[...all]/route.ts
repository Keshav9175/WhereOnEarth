import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

// Hands every /api/auth/* request to Better Auth, e.g.
// POST /api/auth/sign-up/email, POST /api/auth/sign-in/email,
// POST /api/auth/sign-out, GET /api/auth/get-session.
export const { GET, POST } = toNextJsHandler(auth);
