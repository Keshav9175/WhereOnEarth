import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import mongoose from "mongoose";

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
