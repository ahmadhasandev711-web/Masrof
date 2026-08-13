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

    // On Vercel each invocation is a fresh isolate — warming here races the
    // request and opens a second handshake. Only warm long-lived Node hosts.
    if (!process.env.VERCEL) {
      import("@/lib/db/mongoose")
        .then(({ connectToDatabase }) => connectToDatabase())
        .catch(() => {});
    }
  }
}
