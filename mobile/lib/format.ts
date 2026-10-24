let currentLocale: "ar" | "en" = "ar";

export function setFormatLocale(locale: "ar" | "en") {
  currentLocale = locale;
}

const DEFAULT_FACTOR = 100;

/**
 * Converts a user-facing decimal amount (e.g. "100.50" or 100.5) into Minor Units (10050)
 * using rounding to prevent floating-point representation drift.
 */
export function toMinorUnits(amount: number | string, factor = DEFAULT_FACTOR): number {
  const normalized = typeof amount === "string" ? normalizeDigits(amount) : amount;
  const num = typeof normalized === "string" ? Number(normalized) : normalized;
  if (!Number.isFinite(num)) {
    throw new Error(`toMinorUnits: "${amount}" is not a valid number`);
  }
  return Math.round(num * factor);
}

/**
 * Converts Minor Units (10050) back to a decimal number (100.5) for calculations or display.
 */
export function fromMinorUnits(amount: number, factor = DEFAULT_FACTOR): number {
  return amount / factor;
}

/**
 * Normalizes Eastern Arabic numerals (٠-٩) and Persian numerals to Western digits (0-9)
 * and normalizes decimal commas to dots.
 */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/٫/g, ".")
    .replace(/,/g, ".");
}

/**
 * Parses user text input safely into a valid positive number, or null if invalid.
 */
export function parsePositiveAmount(input: string): number | null {
  const cleaned = normalizeDigits(input.trim());
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export function formatMoney(
  amountMinor: number | null | undefined,
  currency = "EGP",
  locale?: "ar" | "en",
) {
  if (amountMinor == null || Number.isNaN(amountMinor)) return "—";
  const major = fromMinorUnits(amountMinor);
  const l = locale ?? currentLocale;
  const intlLocale = l === "en" ? "en-US" : "ar-EG";
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

export function formatDate(
  iso: string | Date | null | undefined,
  locale?: "ar" | "en",
) {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const l = locale ?? currentLocale;
  const intlLocale = l === "en" ? "en-US" : "ar-EG";
  return new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
