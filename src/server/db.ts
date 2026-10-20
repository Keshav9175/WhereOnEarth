import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Remembers the connection so we connect only once, not on every request.
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Stored on `globalThis` so it survives Next.js reloading files during development.
const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  }

  // Already connected: reuse it.
  if (cache.conn) {
    return cache.conn;
  }

  // Not connecting yet: start connecting.
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      // Fail fast with an error instead of silently waiting when the database is unreachable.
      bufferCommands: false,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Connection failed: forget the failed attempt so the next request can try again.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
