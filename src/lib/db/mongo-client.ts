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
 * Note: we intentionally do NOT await `client.connect()` here. The
 * MongoDB Node.js driver queues operations internally and connects
 * lazily on first use, which lets us export a plain, synchronous `Db`
 * instance — exactly what better-auth's adapter expects to receive.
 */

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined;
}

function createClient(): MongoClient {
  configureDnsForWindows();
  const uri = getMongoConnectionUri(env.MONGODB_URI);
  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 15_000,
    family: 4,
  });
  // Fire-and-forget: establishes the connection in the background.
  // We swallow (and log) the initial rejection here so it never becomes
  // an unhandled promise rejection at boot; any real query issued later
  // still surfaces its own error to the caller (Server Action / Route
  // Handler error boundary) through the driver's normal retry/queueing.
  client.connect().catch((error: unknown) => {
    console.error("[mongo-client] initial connection attempt failed:", error);
  });
  return client;
}

const client: MongoClient = global.__mongoClient ?? createClient();

if (!global.__mongoClient) {
  global.__mongoClient = client;
}

export const mongoDb: Db = client.db(env.MONGODB_DB_NAME);

export default client;
