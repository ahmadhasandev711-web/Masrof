import "server-only";

/**
 * Paymob Accept scaffolding for Phase E.
 * Soft-launch stays on manual admin upgrades until:
 * - Object storage + Vercel are live
 * - PAYMOB_* env vars are set
 * - Checkout + webhook handlers are wired end-to-end
 */

export function isPaymobConfigured(): boolean {
  return Boolean(
    process.env.PAYMOB_API_KEY &&
      process.env.PAYMOB_INTEGRATION_ID &&
      process.env.PAYMOB_HMAC_SECRET,
  );
}

export type PaymobCheckoutResult =
  | { ok: true; iframeUrl: string }
  | { ok: false; reason: "not_configured" | "not_activated"; message: string };

/**
 * Creates a hosted checkout session when Paymob is fully activated.
 * Until then, callers should keep directing users to Support / admin upgrade.
 */
export async function createPaymobCheckoutIntention(_input: {
  userId: string;
  email: string;
  planId: "pro";
  amountCentsEgp: number;
}): Promise<PaymobCheckoutResult> {
  if (!isPaymobConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Online payment is not enabled yet — contact support for a manual upgrade.",
    };
  }

  // Intentionally inert until webhook + iframe flow are implemented against Paymob Accept.
  return {
    ok: false,
    reason: "not_activated",
    message: "Paymob credentials are present but checkout is not activated in production yet.",
  };
}
