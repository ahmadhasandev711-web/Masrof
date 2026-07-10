import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currency/constants";

/** Resolves each transaction's currency via its linked account (fallback: workspace base). */
export function transactionAccountCurrencyStages(baseCurrency: SupportedCurrency) {
  return [
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: "$account" },
    {
      $addFields: {
        currency: {
          $cond: [
            {
              $and: [
                { $ne: ["$account.currency", null] },
                { $in: ["$account.currency", SUPPORTED_CURRENCIES] },
              ],
            },
            "$account.currency",
            baseCurrency,
          ],
        },
      },
    },
  ];
}
