import Link from "next/link";
import { useTranslations } from "next-intl";

export function TransactionTabs({
  activeTab,
  transactionsCount,
  transfersCount,
  searchParams,
}: {
  activeTab: "transactions" | "transfers";
  transactionsCount: number;
  transfersCount: number;
  searchParams: Record<string, string | undefined>;
}) {
  const t = useTranslations("pages.transactions");

  function buildHref(targetTab: "transactions" | "transfers") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "tab") {
        params.set(key, value);
      }
    }
    if (targetTab === "transfers") {
      params.set("tab", "transfers");
    } else {
      params.delete("tab");
    }
    const qs = params.toString();
    return `/dashboard/transactions${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex items-center gap-2 border-b border-[#E4DFD3] pb-2">
      <Link
        href={buildHref("transactions")}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
          activeTab === "transactions"
            ? "bg-[#065F46] text-white shadow-xs"
            : "text-neutral-600 hover:bg-neutral-200/60"
        }`}
      >
        <span>{t("ledgerTab")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            activeTab === "transactions" ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {transactionsCount}
        </span>
      </Link>

      <Link
        href={buildHref("transfers")}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
          activeTab === "transfers"
            ? "bg-blue-700 text-white shadow-xs"
            : "text-neutral-600 hover:bg-neutral-200/60"
        }`}
      >
        <span>{t("transfersTab")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            activeTab === "transfers" ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {transfersCount}
        </span>
      </Link>
    </div>
  );
}
