import type mongoose from "mongoose";
import type { ClientSession } from "mongoose";

/**
 * Checks whether the connected MongoDB deployment supports multi-document transactions.
 * Standalone single-instance servers (common in default local dev) do not.
 * Replica sets (Atlas, production clusters, local rs0) do.
 */
export function supportsTransactions(mongooseInstance: typeof mongoose): boolean {
  try {
    const client =
      typeof mongooseInstance.connection.getClient === "function"
        ? mongooseInstance.connection.getClient()
        : null;
    const topology = (client as { topology?: { description?: { servers?: Map<string, { type?: string }> } } } | null)
      ?.topology;
    if (!topology) return false;
    const servers = Array.from(topology.description?.servers?.values?.() || []) as Array<{ type?: string }>;
    if (servers.length === 1 && servers[0]?.type === "Standalone") {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Executes a callback inside a MongoDB transaction if transactions are supported.
 * On standalone deployments without a replica set (common in local development),
 * it gracefully falls back to executing the operations with `session = undefined`.
 */
export async function runInTransaction<T>(
  mongooseInstance: typeof mongoose,
  fn: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  if (!supportsTransactions(mongooseInstance)) {
    return fn(null);
  }

  const session = await mongooseInstance.startSession();
  try {
    let result: T;
    try {
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result!;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("does not support retryable writes") ||
        msg.includes("Standalone") ||
        msg.includes("Transaction numbers are only allowed on a replica set")
      ) {
        return fn(null);
      }
      throw err;
    }
  } finally {
    await session.endSession();
  }
}
