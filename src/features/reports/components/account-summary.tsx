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

  const accountTypeConfig: Record<string, { label: string; icon: string }> = {
    cash: { label: tAccountType("cash"), icon: "" },
    bank: { label: tAccountType("bank"), icon: "" },
    mobile_wallet: { label: tAccountType("mobile_wallet"), icon: "" },
    credit_card: { label: tAccountType("credit_card"), icon: "" },
    savings: { label: tAccountType("savings"), icon: "" },
    other: { label: tAccountType("other"), icon: "" },
  };

  return (
    <div className="rounded-3xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-neutral-900">{tReports("summaryTitle")}</h3>
      </div>

      {accounts.length === 0 ? (
        <p className="text-xs text-neutral-400 py-4 text-center">{tReports("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {accounts.map((account) => {
            const currency = resolveAccountCurrency(
              account.currency,
              baseCurrency as SupportedCurrency,
            );
            const config = accountTypeConfig[account.type] ?? accountTypeConfig.other;

            return (
              <div
                key={String(account._id)}
                className="flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-[#FBF9F4]/70 p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-2xs">
                    {config.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-neutral-900">{account.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{config.label}</p>
                  </div>
                </div>

                <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-neutral-900 shrink-0">
                  {formatMoney(account.cachedBalance, { currency })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
