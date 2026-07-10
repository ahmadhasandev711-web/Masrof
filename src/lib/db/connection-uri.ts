import { execFileSync } from "node:child_process";
import { configureDnsForWindows } from "@/lib/dns";

interface SrvRecord {
  name: string;
  port: number;
}

function resolveDnsBlocking<T>(
  resolver: "resolveSrv" | "resolveTxt",
  hostname: string,
): T {
  configureDnsForWindows();

  const script = `
    const dns = require("node:dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    dns.${resolver}(${JSON.stringify(hostname)}, (error, records) => {
      if (error) {
        process.stderr.write(error.message);
        process.exit(1);
      }
      process.stdout.write(JSON.stringify(records));
    });
  `;

  const output = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  return JSON.parse(output.trim()) as T;
}

/** ac-ds6h91p-shard-00-00.host → atlas-ds6h91p-shard-0 */
function deriveReplicaSetFromShardHost(shardHost: string): string | null {
  const match = shardHost.match(/^ac-([a-z0-9]+)-shard-/i);
  if (!match?.[1]) return null;
  return `atlas-${match[1]}-shard-0`;
}

/**
 * Converts a mongodb+srv:// URI to mongodb:// with explicit shard hosts.
 * Avoids querySrv on broken Windows DNS resolvers while keeping Atlas
 * SRV URIs in .env.local for convenience.
 */
export function resolveMongoSrvUri(uri: string): string {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  const withoutScheme = uri.slice("mongodb+srv://".length);
  const slashIndex = withoutScheme.indexOf("/");
  const authority = slashIndex === -1 ? withoutScheme : withoutScheme.slice(0, slashIndex);
  const pathAndQuery =
    slashIndex === -1 ? "" : withoutScheme.slice(slashIndex);

  const atIndex = authority.lastIndexOf("@");
  const authPrefix = atIndex === -1 ? "" : `${authority.slice(0, atIndex + 1)}`;
  const hostAndQuery = atIndex === -1 ? authority : authority.slice(atIndex + 1);

  const questionIndex = hostAndQuery.indexOf("?");
  const hostname = questionIndex === -1 ? hostAndQuery : hostAndQuery.slice(0, questionIndex);
  const queryFromAuthority =
    questionIndex === -1 ? "" : hostAndQuery.slice(questionIndex + 1);

  const srvRecords = resolveDnsBlocking<SrvRecord[]>(
    "resolveSrv",
    `_mongodb._tcp.${hostname}`,
  );

  if (srvRecords.length === 0) {
    throw new Error(`No SRV records found for MongoDB host: ${hostname}`);
  }

  const hosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(",");

  // Atlas TXT records can point at a stale replica set name. Derive the
  // correct value from the shard hostname (ac-XXXX-shard-00-.. → atlas-XXXX-shard-0).
  const derivedReplicaSet = deriveReplicaSetFromShardHost(srvRecords[0].name);

  let txtOptions = "";
  try {
    const txtRecords = resolveDnsBlocking<string[][]>(
      "resolveTxt",
      `_mongodb._tcp.${hostname}`,
    );
    txtOptions = txtRecords.flat().join("&");
  } catch {
    // TXT records are optional for some deployments.
  }

  const pathQueryIndex = pathAndQuery.indexOf("?");
  const rawDbPath =
    pathQueryIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, pathQueryIndex);
  const queryFromPath =
    pathQueryIndex === -1 ? "" : pathAndQuery.slice(pathQueryIndex + 1);

  const params = new URLSearchParams(
    [queryFromAuthority, queryFromPath].filter(Boolean).join("&"),
  );

  if (txtOptions) {
    for (const part of txtOptions.split("&")) {
      const [key, value] = part.split("=");
      if (key && value && !params.has(key)) {
        params.set(key, value);
      }
    }
  }

  if (derivedReplicaSet) {
    params.set("replicaSet", derivedReplicaSet);
  }

  if (!params.has("ssl")) {
    params.set("ssl", "true");
  }
  if (!params.has("authSource")) {
    params.set("authSource", "admin");
  }

  const dbPath = rawDbPath && rawDbPath !== "/" ? rawDbPath : "";

  const query = params.toString();
  return `mongodb://${authPrefix}${hosts}${dbPath}${query ? `?${query}` : ""}`;
}

declare global {
  // eslint-disable-next-line no-var
  var __resolvedMongoUri: string | undefined;
}

/** Returns a connection URI safe for this machine's DNS resolver. */
export function getMongoConnectionUri(rawUri: string): string {
  const directUri = process.env.MONGODB_URI_DIRECT;
  if (directUri) {
    return directUri;
  }

  // Default: let the MongoDB driver resolve mongodb+srv (works with configureDnsForWindows).
  // Opt in to the manual SRV→mongodb:// conversion only when needed on Windows.
  const useManualSrvResolve =
    process.env.MONGODB_RESOLVE_SRV === "true" || process.env.MONGODB_RESOLVE_SRV === "1";

  if (process.platform !== "win32" || !rawUri.startsWith("mongodb+srv://") || !useManualSrvResolve) {
    return rawUri;
  }

  if (!global.__resolvedMongoUri) {
    global.__resolvedMongoUri = resolveMongoSrvUri(rawUri);
  }

  return global.__resolvedMongoUri;
}

export function clearResolvedMongoUriCache(): void {
  global.__resolvedMongoUri = undefined;
}
