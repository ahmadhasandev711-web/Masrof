import { formatMoney } from "@/lib/money";
import { resolveAccountCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/models/workspace";
import { ArchiveAccountButton } from "@/features/accounts/components/archive-account-button";
import { getTranslations } from "next-intl/server";

type AccountListItem = {
  _id: unknown;
  name: string;
  type: string;
  cachedBalance: number;
  currency: string;
};

export async function AccountList({
  accounts,
  workspaceId,
  baseCurrency,
}: {
  accounts: AccountListItem[];
  workspaceId: string;
  baseCurrency: SupportedCurrency;
}) {
  const [tEmpty, tAccountType] = await Promise.all([
    getTranslations("empty"),
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

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
        {tEmpty("noAccounts")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {accounts.map((account) => {
        const id = String(account._id);
        const currency = resolveAccountCurrency(account.currency, baseCurrency);
        return (
          <li
            key={id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
          >
            <div>
              <p className="font-medium text-neutral-900">{account.name}</p>
              <p className="text-sm text-neutral-500">
                {accountTypeLabels[account.type] ?? account.type} · {currency}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-neutral-900">
                {formatMoney(account.cachedBalance, { currency })}
              </span>
              <ArchiveAccountButton accountId={id} workspaceId={workspaceId} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
