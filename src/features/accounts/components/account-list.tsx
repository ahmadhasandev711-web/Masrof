import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { resolveAccountCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency/constants";
import { ArchiveAccountButton } from "@/features/accounts/components/archive-account-button";
import { EditAccountButton } from "@/features/accounts/components/edit-account-button";
import { fromMinorUnits } from "@/lib/money";
import { AccountTypeIcon, NavIcon } from "@/components/ui/app-icons";
import { getTranslations } from "next-intl/server";

type AccountListItem = {
  _id: unknown;
  name: string;
  type: string;
  cachedBalance: number;
  openingBalance?: number;
  currency: string;
};

export async function AccountList({
  accounts,
  workspaceId,
  baseCurrency,
  totalLiquidity = 0,
  canWrite = true,
}: {
  accounts: AccountListItem[];
  workspaceId: string;
  baseCurrency: SupportedCurrency;
  totalLiquidity?: number;
  canWrite?: boolean;
}) {
  const [tEmpty, tAccountType, tPages] = await Promise.all([
    getTranslations("empty"),
    getTranslations("accountType"),
    getTranslations("pages.accounts"),
  ]);

  const accountTypeConfig: Record<string, { label: string; badgeClass: string }> = {
    cash: {
      label: tAccountType("cash"),
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-[#0F2E24] dark:text-[#34D399] dark:border-emerald-800/60",
    },
    bank: {
      label: tAccountType("bank"),
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
    },
    mobile_wallet: {
      label: tAccountType("mobile_wallet"),
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60",
    },
    credit_card: {
      label: tAccountType("credit_card"),
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    },
    savings: {
      label: tAccountType("savings"),
      badgeClass: "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60",
    },
    other: {
      label: tAccountType("other"),
      badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-[#1E2824] dark:text-[#9AA39F] dark:border-[#26302C]",
    },
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-400 dark:border-[#26302C] dark:bg-[#161E1B] dark:text-[#66706B]">
        <span className="mb-2 flex justify-center text-neutral-400 dark:text-[#66706B]">
          <NavIcon name="accounts" className="h-10 w-10" />
        </span>
        <p className="font-semibold text-neutral-700 dark:text-[#ECEAE4]">{tEmpty("noAccounts")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <ul className="flex flex-col gap-3">
        {accounts.map((account) => {
          const id = String(account._id);
          const currency = resolveAccountCurrency(account.currency, baseCurrency);
          const config = accountTypeConfig[account.type] ?? accountTypeConfig.other;
          const sharePercent =
            totalLiquidity > 0 && account.cachedBalance > 0
              ? Math.min(100, Math.round((account.cachedBalance / totalLiquidity) * 100))
              : 0;

          return (
            <li
              key={id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:border-[#065F46]/40 hover:shadow-sm dark:border-[#26302C] dark:bg-[#161E1B] dark:hover:border-[#34D399]/40"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 shadow-2xs dark:bg-[#1E2824] dark:text-[#ECEAE4]"
                  >
                    <AccountTypeIcon type={account.type} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-bold text-neutral-900 dark:text-[#ECEAE4]">
                        {account.name}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500 dark:text-[#9AA39F]">
                      <span>{currency}</span>
                      {sharePercent > 0 && (
                        <>
                          <span className="text-neutral-300 dark:text-[#66706B]">·</span>
                          <span className="font-mono tabular-nums text-emerald-700 dark:text-[#34D399]">
                            {tPages("liquidityShare", { percent: sharePercent })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end dark:border-[#26302C]">
                  <div className="text-start sm:text-end">
                    <span className="block font-mono text-lg sm:text-xl font-bold tabular-nums text-neutral-900 dark:text-[#ECEAE4]">
                      {formatMoney(account.cachedBalance, { currency })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/transactions?accountId=${id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 active:scale-95 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                    >
                      <NavIcon name="transactions" className="h-3.5 w-3.5" />
                      <span>{tPages("viewTransactions")}</span>
                    </Link>

                    <Link
                      href={`/dashboard/transactions?tab=transfers`}
                      className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 active:scale-95 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                    >
                      <NavIcon name="repeat" className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{tPages("transferFrom")}</span>
                    </Link>

                    {canWrite && (
                      <EditAccountButton
                        accountId={id}
                        workspaceId={workspaceId}
                        name={account.name}
                        openingBalance={fromMinorUnits(account.openingBalance ?? 0)}
                      />
                    )}
                    {canWrite && <ArchiveAccountButton accountId={id} workspaceId={workspaceId} />}
                  </div>
                </div>
              </div>

              {sharePercent > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-[#1E2824]">
                  <div
                    className="h-full rounded-full bg-[#065F46] transition-all duration-500 dark:bg-[#10B981]"
                    style={{ width: `${sharePercent}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
