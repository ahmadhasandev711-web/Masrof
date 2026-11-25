import { formatMoney } from "@/lib/money";
import { getTranslations } from "next-intl/server";
import { resolveAccountCurrency, type SupportedCurrency } from "@/lib/currency";
import { AccountTypeIcon } from "@/components/ui/app-icons";

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

  const accountTypeConfig: Record<string, { label: string }> = {
    cash: { label: tAccountType("cash") },
    bank: { label: tAccountType("bank") },
    mobile_wallet: { label: tAccountType("mobile_wallet") },
    credit_card: { label: tAccountType("credit_card") },
    savings: { label: tAccountType("savings") },
    other: { label: tAccountType("other") },
  };

  return (
    <div className="rounded-3xl border border-neutral-200/90 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-5 sm:p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-[#ECEAE4]">{tReports("summaryTitle")}</h3>
      </div>

      {accounts.length === 0 ? (
        <p className="text-xs text-neutral-400 dark:text-[#9AA39F] py-4 text-center">{tReports("empty")}</p>
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
                className="flex items-center justify-between rounded-2xl border border-neutral-200/80 dark:border-[#26302C] bg-[#FBF9F4]/70 dark:bg-[#1E2824] p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#161E1B] text-neutral-700 dark:text-[#ECEAE4] shadow-2xs">
                    <AccountTypeIcon type={account.type} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-neutral-900 dark:text-[#ECEAE4]">{account.name}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-[#9AA39F] truncate">{config.label}</p>
                  </div>
                </div>

                <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-neutral-900 dark:text-[#ECEAE4] shrink-0">
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
