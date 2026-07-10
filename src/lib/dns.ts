import dns from "node:dns";

/**
 * Some Windows networks refuse Node's default DNS resolver (c-ares),
 * which breaks mongodb+srv lookups with ECONNREFUSED. Public DNS
 * servers are a reliable fallback for local development.
 */
export function configureDnsForWindows(): void {
  if (process.platform === "win32") {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
}
