"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { SupportedCurrency } from "@/models/workspace";
import { useTranslations } from "next-intl";
import { AccountTypeIcon, NavIcon } from "@/components/ui/app-icons";

type AccountItem = {
  type: string;
  cachedBalance: number;
  currency?: string | null;
};

export function LiquidityHeroCard({
  convertedTotalMinor,
  baseCurrency,
  accounts,
  moneyLocale,
}: {
  convertedTotalMinor: number | null;
  baseCurrency: SupportedCurrency;
  accounts: AccountItem[];
  moneyLocale: string;
}) {
  const t = useTranslations("pages.accounts");

  const total = convertedTotalMinor ?? 0;

  const walletsTotal = accounts
    .filter((a) => a.type === "mobile_wallet")
    .reduce((sum, a) => sum + (a.cachedBalance > 0 ? a.cachedBalance : 0), 0);

  const cashTotal = accounts
    .filter((a) => a.type === "cash")
    .reduce((sum, a) => sum + (a.cachedBalance > 0 ? a.cachedBalance : 0), 0);

  const bankTotal = accounts
    .filter((a) => a.type === "bank")
    .reduce((sum, a) => sum + (a.cachedBalance > 0 ? a.cachedBalance : 0), 0);

  const walletsPercent = total > 0 ? Math.round((walletsTotal / total) * 100) : 0;
  const cashPercent = total > 0 ? Math.round((cashTotal / total) * 100) : 0;
  const bankPercent = total > 0 ? Math.round((bankTotal / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#065F46] via-[#044E3A] to-[#022C22] p-5 sm:p-7 text-white shadow-lg">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -end-12 -top-12 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -start-12 -bottom-12 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
              <NavIcon name="wallet" className="h-4 w-4" />
            </span>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-emerald-100">
              {t("netLiquidity")}
            </span>
          </div>

          <Link
            href="/dashboard/transactions?action=transfer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-white/20 active:scale-95"
          >
            <span>{t("transferFunds")}</span>
            <span>←</span>
          </Link>
        </div>

        {/* Main Balance Display */}
        <div>
          <p className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
            {formatMoney(total, { currency: baseCurrency, locale: moneyLocale })}
          </p>
        </div>

        {/* Liquidity Breakdown Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
          {/* Wallets */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/10">
            <div className="flex items-center gap-1.5">
              <AccountTypeIcon type="mobile_wallet" className="h-4 w-4 text-emerald-100" />
              <span className="text-xs text-emerald-100">{t("walletsShare")}</span>
            </div>
            <div className="text-end font-mono text-xs font-bold tabular-nums text-white">
              {formatMoney(walletsTotal, { currency: baseCurrency, locale: moneyLocale })}
              <span className="ms-1 text-[10px] text-emerald-200/80 font-normal">
                ({walletsPercent}%)
              </span>
            </div>
          </div>

          {/* Cash */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/10">
            <div className="flex items-center gap-1.5">
              <AccountTypeIcon type="cash" className="h-4 w-4 text-emerald-100" />
              <span className="text-xs text-emerald-100">{t("cashShare")}</span>
            </div>
            <div className="text-end font-mono text-xs font-bold tabular-nums text-white">
              {formatMoney(cashTotal, { currency: baseCurrency, locale: moneyLocale })}
              <span className="ms-1 text-[10px] text-emerald-200/80 font-normal">
                ({cashPercent}%)
              </span>
            </div>
          </div>

          {/* Banks */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/10">
            <div className="flex items-center gap-1.5">
              <AccountTypeIcon type="bank" className="h-4 w-4 text-emerald-100" />
              <span className="text-xs text-emerald-100">{t("banksShare")}</span>
            </div>
            <div className="text-end font-mono text-xs font-bold tabular-nums text-white">
              {formatMoney(bankTotal, { currency: baseCurrency, locale: moneyLocale })}
              <span className="ms-1 text-[10px] text-emerald-200/80 font-normal">
                ({bankPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
