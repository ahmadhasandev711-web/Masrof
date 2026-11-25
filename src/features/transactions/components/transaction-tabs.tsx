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
    <div className="flex w-full rounded-2xl bg-neutral-100 dark:bg-[#1E2824] p-1">
      <Link
        href={buildHref("transactions")}
        scroll={false}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs sm:text-sm font-bold transition ${
          activeTab === "transactions"
            ? "bg-[#065F46] dark:bg-[#10B981] text-white dark:text-[#04231A] shadow-xs"
            : "text-neutral-600 dark:text-[#9AA39F] hover:text-neutral-900 dark:hover:text-[#ECEAE4]"
        }`}
      >
        <span>{t("ledgerTab")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            activeTab === "transactions" ? "bg-white/20 text-white dark:bg-[#04231A]/15 dark:text-[#04231A]" : "bg-neutral-200 dark:bg-[#26302C] text-neutral-700 dark:text-[#ECEAE4]"
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
            ? "bg-blue-700 dark:bg-blue-500 text-white shadow-xs"
            : "text-neutral-600 dark:text-[#9AA39F] hover:text-neutral-900 dark:hover:text-[#ECEAE4]"
        }`}
      >
        <span>{t("transfersTab")}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            activeTab === "transfers" ? "bg-white/20 text-white" : "bg-neutral-200 dark:bg-[#26302C] text-neutral-700 dark:text-[#ECEAE4]"
          }`}
        >
          {transfersCount}
        </span>
      </Link>
    </div>
  );
}
