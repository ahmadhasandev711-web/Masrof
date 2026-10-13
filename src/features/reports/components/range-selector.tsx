"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { REPORT_RANGE_PRESETS, type ReportRangePreset } from "@/features/reports/date-ranges";
import { useTranslations } from "next-intl";

export function ReportRangeSelector({
  currentPreset,
  currentFrom = "",
  currentTo = "",
}: {
  currentPreset: string;
  currentFrom?: string;
  currentTo?: string;
}) {
  const t = useTranslations("reports.range");
  const tPages = useTranslations("pages.reports");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fromValue, setFromValue] = useState(currentFrom);
  const [toValue, setToValue] = useState(currentTo);

  const isCustom = currentPreset === "custom";

  function handleSelectPreset(preset: ReportRangePreset) {
    if (preset === "custom") {
      startTransition(() => {
        router.push("/dashboard/reports?range=custom", { scroll: false });
      });
      return;
    }
    startTransition(() => {
      router.push(`/dashboard/reports?range=${preset}`, { scroll: false });
    });
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ range: "custom" });
    if (fromValue) params.set("from", fromValue);
    if (toValue) params.set("to", toValue);
    startTransition(() => {
      router.push(`/dashboard/reports?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
      {/* 1. Quick Period Pills (Scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {REPORT_RANGE_PRESETS.map((preset) => {
          const isActive = currentPreset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              disabled={isPending}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                isActive
                  ? "bg-[#065F46] text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
              }`}
            >
              <span>{t(preset)}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Custom Date Range Inputs (Only when custom preset is selected) */}
      {isCustom && (
        <form
          onSubmit={handleCustomSubmit}
          className="flex flex-wrap items-end gap-3 pt-3 border-t border-neutral-100"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-xs font-semibold text-neutral-600">
              {t("from")}
            </label>
            <input
              id="from"
              type="date"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-[#FBF9F4]/60 px-3 py-1.5 text-xs text-neutral-800 focus:border-[#065F46] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-xs font-semibold text-neutral-600">
              {t("to")}
            </label>
            <input
              id="to"
              type="date"
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-[#FBF9F4]/60 px-3 py-1.5 text-xs text-neutral-800 focus:border-[#065F46] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-[#065F46] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#054E3A] disabled:opacity-50"
          >
            {t("apply")}
          </button>
        </form>
      )}
    </div>
  );
}
