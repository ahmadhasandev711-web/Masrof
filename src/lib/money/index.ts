/**
 * Money handling strategy for the whole application.
 *
 * PROBLEM: JavaScript floating-point numbers cannot represent decimal
 * fractions like 0.1 exactly (0.1 + 0.2 !== 0.3). For financial data,
 * this is unacceptable — rounding errors compound over thousands of
 * transactions and users will notice wrong totals.
 *
 * SOLUTION: Store every monetary amount as an INTEGER representing the
 * smallest currency unit (piastres/qirsh for EGP, cents for USD, etc).
 * Example: 100.50 EGP is stored as the integer 10050.
 *
 * This "MinorUnits" representation is used EVERYWHERE:
 *   - MongoDB documents (Transaction.amount, Account.openingBalance...)
 *   - Business logic and aggregations
 *   - Server Actions / Route Handlers
 *
 * Only the UI layer converts MinorUnits -> a human-readable string,
 * using `formatMoney`. Never do math on the formatted string.
 */

/** An integer amount in the currency's smallest unit. Always store this in the DB. */
export type MinorUnits = number;

const DEFAULT_MINOR_UNIT_FACTOR = 100; // 2 decimal places (EGP, USD, EUR...)

/**
 * Converts a user-facing decimal amount (e.g. "100.50") into MinorUnits (10050).
 * Use this ONLY at the boundary where user input enters the system (forms).
 */
export function toMinorUnits(
  amount: number | string,
  factor: number = DEFAULT_MINOR_UNIT_FACTOR,
): MinorUnits {
  const numeric = typeof amount === "string" ? Number(amount) : amount;

  if (!Number.isFinite(numeric)) {
    throw new Error(`toMinorUnits: "${amount}" is not a valid number`);
  }

  // Round instead of truncating to avoid losing a piastre due to
  // floating point representation of the input itself.
  return Math.round(numeric * factor);
}

/** Converts MinorUnits (10050) back into a decimal number (100.5) for calculations that need it. */
export function fromMinorUnits(
  amount: MinorUnits,
  factor: number = DEFAULT_MINOR_UNIT_FACTOR,
): number {
  return amount / factor;
}

/**
 * Formats MinorUnits into a localized, currency-aware display string.
 * This is the ONLY place UI code should turn money into text.
 */
export function formatMoney(
  amount: MinorUnits,
  options: { currency?: string; locale?: string } = {},
): string {
  const { currency = "EGP", locale = "ar-EG" } = options;
  const hasFractions = Math.abs(amount) % DEFAULT_MINOR_UNIT_FACTOR !== 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: hasFractions ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(fromMinorUnits(amount));
}

/** Safe addition of MinorUnits (still integer arithmetic, no floating point risk). */
export function addMoney(...amounts: MinorUnits[]): MinorUnits {
  return amounts.reduce((sum, value) => sum + value, 0);
}

/** Safe subtraction: base minus every subsequent amount. */
export function subtractMoney(base: MinorUnits, ...amounts: MinorUnits[]): MinorUnits {
  return amounts.reduce((result, value) => result - value, base);
}
