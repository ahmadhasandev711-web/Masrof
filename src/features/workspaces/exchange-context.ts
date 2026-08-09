import "server-only";

import { cache } from "react";
import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/models/workspace";
import { parseExchangeRates, type SupportedCurrency } from "@/lib/currency";

export type WorkspaceExchangeContext = {
  baseCurrency: SupportedCurrency;
  exchangeRates: Partial<Record<SupportedCurrency, number>>;
};

export const getWorkspaceExchangeContext = cache(async function getWorkspaceExchangeContext(
  workspaceId: string,
): Promise<WorkspaceExchangeContext> {
  await connectToDatabase();

  const workspace = await WorkspaceModel.findById(workspaceId)
    .select("currency exchangeRates")
    .lean();

  return {
    baseCurrency: (workspace?.currency ?? "EGP") as SupportedCurrency,
    exchangeRates: parseExchangeRates(workspace?.exchangeRates),
  };
});
