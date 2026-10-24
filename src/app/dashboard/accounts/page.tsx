import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { listAccountsForWorkspace, getWorkspaceBalanceSummary } from "@/features/accounts/data";
import { AccountCreationManager } from "@/features/accounts/components/account-creation-manager";
import { LiquidityHeroCard } from "@/features/accounts/components/liquidity-hero-card";
import { AccountList } from "@/features/accounts/components/account-list";
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
    <div className="flex w-full max-w-5xl flex-col gap-6">
      {/* 1. Header with Title & Quick Action Modal Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{t("title")}</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{activeWorkspace.name}</p>
        </div>

        <AccountCreationManager
          workspaceId={workspaceId}
          workspaceCurrency={baseCurrency}
          canUseMultiCurrency={plan.multiCurrency}
        />
      </div>

      {/* 2. Net Liquidity Hero Card */}
      <LiquidityHeroCard
        convertedTotalMinor={balanceSummary.convertedTotalMinor}
        baseCurrency={baseCurrency}
        accounts={accounts}
        moneyLocale={moneyLocale}
      />

      {/* 3. Account List (Cards with progress and quick links) */}
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
        totalLiquidity={balanceSummary.convertedTotalMinor ?? 0}
      />

      {/* 4. Collapsible Foreign Exchange Rates Section */}
      {plan.multiCurrency ? (
        <details className="group overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-xs">
          <summary className="flex cursor-pointer items-center justify-between p-4 sm:p-5 font-semibold text-neutral-800 transition select-none hover:bg-neutral-50">
            <div className="flex items-center gap-2">
              <span className="text-base"></span>
              <span className="text-sm sm:text-base">{t("exchangeRatesSection")}</span>
            </div>
            <span className="text-xs text-neutral-400 transition-transform group-open:rotate-180">
              
            </span>
          </summary>
          <div className="border-t border-neutral-100 p-4 sm:p-6 bg-[#FBF9F4]/40">
            <ExchangeRatesForm
              workspaceId={workspaceId}
              baseCurrency={baseCurrency}
              currentRates={exchangeRates}
            />
          </div>
        </details>
      ) : (
        <div className="rounded-2xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-xs sm:text-sm text-[#1C1B1A]/70">
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
