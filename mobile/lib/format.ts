let currentLocale: "ar" | "en" = "ar";

export function setFormatLocale(locale: "ar" | "en") {
  currentLocale = locale;
}

export function formatMoney(
  amountMinor: number | null | undefined,
  currency = "EGP",
  locale?: "ar" | "en",
) {
  if (amountMinor == null || Number.isNaN(amountMinor)) return "—";
  const major = amountMinor / 100;
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
