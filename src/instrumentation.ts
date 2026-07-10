/**
 * Runs once when the Next.js server starts — before any route handlers.
 * Ensures MongoDB SRV lookups work on Windows networks with broken DNS.
 *
 * Must use dynamic import: instrumentation is bundled for Edge too,
 * and node:dns is not available there.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { configureDnsForWindows } = await import("@/lib/dns");
    configureDnsForWindows();

    // Warm the DB pool in the background — don't block server startup.
    import("@/lib/db/mongoose")
      .then(({ connectToDatabase }) => connectToDatabase())
      .catch(() => {});
  }
}
