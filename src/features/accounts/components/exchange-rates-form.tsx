"use client";

import { useActionState } from "react";
import {
  updateExchangeRatesAction,
  type UpdateExchangeRatesState,
} from "@/features/workspaces/actions/update-exchange-rates";
import { CURRENCY_LABELS } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency/constants";
import { useTranslations } from "next-intl";

const initialState: UpdateExchangeRatesState = { error: null, success: false };

export function ExchangeRatesForm({
  workspaceId,
  baseCurrency,
  currentRates,
}: {
  workspaceId: string;
  baseCurrency: SupportedCurrency;
  currentRates: Partial<Record<SupportedCurrency, number>>;
}) {
  const tForm = useTranslations("forms.exchangeRates");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateExchangeRatesAction, initialState);

  const foreignCurrencies = (Object.keys(CURRENCY_LABELS) as SupportedCurrency[]).filter(
    (currency) => currency !== baseCurrency,
  );

  return (
    <form action={formAction} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-[#26302C] dark:bg-[#161E1B]">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <h2 className="text-sm font-semibold text-neutral-800 dark:text-[#ECEAE4]">{tForm("title")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-[#9AA39F]">
        {tForm("hint", { baseCurrency })}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {foreignCurrencies.map((currency) => (
          <div key={currency} className="flex flex-col gap-1.5">
            <label htmlFor={`rate_${currency}`} className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
              {tForm("rateLabel", { currency, baseCurrency })}
            </label>
            <input
              id={`rate_${currency}`}
              name={`rate_${currency}`}
              type="number"
              step="0.0001"
              min="0"
              defaultValue={currentRates[currency] ?? ""}
              placeholder={tForm("ratePlaceholder", { currencyLabel: CURRENCY_LABELS[currency] })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-left dark:border-[#26302C]"
              dir="ltr"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
      >
        {isPending ? tCommon("saving") : tForm("submit")}
      </button>

      {state.error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-emerald-700 dark:text-[#34D399]">{tForm("saved")}</p>}
    </form>
  );
}
