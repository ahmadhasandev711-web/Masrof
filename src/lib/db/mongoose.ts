import { configureDnsForWindows } from "@/lib/dns";
import { clearResolvedMongoUriCache, getMongoConnectionUri } from "@/lib/db/connection-uri";
import mongoose from "mongoose";
import { env } from "@/lib/env";

/**
 * Mongoose connection singleton.
 *
 * Why this pattern is necessary:
 * - In Next.js dev mode, modules are hot-reloaded on every file change.
 *   Without caching the connection on `globalThis`, every reload would
 *   open a brand new connection to MongoDB, quickly exhausting the
 *   connection pool.
 * - In serverless/production environments, multiple invocations can
 *   share a warm module scope, so we still want to reuse a single
 *   connection promise instead of racing to open several.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.__mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.__mongooseCache) {
  global.__mongooseCache = cache;
}

const isServerless = Boolean(process.env.VERCEL);

const CLIENT_OPTIONS = {
  dbName: env.MONGODB_DB_NAME,
  maxPoolSize: isServerless ? 1 : 5,
  minPoolSize: 0,
  maxIdleTimeMS: isServerless ? 10_000 : 30_000,
  serverSelectionTimeoutMS: isServerless ? 8_000 : 15_000,
  socketTimeoutMS: 20_000,
  family: 4 as const,
};

function isConnectionLive(): boolean {
  return mongoose.connection.readyState === 1;
}

function clearConnectionCache(): void {
  cache.conn = null;
  cache.promise = null;
  clearResolvedMongoUriCache();
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn && isConnectionLive()) {
    return cache.conn;
  }

  if (cache.conn && !isConnectionLive()) {
    clearConnectionCache();
  }

  if (!cache.promise) {
    configureDnsForWindows();
    const mongoUri = getMongoConnectionUri(env.MONGODB_URI);
    cache.promise = mongoose.connect(mongoUri, CLIENT_OPTIONS).then((mongooseInstance) => {
      mongooseInstance.connection.on("disconnected", () => {
        clearConnectionCache();
      });
      return mongooseInstance;
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    clearConnectionCache();
    throw error;
  }

  return cache.conn;
}

/** Clears cached connection so the next query opens a fresh socket. */
export function resetDatabaseConnection(): void {
  clearConnectionCache();
}
