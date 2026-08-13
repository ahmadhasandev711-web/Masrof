import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { QuantityUsage } from "@/features/subscriptions/quantity-usage";

export async function PlanUsageMeter({
  usage,
  label,
}: {
  usage: QuantityUsage;
  label: string;
}) {
  if (usage.unlimited) return null;

  const t = await getTranslations("dashboard.usage");
  const percent = usage.limit <= 0 ? 100 : Math.min(100, Math.round((usage.used / usage.limit) * 100));

  return (
    <div
      className={`rounded-xl border p-3 ${
        usage.atLimit
          ? "border-amber-200 bg-amber-50/80"
          : "border-[#E4DFD3] bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-[#1C1B1A]">{label}</p>
        <p className={`tabular-nums ${usage.atLimit ? "font-semibold text-amber-800" : "text-[#1C1B1A]/60"}`}>
          {usage.used}/{usage.limit}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E4DFD3]">
        <div
          className={`h-full rounded-full ${usage.atLimit ? "bg-amber-500" : "bg-[#065F46]"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {usage.atLimit ? (
        <p className="mt-2 text-xs text-amber-800">
          {t("upgradeHint")}{" "}
          <Link href="/dashboard/plan" className="font-medium underline">
            {t("upgradeLink")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
