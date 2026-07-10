export const SUPPORTED_CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  EGP: "جنيه مصري",
  USD: "دولار أمريكي",
  EUR: "يورو",
  SAR: "ريال سعودي",
  AED: "درهم إماراتي",
};

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
