/**
 * Creates or repairs the platform admin user (idempotent).
 * Reads credentials from .env.local — never commit passwords to git.
 *
 * Usage: npm run seed:admin
 */
import { MongoClient } from "mongodb";
import { auth } from "../src/lib/auth";
import { configureDnsForWindows } from "../src/lib/dns";
import { getMongoConnectionUri } from "../src/lib/db/connection-uri";

const email = process.env.SEED_ADMIN_EMAIL ?? process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME ?? "مدير مصروفاتي";

function isListedAdmin(targetEmail: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(targetEmail.toLowerCase());
}

async function getDb() {
  configureDnsForWindows();
  const uri = getMongoConnectionUri(process.env.MONGODB_URI ?? "");
  const dbName = process.env.MONGODB_DB_NAME ?? "masrofaty";
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30_000 });
  await client.connect();
  return { client, db: client.db(dbName) };
}

async function main() {
  if (!email || !password) {
    console.error("❌ Set ADMIN_EMAILS + SEED_ADMIN_PASSWORD in .env.local");
    process.exit(1);
  }

  if (!isListedAdmin(email)) {
    console.error(`❌ ${email} is not listed in ADMIN_EMAILS — add it to .env.local first.`);
    process.exit(1);
  }

  const { client, db } = await getDb();

  try {
    const existing = await db.collection("user").findOne({ email });
    if (existing) {
      if (name && existing.name !== name) {
        await db.collection("user").updateOne(
          { email },
          { $set: { name, updatedAt: new Date() } },
        );
        console.log(`✓ Admin name updated to: ${name}`);
      } else {
        console.log(`✓ Admin user already exists: ${email}`);
      }
      console.log("  Log in at /login then open /admin");
      return;
    }

    try {
      await auth.api.signUpEmail({
        body: { email, password, name },
      });
    } catch (error) {
      console.error("❌ Failed to create admin user:", error);
      process.exit(1);
    }

    console.log(`✓ Admin user created: ${email}`);
    console.log("  Log in at http://localhost:3000/login");
    console.log("  Then open http://localhost:3000/admin");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("❌ seed:admin failed:", error);
  process.exit(1);
});
