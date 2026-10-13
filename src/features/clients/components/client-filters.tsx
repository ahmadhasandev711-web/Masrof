"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

export type ClientFilterCounts = {
  all: number;
  with_debt: number;
  with_projects: number;
};

export function ClientFilters({
  activeFilter = "all",
  searchQuery = "",
  counts,
  searchParams,
}: {
  activeFilter?: string;
  searchQuery?: string;
  counts: ClientFilterCounts;
  searchParams: Record<string, string | undefined>;
}) {
  const t = useTranslations("pages.clients");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchQuery);

  function buildHref(filter: string, query?: string) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "status" && key !== "q" && key !== "page") {
        params.set(key, value);
      }
    }
    if (filter && filter !== "all") {
      params.set("status", filter);
    }
    const q = query !== undefined ? query : searchValue;
    if (q && q.trim()) {
      params.set("q", q.trim());
    }
    // Reset page to 1 on filter or search change
    const qs = params.toString();
    return `/dashboard/clients${qs ? `?${qs}` : ""}`;
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(buildHref(activeFilter, searchValue), { scroll: false });
    });
  }

  function handleClearSearch() {
    setSearchValue("");
    startTransition(() => {
      router.push(buildHref(activeFilter, ""), { scroll: false });
    });
  }

  const tabs = [
    { key: "all", label: t("filterAll"), count: counts.all },
    { key: "with_debt", label: t("filterWithDebt"), count: counts.with_debt },
    { key: "with_projects", label: t("filterWithProjects"), count: counts.with_projects },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
      {/* 1. Integrated Search Bar (No separate external button) */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-neutral-200 bg-[#FBF9F4]/60 py-2.5 ps-9 pe-8 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#065F46] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#065F46]/10"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 end-2.5 flex items-center text-neutral-400 hover:text-neutral-600"
            aria-label={t("clearSearch")}
          >
            ✕
          </button>
        )}
      </form>

      {/* 2. Status Filter Tabs (Scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Link
              key={tab.key}
              href={buildHref(tab.key)}
              scroll={false}
              prefetch={true}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                isActive
                  ? "bg-[#065F46] text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-neutral-200/80 text-neutral-700"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
