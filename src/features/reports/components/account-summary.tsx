import { formatMoney } from "@/lib/money";
import { getTranslations } from "next-intl/server";
import { resolveAccountCurrency, type SupportedCurrency } from "@/lib/currency";

type AccountRow = {
  _id: unknown;
  name: string;
  type: string;
  cachedBalance: number;
  currency?: string | null;
};

export async function AccountSummary({
  accounts,
  baseCurrency,
}: {
  accounts: AccountRow[];
  baseCurrency: string;
}) {
  const [tReports, tAccountType] = await Promise.all([
    getTranslations("reports.accounts"),
    getTranslations("accountType"),
  ]);
  const accountTypeLabels: Record<string, string> = {
    cash: tAccountType("cash"),
    bank: tAccountType("bank"),
    mobile_wallet: tAccountType("mobile_wallet"),
    credit_card: tAccountType("credit_card"),
    savings: tAccountType("savings"),
    other: tAccountType("other"),
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-neutral-900">{tReports("summaryTitle")}</h3>

      {accounts.length === 0 ? (
        <p className="text-sm text-neutral-400">{tReports("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {accounts.map((account) => {
            const currency = resolveAccountCurrency(
              account.currency,
              baseCurrency as SupportedCurrency,
            );
            return (
              <li
                key={String(account._id)}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-neutral-700">
                  {account.name}{" "}
                  <span className="text-neutral-400">
                    ({accountTypeLabels[account.type] ?? account.type})
                  </span>
                </span>
                <span className="font-medium text-neutral-900">
                  {formatMoney(account.cachedBalance, { currency })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
