"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CategoryOption } from "@/features/categories/map-options";

type AccountOption = { id: string; name: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function TransactionFiltersForm({
  accounts,
  categories,
  currentFilters,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  currentFilters: {
    type?: string;
    accountId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    datePreset?: string;
    search?: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tFilters = useTranslations("forms.transactionFilters");
  const tTransaction = useTranslations("forms.transaction");
  const tShared = useTranslations("forms.shared");

  const [, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(currentFilters.search ?? "");

  // Update URL helper preserving tab, page, etc.
  function updateParams(updates: Record<string, string | null | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    // Reset page to 1 when changing filters
    next.delete("page");

    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === undefined || val === "") {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    const qs = next.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  // Quick Date Preset Handler
  function handleDatePreset(preset: "all" | "today" | "thisMonth" | "lastMonth") {
    if (preset === "all") {
      updateParams({ datePreset: "all", dateFrom: null, dateTo: null });
      return;
    }
    if (preset === "today") {
      updateParams({ datePreset: "today", dateFrom: todayStr, dateTo: todayStr });
      return;
    }
    if (preset === "thisMonth") {
      updateParams({ datePreset: "thisMonth", dateFrom: thisMonthStart, dateTo: thisMonthEnd });
      return;
    }
    if (preset === "lastMonth") {
      updateParams({ datePreset: "lastMonth", dateFrom: lastMonthStart, dateTo: lastMonthEnd });
      return;
    }
  }

  // Detect active date preset
  const now = new Date();
  const todayStr = formatDateIso(now);
  const thisMonthStart = formatDateIso(new Date(now.getFullYear(), now.getMonth(), 1));
  const thisMonthEnd = formatDateIso(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const lastMonthStart = formatDateIso(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = formatDateIso(new Date(now.getFullYear(), now.getMonth(), 0));

  let activeDatePreset: "all" | "today" | "thisMonth" | "lastMonth" | "custom" = "today";
  if (currentFilters.datePreset === "all") {
    activeDatePreset = "all";
  } else if (
    currentFilters.datePreset === "today" ||
    (currentFilters.dateFrom === todayStr && currentFilters.dateTo === todayStr)
  ) {
    activeDatePreset = "today";
  } else if (currentFilters.dateFrom === thisMonthStart && currentFilters.dateTo === thisMonthEnd) {
    activeDatePreset = "thisMonth";
  } else if (currentFilters.dateFrom === lastMonthStart && currentFilters.dateTo === lastMonthEnd) {
    activeDatePreset = "lastMonth";
  } else if (!currentFilters.dateFrom && !currentFilters.dateTo && !currentFilters.datePreset) {
    activeDatePreset = "today";
  } else {
    activeDatePreset = "custom";
  }

  const activeAccount = accounts.find((a) => a.id === currentFilters.accountId);
  const activeCategory = categories.find((c) => c.id === currentFilters.categoryId);

  const hasAnyFilter = Boolean(
    currentFilters.type ||
      currentFilters.accountId ||
      currentFilters.categoryId ||
      currentFilters.search ||
      activeDatePreset === "custom",
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs sm:p-5">
      {/* 1. Top Row: Quick Type Chips & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => updateParams({ type: null })}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              !currentFilters.type
                ? "bg-neutral-900 text-white shadow-2xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tFilters("allTypes")}
          </button>
          <button
            type="button"
            onClick={() => updateParams({ type: "expense" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              currentFilters.type === "expense"
                ? "bg-rose-700 text-white shadow-2xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100/70"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>{tTransaction("expense")}</span>
          </button>
          <button
            type="button"
            onClick={() => updateParams({ type: "income" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              currentFilters.type === "income"
                ? "bg-emerald-700 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{tTransaction("income")}</span>
          </button>
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ search: searchInput.trim() || null });
          }}
          className="relative min-w-0 flex-1 sm:max-w-xs"
        >
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={tFilters("search")}
            className="w-full rounded-xl border border-neutral-300 bg-[#FBF9F4]/60 py-2 ps-9 pe-8 text-xs text-neutral-900 transition focus:border-[#065F46] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#065F46]/10"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null });
              }}
              className="absolute inset-y-0 end-2.5 flex items-center text-neutral-400 hover:text-neutral-600"
              aria-label={tFilters("clearSearch")}
            >
              
            </button>
          ) : null}
        </form>
      </div>

      {/* 2. Middle Row: Date Presets & Advanced Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
        {/* Date Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-0.5 scrollbar-none">
          <span className="text-neutral-400 font-semibold me-1 shrink-0">{tFilters("period")}</span>
          <button
            type="button"
            onClick={() => handleDatePreset("today")}
            className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "today"
                ? "bg-[#065F46] text-white shadow-2xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tFilters("today")}
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("thisMonth")}
            className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "thisMonth"
                ? "bg-[#065F46] text-white shadow-2xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tFilters("thisMonth")}
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("lastMonth")}
            className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "lastMonth"
                ? "bg-[#065F46] text-white shadow-2xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tFilters("lastMonth")}
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("all")}
            className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "all"
                ? "bg-[#065F46] text-white shadow-2xs"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tFilters("all")}
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "custom"
                ? "bg-emerald-800 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tFilters("customDate")}
          </button>
        </div>

        {/* Toggle Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
            showAdvanced || Boolean(currentFilters.accountId || currentFilters.categoryId)
              ? "border-emerald-600 bg-emerald-50/60 text-emerald-800"
              : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          <svg className="h-3.5 w-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>{tFilters("moreFilters")}</span>
          <span className="text-[10px] text-neutral-400">{showAdvanced ? "" : ""}</span>
        </button>
      </div>

      {/* 3. Advanced Filters Row (Expandable) */}
      {showAdvanced && (
        <div className="grid grid-cols-1 gap-2.5 border-t border-neutral-100 pt-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in-0 duration-150">
          {/* Account Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500">{tShared("account")}</label>
            <select
              value={currentFilters.accountId ?? ""}
              onChange={(e) => updateParams({ accountId: e.target.value || null })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{tFilters("allAccounts")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500">{tShared("category")}</label>
            <select
              value={currentFilters.categoryId ?? ""}
              onChange={(e) => updateParams({ categoryId: e.target.value || null })}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{tFilters("allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500">{tFilters("dateFrom")}</label>
            <input
              type="date"
              value={currentFilters.dateFrom ?? ""}
              onChange={(e) => updateParams({ dateFrom: e.target.value || null })}
              className="rounded-xl border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Custom Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500">{tFilters("dateTo")}</label>
            <input
              type="date"
              value={currentFilters.dateTo ?? ""}
              onChange={(e) => updateParams({ dateTo: e.target.value || null })}
              className="rounded-xl border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800 focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 4. Active Filters Badges & Clear All */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-2.5 text-xs">
          <span className="text-neutral-400 text-[11px]">{tFilters("activeFilters")}</span>

          {currentFilters.type && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              <span>{currentFilters.type === "income" ? tTransaction("income") : tTransaction("expense")}</span>
              <button
                type="button"
                onClick={() => updateParams({ type: null })}
                className="text-neutral-400 hover:text-neutral-700"
              >
                
              </button>
            </span>
          )}

          {activeAccount && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              <span>{tFilters("accountFilter", { name: activeAccount.name })}</span>
              <button
                type="button"
                onClick={() => updateParams({ accountId: null })}
                className="text-neutral-400 hover:text-neutral-700"
              >
                
              </button>
            </span>
          )}

          {activeCategory && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              <span>{tFilters("categoryFilter", { name: activeCategory.name })}</span>
              <button
                type="button"
                onClick={() => updateParams({ categoryId: null })}
                className="text-neutral-400 hover:text-neutral-700"
              >
                
              </button>
            </span>
          )}

          {activeDatePreset === "custom" && currentFilters.dateFrom && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              <span>{tFilters("from", { date: currentFilters.dateFrom })}</span>
              <button
                type="button"
                onClick={() => updateParams({ dateFrom: null, dateTo: null, datePreset: "today" })}
                className="text-neutral-400 hover:text-neutral-700"
              >
                
              </button>
            </span>
          )}

          {activeDatePreset === "custom" && currentFilters.dateTo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              <span>{tFilters("to", { date: currentFilters.dateTo })}</span>
              <button
                type="button"
                onClick={() => updateParams({ dateFrom: null, dateTo: null, datePreset: "today" })}
                className="text-neutral-400 hover:text-neutral-700"
              >
                
              </button>
            </span>
          )}

          {currentFilters.search && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              <span>{tFilters("searchFilter", { query: currentFilters.search })}</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateParams({ search: null });
                }}
                className="text-neutral-400 hover:text-neutral-700"
              >
                
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              updateParams({
                type: null,
                accountId: null,
                categoryId: null,
                dateFrom: null,
                dateTo: null,
                datePreset: null,
                search: null,
              });
            }}
            className="ms-auto rounded-lg px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
          >
            {tFilters("clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
