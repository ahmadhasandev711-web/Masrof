import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@contracts/shared/constants";

export { SUPPORTED_CURRENCIES, type SupportedCurrency };

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
