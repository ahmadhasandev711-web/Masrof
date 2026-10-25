"use client";

import { useActionState, useEffect, useState } from "react";
import {
  updateWorkspaceCurrencyAction,
  type UpdateCurrencyState,
} from "@/features/workspaces/actions/update-currency";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/models/workspace";
import { useTranslations } from "next-intl";

const initialState: UpdateCurrencyState = { error: null };

const CURRENCY_CONFIG: Record<
  SupportedCurrency,
  { flag: string; arName: string; enName: string; symbol: string }
> = {
  EGP: { flag: "🇪🇬", arName: "جنيه مصري", enName: "Egyptian Pound", symbol: "EGP" },
  USD: { flag: "🇺🇸", arName: "دولار أمريكي", enName: "US Dollar", symbol: "USD" },
  EUR: { flag: "🇪🇺", arName: "يورو", enName: "Euro", symbol: "EUR" },
  SAR: { flag: "🇸🇦", arName: "ريال سعودي", enName: "Saudi Riyal", symbol: "SAR" },
  AED: { flag: "🇦🇪", arName: "درهم إماراتي", enName: "UAE Dirham", symbol: "AED" },
};

export function WorkspaceCurrencyForm({
  workspaceId,
  currentCurrency,
}: {
  workspaceId: string;
  currentCurrency: SupportedCurrency;
}) {
  const t = useTranslations("pages.settings");
  const [state, formAction, isPending] = useActionState(updateWorkspaceCurrencyAction, initialState);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currentCurrency);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (state.success) {
      setSuccessMsg(true);
      const timer = setTimeout(() => setSuccessMsg(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs sm:p-6"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div>
        <h2 className="text-base font-bold text-neutral-900 sm:text-lg">
          {t("currencySectionTitle")}
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          {t("currencySectionSubtitle")}
        </p>
      </div>

      {/* Currency Selection Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUPPORTED_CURRENCIES.map((code) => {
          const config = CURRENCY_CONFIG[code];
          const isSelected = selectedCurrency === code;

          return (
            <label
              key={code}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                isSelected
                  ? "border-[#065F46] bg-emerald-50/50 shadow-2xs"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="currency"
                  value={code}
                  checked={isSelected}
                  onChange={() => setSelectedCurrency(code)}
                  className="h-4 w-4 accent-[#065F46]"
                />
                <span className="text-xl leading-none">{config.flag}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900">{config.arName}</p>
                  <p className="text-xs text-neutral-500">{config.enName}</p>
                </div>
              </div>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs font-bold text-neutral-700">
                {code}
              </span>
            </label>
          );
        })}
      </div>

      {/* Financial System Notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 leading-relaxed">
        <p>ℹ️ {t("currencyHelpNotice")}</p>
      </div>

      {state.error && (
        <p role="alert" className="text-xs font-semibold text-rose-600">
          {state.error}
        </p>
      )}

      {successMsg && (
        <p role="status" className="rounded-lg bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">
          ✓ {t("currencySuccessMessage")}
        </p>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending || selectedCurrency === currentCurrency}
          className="inline-flex items-center justify-center rounded-xl bg-[#065F46] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#065F46]/90 disabled:opacity-50"
        >
          {isPending ? t("currencySavingBtn") : t("currencySaveBtn")}
        </button>
      </div>
    </form>
  );
}
