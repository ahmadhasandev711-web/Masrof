import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { SupportedCurrency } from "@/lib/currency";

export async function ReportConversionNotice({
  canConvertAll,
  missingRates,
}: {
  canConvertAll: boolean;
  missingRates: SupportedCurrency[];
}) {
  if (canConvertAll) return null;

  const t = await getTranslations("reports.conversion");

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>{t("incomplete")}</p>
      {missingRates.length > 0 && (
        <p className="mt-1 text-xs text-amber-800">{t("missingRates", { currencies: missingRates.join(", ") })}</p>
      )}
      <Link href="/dashboard/accounts" className="mt-2 inline-block text-xs font-medium text-[#065F46] hover:underline">
        {t("manageRates")}
      </Link>
    </div>
  );
}
