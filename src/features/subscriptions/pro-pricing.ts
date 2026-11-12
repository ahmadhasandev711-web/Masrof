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

/** Charged amount under the monthly sticker. */
export function proAnnualPaymentNote(currency: BillingCurrency, locale: BillingLocale): string {
  const yearly = proYearlyAmount(currency, locale);
  if (locale === "ar") return `تُدفع ${yearly} في السنة · شهرين مجاناً`;
  return `Billed ${yearly} / year · 2 months free`;
}

/** Homepage has no currency switch, so both billed amounts stay visible. */
export function proHomepageYearlyLine(locale: BillingLocale): string {
  const egp = formatBillingAmount(PRO_YEARLY_EGP, locale);
  const usd = `$${formatBillingAmount(PRO_YEARLY_USD, "en")}`;
  if (locale === "ar") return `الدفع السنوي ${egp} ج.م أو ${usd} · شهرين مجاناً`;
  return `Billed yearly: ${egp} EGP or ${usd} · 2 months free`;
}

/** Full offer for sentences in FAQ, pricing intro, and the plan screen. */
export function proPricePhrase(locale: BillingLocale): string {
  const monthlyEgp = formatBillingAmount(PRO_MONTHLY_EGP, locale);
  const yearlyEgp = formatBillingAmount(PRO_YEARLY_EGP, locale);
  if (locale === "ar") {
    return `${monthlyEgp} ج.م/شهر في مصر (تُدفع ${yearlyEgp} ج.م سنوياً) أو $${PRO_MONTHLY_USD}/شهر للخليج والأجانب (تُدفع $${PRO_YEARLY_USD} سنوياً)، بشهرين مجاناً`;
  }
  return `${monthlyEgp} EGP/month in Egypt (billed ${yearlyEgp} EGP/year) or $${PRO_MONTHLY_USD}/month for Gulf and international customers (billed $${PRO_YEARLY_USD}/year), with 2 months free`;
}

export function proMonthlySticker(locale: BillingLocale): string {
  const monthlyEgp = formatBillingAmount(PRO_MONTHLY_EGP, locale);
  if (locale === "ar") return `${monthlyEgp} ج.م أو $${PRO_MONTHLY_USD} / شهر`;
  return `${monthlyEgp} EGP or $${PRO_MONTHLY_USD} / month`;
}

export function proUpgradeWhatsappText(currency: BillingCurrency, locale: BillingLocale): string {
  const yearly = proYearlyAmount(currency, locale);
  if (locale === "ar") return `مرحباً، أود الترقية إلى باقة سندات برو (${yearly} سنوياً)`;
  return `Hi, I would like to upgrade to Sanadat Pro (${yearly}/year)`;
}
