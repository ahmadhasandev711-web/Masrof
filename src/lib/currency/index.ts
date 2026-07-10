import { fromMinorUnits, toMinorUnits } from "@/lib/money";
import {
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency/constants";

export type CurrencyBalanceRow = {
  currency: SupportedCurrency;
  totalMinor: number;
};

export function parseExchangeRates(value: unknown): Partial<Record<SupportedCurrency, number>> {
  if (!value || typeof value !== "object") return {};

  const source =
    value instanceof Map ? Object.fromEntries(value.entries()) : (value as Record<string, unknown>);

  const rates: Partial<Record<SupportedCurrency, number>> = {};
  for (const [code, rate] of Object.entries(source)) {
    if (!isSupportedCurrency(code)) continue;
    const numeric = Number(rate);
    if (Number.isFinite(numeric) && numeric > 0) {
      rates[code] = numeric;
    }
  }

  return rates;
}

export function resolveAccountCurrency(
  accountCurrency: string | null | undefined,
  workspaceCurrency: SupportedCurrency,
): SupportedCurrency {
  if (accountCurrency && isSupportedCurrency(accountCurrency)) {
    return accountCurrency;
  }
  return workspaceCurrency;
}

/** 1 unit of `from` equals `rate` units of `base` in major currency terms. */
export function convertMinorToBase(
  amountMinor: number,
  fromCurrency: SupportedCurrency,
  baseCurrency: SupportedCurrency,
  rates: Partial<Record<SupportedCurrency, number>>,
): number | null {
  if (fromCurrency === baseCurrency) return amountMinor;

  const rate = rates[fromCurrency];
  if (!rate || rate <= 0) return null;

  const baseMajor = fromMinorUnits(amountMinor) * rate;
  return toMinorUnits(baseMajor);
}

export function summarizeBalances(
  rows: CurrencyBalanceRow[],
  baseCurrency: SupportedCurrency,
  rates: Partial<Record<SupportedCurrency, number>>,
) {
  const byCurrency = [...rows].sort((a, b) => a.currency.localeCompare(b.currency));
  const missingRates: SupportedCurrency[] = [];
  let convertedTotalMinor = 0;
  let canConvertAll = true;

  for (const row of byCurrency) {
    const converted = convertMinorToBase(row.totalMinor, row.currency, baseCurrency, rates);
    if (converted == null) {
      canConvertAll = false;
      if (row.currency !== baseCurrency) {
        missingRates.push(row.currency);
      }
      continue;
    }
    convertedTotalMinor += converted;
  }

  return {
    byCurrency,
    baseCurrency,
    convertedTotalMinor: canConvertAll ? convertedTotalMinor : null,
    missingRates,
  };
}

export {
  CURRENCY_LABELS,
  SUPPORTED_CURRENCIES,
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency/constants";
