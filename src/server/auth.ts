import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import mongoose from "mongoose";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
}

// Better Auth talks to MongoDB through the official driver. Mongoose already ships that driver
// (`mongoose.mongo`), so we reuse it instead of installing a second copy. The client is kept on
// `globalThis` so development reloads don't open a new connection pool each time.
const globalForAuth = globalThis as typeof globalThis & {
  authMongoClient?: InstanceType<typeof mongoose.mongo.MongoClient>;
};
const client = globalForAuth.authMongoClient ?? new mongoose.mongo.MongoClient(MONGODB_URI);
globalForAuth.authMongoClient = client;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Users, sessions and accounts are stored in the `user`, `session` and `account` collections
// of the same `whereonearth` database. Better Auth hashes passwords; we never see them.
export const auth = betterAuth({
  database: mongodbAdapter(client.db(), { client }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Email + password users can't sign in until they click the link we email them.
    // (Google users are already verified by Google.)
    requireEmailVerification: true,
    // "Forgot password?": Better Auth makes a one-time link; we email it.
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, user.name, url);
    },
    resetPasswordTokenExpiresIn: 60 * 60,
    // After a reset, sign out every device — if someone else knew the old password, they're kicked out.
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, user.name, url);
    },
    // A correct password on an unverified account sends a fresh link — this is our "resend".
    // It only fires after the password matches, so strangers can't spam someone's inbox.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
  },
  // "Continue with Google". Only switched on when both values exist in .env.local,
  // so the app still works if Google isn't configured.
  socialProviders:
    GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        }
      : {},
  // Must be the last plugin: lets server-side code set login cookies in Next.js.
  plugins: [nextCookies()],
});
