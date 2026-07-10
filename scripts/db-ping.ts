import { configureDnsForWindows } from "@/lib/dns";
import { getMongoConnectionUri } from "@/lib/db/connection-uri";
import mongoose from "mongoose";
import { env } from "@/lib/env";

configureDnsForWindows();

const uri = getMongoConnectionUri(env.MONGODB_URI);
const safeUri = uri.replace(/:([^:@/]+)@/, ":***@");

async function main() {
  console.log("Testing MongoDB connection...");
  console.log("URI:", safeUri.slice(0, 140) + (safeUri.length > 140 ? "..." : ""));

  try {
    await mongoose.connect(uri, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 20_000,
      family: 4,
    });
    await mongoose.connection.db?.command({ ping: 1 });
    console.log("✓ Connected successfully to", mongoose.connection.host);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("✗ Connection failed:");
    console.error(error instanceof Error ? error.message : error);
    console.error("\nChecklist:");
    console.error("  1. Atlas → Network Access → add your IP (or 0.0.0.0/0 for dev)");
    console.error("  2. Atlas → Database → cluster is not Paused");
    console.error("  3. Firewall allows outbound TCP port 27017");
    console.error("  4. Try MONGODB_URI_DIRECT from Atlas Connect → Drivers");
    process.exit(1);
  }
}

main();
