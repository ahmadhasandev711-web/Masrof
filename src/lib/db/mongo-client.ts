import { configureDnsForWindows } from "@/lib/dns";
import { getMongoConnectionUri } from "@/lib/db/connection-uri";
import { MongoClient, type Db } from "mongodb";
import { env } from "@/lib/env";

configureDnsForWindows();

/**
 * Raw MongoClient singleton.
 *
 * better-auth's MongoDB adapter talks to the database through the
 * official `mongodb` driver directly (not through Mongoose), so we
 * need a second, independent connection alongside the Mongoose one in
 * `mongoose.ts`. Both connect to the same MongoDB deployment; they
 * simply use different client libraries for different purposes:
 *   - Mongoose: application data (accounts, transactions, budgets...)
 *   - MongoClient: better-auth's internal collections (users, sessions...)
 *
 * The client connects lazily on the first auth operation. Eagerly connecting
 * here makes every Next.js build worker and every route that merely imports
 * auth open a socket, even when that route never reads a session.
 */

declare global {
  var __mongoClient: MongoClient | undefined;
}

function createClient(): MongoClient {
  configureDnsForWindows();
  const uri = getMongoConnectionUri(env.MONGODB_URI);
  const isServerless = Boolean(process.env.VERCEL);
  const client = new MongoClient(uri, {
    maxPoolSize: isServerless ? 1 : 5,
    minPoolSize: 0,
    maxIdleTimeMS: isServerless ? 10_000 : 30_000,
    serverSelectionTimeoutMS: isServerless ? 8_000 : 15_000,
    family: 4,
  });
  return client;
}

const client: MongoClient = global.__mongoClient ?? createClient();

if (!global.__mongoClient) {
  global.__mongoClient = client;
}

export const mongoDb: Db = client.db(env.MONGODB_DB_NAME);

export default client;
