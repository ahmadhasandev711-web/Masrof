/** Public Pro price. Change the four numbers here only. */
export const PRO_MONTHLY_EGP = 250;
export const PRO_YEARLY_EGP = 2_500;
export const PRO_MONTHLY_USD = 5;
export const PRO_YEARLY_USD = 50;

export type BillingLocale = "ar" | "en";
export type BillingCurrency = "EGP" | "USD";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function formatBillingAmount(amount: number, locale: BillingLocale): string {
  const grouped = new Intl.NumberFormat("en-US").format(amount);
  if (locale === "en") return grouped;
  return grouped.replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]).replaceAll(",", "٬");
}

export function proMonthlyPeriod(currency: BillingCurrency, locale: BillingLocale): string {
  if (currency === "EGP") return locale === "ar" ? "ج.م / شهر" : "EGP / month";
  return locale === "ar" ? "دولار / شهر" : "USD / month";
}

export function proMonthlyAmount(currency: BillingCurrency, locale: BillingLocale): string {
  if (currency === "USD") return `$${formatBillingAmount(PRO_MONTHLY_USD, "en")}`;
  return formatBillingAmount(PRO_MONTHLY_EGP, locale);
}

export function proYearlyAmount(currency: BillingCurrency, locale: BillingLocale): string {
  if (currency === "USD") return `$${formatBillingAmount(PRO_YEARLY_USD, "en")}`;
  const formatted = formatBillingAmount(PRO_YEARLY_EGP, locale);
  return locale === "ar" ? `${formatted} ج.م` : `${formatted} EGP`;
}

/** Public price line. The page shows this and nothing else. */
export function proPricePhrase(locale: BillingLocale): string {
  const monthlyEgp = formatBillingAmount(PRO_MONTHLY_EGP, locale);
  if (locale === "ar") return `${monthlyEgp} ج.م / شهر`;
  return `${monthlyEgp} EGP / month`;
}

export function proMonthlySticker(locale: BillingLocale): string {
  return proPricePhrase(locale);
}

export function proUpgradeWhatsappText(_currency: BillingCurrency, locale: BillingLocale): string {
  const price = proPricePhrase(locale);
  if (locale === "ar") return `مرحباً، أود الترقية إلى باقة سندات برو (${price})`;
  return `Hi, I would like to upgrade to Sanadat Pro (${price})`;
}
