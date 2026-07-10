import {
  convertMinorToBase,
  type SupportedCurrency,
} from "@/lib/currency";

export type AmountByCurrency = {
  currency: SupportedCurrency;
  amountMinor: number;
};

export type ConversionMeta = {
  missingRates: SupportedCurrency[];
  canConvertAll: boolean;
};

export function sumAmountsInBase(
  rows: AmountByCurrency[],
  baseCurrency: SupportedCurrency,
  rates: Partial<Record<SupportedCurrency, number>>,
): { totalMinor: number | null } & ConversionMeta {
  const missingRates: SupportedCurrency[] = [];
  let totalMinor = 0;
  let canConvertAll = true;

  for (const row of rows) {
    const converted = convertMinorToBase(row.amountMinor, row.currency, baseCurrency, rates);
    if (converted == null) {
      canConvertAll = false;
      if (row.currency !== baseCurrency && !missingRates.includes(row.currency)) {
        missingRates.push(row.currency);
      }
      continue;
    }
    totalMinor += converted;
  }

  missingRates.sort((a, b) => a.localeCompare(b));

  return {
    totalMinor: canConvertAll ? totalMinor : null,
    missingRates,
    canConvertAll,
  };
}

export function mergeConversionMeta(...parts: ConversionMeta[]): ConversionMeta {
  const missingRates = [...new Set(parts.flatMap((part) => part.missingRates))].sort((a, b) =>
    a.localeCompare(b),
  );
  return {
    missingRates,
    canConvertAll: parts.every((part) => part.canConvertAll),
  };
}

export function sumByKeyInBase<K extends string>(
  rows: Array<{ key: K; currency: SupportedCurrency; amountMinor: number }>,
  baseCurrency: SupportedCurrency,
  rates: Partial<Record<SupportedCurrency, number>>,
): {
  totals: Map<K, number | null>;
  missingRates: SupportedCurrency[];
  canConvertAll: boolean;
} {
  const byKey = new Map<K, AmountByCurrency[]>();

  for (const row of rows) {
    const list = byKey.get(row.key) ?? [];
    list.push({ currency: row.currency, amountMinor: row.amountMinor });
    byKey.set(row.key, list);
  }

  const totals = new Map<K, number | null>();
  const allMissing = new Set<SupportedCurrency>();
  let canConvertAll = true;

  for (const [key, currencyRows] of byKey) {
    const result = sumAmountsInBase(currencyRows, baseCurrency, rates);
    if (!result.canConvertAll) {
      canConvertAll = false;
      result.missingRates.forEach((currency) => allMissing.add(currency));
      totals.set(key, null);
    } else {
      totals.set(key, result.totalMinor ?? 0);
    }
  }

  return {
    totals,
    missingRates: [...allMissing].sort((a, b) => a.localeCompare(b)),
    canConvertAll,
  };
}
