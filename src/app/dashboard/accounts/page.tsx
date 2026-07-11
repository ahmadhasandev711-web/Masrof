import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { listAccountsForWorkspace, getWorkspaceBalanceSummary } from "@/features/accounts/data";
import { CreateAccountForm } from "@/features/accounts/components/create-account-form";
import { AccountList } from "@/features/accounts/components/account-list";
import { CurrencyBalancesSummary } from "@/features/accounts/components/currency-balances-summary";
import { ExchangeRatesForm } from "@/features/accounts/components/exchange-rates-form";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { parseExchangeRates } from "@/lib/currency";
import { getIntlLocale, type AppLocale } from "@/i18n/config";
import type { SupportedCurrency } from "@/models/workspace";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function AccountsPage() {
  const session = await requireSession();
  const moneyLocale = getIntlLocale((await getLocale()) as AppLocale);
  const t = await getTranslations("pages.accounts");
  const tFeatureGate = await getTranslations("dashboard.featureGate");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);
  const baseCurrency = activeWorkspace.currency as SupportedCurrency;
  const [accounts, balanceSummary] = await Promise.all([
    listAccountsForWorkspace(workspaceId),
    getWorkspaceBalanceSummary(workspaceId),
  ]);
  const exchangeRates = parseExchangeRates(activeWorkspace.exchangeRates);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">{t("totalBalance")}</p>
          <CurrencyBalancesSummary
            byCurrency={balanceSummary.byCurrency}
            baseCurrency={balanceSummary.baseCurrency}
            convertedTotalMinor={balanceSummary.convertedTotalMinor}
            missingRates={balanceSummary.missingRates}
            moneyLocale={moneyLocale}
          />
        </div>
      </div>

      <CreateAccountForm
        workspaceId={workspaceId}
        workspaceCurrency={baseCurrency}
        canUseMultiCurrency={plan.multiCurrency}
      />

      <AccountList
        accounts={accounts.map((account) => ({
          _id: account._id,
          name: account.name,
          type: account.type,
          cachedBalance: account.cachedBalance,
          currency: account.currency ?? baseCurrency,
        }))}
        workspaceId={workspaceId}
        baseCurrency={baseCurrency}
      />

      {plan.multiCurrency ? (
        <ExchangeRatesForm
          workspaceId={workspaceId}
          baseCurrency={baseCurrency}
          currentRates={exchangeRates}
        />
      ) : (
        <div className="rounded-xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-sm text-[#1C1B1A]/70">
          {tFeatureGate("multiCurrency")}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
            {tPlan("viewPricing")}
          </Link>
          .
        </div>
      )}
    </div>
  );
}
