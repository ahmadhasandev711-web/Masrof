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
    <div className="flex w-full rounded-2xl bg-neutral-100 p-1">
      <Link
        href={buildHref("transactions")}
        scroll={false}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs sm:text-sm font-bold transition ${
          activeTab === "transactions"
            ? "bg-[#065F46] text-white shadow-xs"
            : "text-neutral-600 hover:text-neutral-900"
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
        scroll={false}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs sm:text-sm font-bold transition ${
          activeTab === "transfers"
            ? "bg-blue-700 text-white shadow-xs"
            : "text-neutral-600 hover:text-neutral-900"
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
