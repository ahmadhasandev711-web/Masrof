import { getTranslations } from "next-intl/server";

type LedgerRow = {
  label: string;
  amount: string;
  positive: boolean;
};

export async function LedgerCard() {
  const t = await getTranslations("marketing");
  const rows = t.raw("ledger.rows") as LedgerRow[];

  return (
    <div className="relative -rotate-1 rounded-sm border border-[#E4DFD3] bg-white p-6 shadow-[0_20px_45px_-15px_rgba(6,95,70,0.25)] sm:p-8">
      <div className="mb-4 flex items-center justify-between border-b border-dashed border-[#E4DFD3] pb-3">
        <span className="font-[family-name:var(--font-marketing-display)] text-lg text-[#1C1B1A]/70">
          {t("ledger.title")}
        </span>
        <span className="text-xs text-[#1C1B1A]/40">{t("ledger.workspace")}</span>
      </div>

      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-[#1C1B1A]/70">{row.label}</span>
            <span
              dir="ltr"
              className={`font-[family-name:var(--font-mono)] ${
                row.positive ? "text-[#065F46]" : "text-[#1C1B1A]/70"
              }`}
            >
              {row.amount}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-[#E4DFD3] pt-4">
        <span className="font-medium text-[#1C1B1A]">{t("ledger.net")}</span>
        <span dir="ltr" className="font-[family-name:var(--font-mono)] text-lg font-semibold text-[#065F46]">
          {t("ledger.total")}
        </span>
      </div>
    </div>
  );
}
