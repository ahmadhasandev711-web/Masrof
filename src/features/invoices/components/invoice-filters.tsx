"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type ClientOption = { _id: string; name: string };
type ProjectOption = { _id: string; name: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function InvoiceFiltersForm({
  clients = [],
  projects = [],
  currentFilters,
}: {
  clients?: ClientOption[];
  projects?: ProjectOption[];
  currentFilters: {
    status?: string;
    clientId?: string;
    projectId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    datePreset?: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tFilters = useTranslations("forms.invoiceFilters");

  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(currentFilters.search ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  function updateParams(updates: Record<string, string | null | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
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

  const now = new Date();
  const thisMonthStart = formatDateIso(new Date(now.getFullYear(), now.getMonth(), 1));
  const thisMonthEnd = formatDateIso(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const lastMonthStart = formatDateIso(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = formatDateIso(new Date(now.getFullYear(), now.getMonth(), 0));

  function handleDatePreset(preset: "all" | "thisMonth" | "lastMonth") {
    if (preset === "all") {
      updateParams({ datePreset: "all", dateFrom: null, dateTo: null });
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

  let activeDatePreset: "all" | "thisMonth" | "lastMonth" | "custom" = "thisMonth";
  if (currentFilters.datePreset === "all") {
    activeDatePreset = "all";
  } else if (
    currentFilters.datePreset === "thisMonth" ||
    (currentFilters.dateFrom === thisMonthStart && currentFilters.dateTo === thisMonthEnd)
  ) {
    activeDatePreset = "thisMonth";
  } else if (
    currentFilters.datePreset === "lastMonth" ||
    (currentFilters.dateFrom === lastMonthStart && currentFilters.dateTo === lastMonthEnd)
  ) {
    activeDatePreset = "lastMonth";
  } else if (currentFilters.dateFrom || currentFilters.dateTo) {
    activeDatePreset = "custom";
  } else {
    activeDatePreset = "thisMonth";
  }

  const currentStatus = currentFilters.status ?? "all";
  const activeClient = clients.find((c) => c._id === currentFilters.clientId);
  const activeProject = projects.find((p) => p._id === currentFilters.projectId);

  const hasAnyFilter = Boolean(
    (currentFilters.status && currentFilters.status !== "all") ||
      currentFilters.clientId ||
      currentFilters.projectId ||
      currentFilters.search ||
      activeDatePreset === "custom",
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/90 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-xs sm:p-5">
      {/* Pending Loading Indicator */}
      {isPending && (
        <div className="h-0.5 w-full overflow-hidden bg-neutral-100 dark:bg-[#1E2824] rounded-full">
          <div className="h-full bg-emerald-600 dark:bg-[#10B981] animate-pulse w-full" />
        </div>
      )}

      {/* 1. Top Row: Status Chips & Search Box */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => updateParams({ status: null })}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              currentStatus === "all"
                ? "bg-neutral-900 dark:bg-[#ECEAE4] text-white dark:text-[#0E1412] shadow-2xs"
                : "bg-neutral-100 dark:bg-[#1E2824] text-neutral-600 dark:text-[#9AA39F] hover:bg-neutral-200 dark:hover:bg-[#26302C]"
            }`}
          >
            {tFilters("all")}
          </button>
          <button
            type="button"
            onClick={() => updateParams({ status: "unpaid" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              currentStatus === "unpaid"
                ? "bg-rose-700 text-white shadow-2xs"
                : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-500/25"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>{tFilters("unpaid")}</span>
          </button>
          <button
            type="button"
            onClick={() => updateParams({ status: "partially_paid" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              currentStatus === "partially_paid"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-500/25"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>{tFilters("partiallyPaid")}</span>
          </button>
          <button
            type="button"
            onClick={() => updateParams({ status: "paid" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              currentStatus === "paid"
                ? "bg-emerald-700 dark:bg-[#10B981] text-white dark:text-[#04231A] shadow-2xs"
                : "bg-emerald-50 dark:bg-[#0F2E24] text-emerald-800 dark:text-[#34D399] hover:bg-emerald-100/70 dark:hover:bg-[#0F2E24]/80"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{tFilters("paid")}</span>
          </button>
          <button
            type="button"
            onClick={() => updateParams({ status: "overdue" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              currentStatus === "overdue"
                ? "bg-red-800 text-white shadow-2xs"
                : "bg-red-50 dark:bg-rose-500/15 text-red-800 dark:text-rose-400 hover:bg-red-100/70 dark:hover:bg-rose-500/25"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-600" />
            <span>{tFilters("overdue")}</span>
          </button>
          <button
            type="button"
            onClick={() => updateParams({ status: "cancelled" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              currentStatus === "cancelled"
                ? "bg-neutral-600 text-white shadow-2xs"
                : "bg-neutral-100 dark:bg-[#1E2824] text-neutral-600 dark:text-[#9AA39F] hover:bg-neutral-200 dark:hover:bg-[#26302C]"
            }`}
          >
            <span>{tFilters("cancelled")}</span>
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
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400 dark:text-[#66706B]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={tFilters("searchPlaceholder")}
            className="w-full rounded-xl border border-neutral-300 dark:border-[#26302C] bg-[#FBF9F4]/60 dark:bg-[#1E2824] py-2 ps-9 pe-8 text-xs text-neutral-900 dark:text-[#ECEAE4] transition focus:border-[#065F46] dark:focus:border-[#34D399] focus:bg-white dark:focus:bg-[#1E2824] focus:outline-none focus:ring-2 focus:ring-[#065F46]/10 dark:focus:ring-[#34D399]/20"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null });
              }}
              className="absolute inset-y-0 end-2.5 flex items-center text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-600 dark:hover:text-[#ECEAE4]"
              aria-label={tFilters("clearSearch")}
            >
              ✕
            </button>
          ) : null}
        </form>
      </div>

      {/* 2. Middle Row: Date Presets & Toggle Advanced */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 dark:border-[#26302C] pt-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-neutral-400 dark:text-[#66706B] font-semibold me-1">{tFilters("period")}</span>
          <button
            type="button"
            onClick={() => handleDatePreset("all")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "all"
                ? "bg-[#065F46] dark:bg-[#10B981] text-white dark:text-[#04231A] shadow-2xs font-bold"
                : "bg-neutral-100 dark:bg-[#1E2824] text-neutral-600 dark:text-[#9AA39F] hover:bg-neutral-200 dark:hover:bg-[#26302C]"
            }`}
          >
            {tFilters("all")}
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("thisMonth")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "thisMonth"
                ? "bg-[#065F46] dark:bg-[#10B981] text-white dark:text-[#04231A] shadow-2xs font-bold"
                : "bg-neutral-100 dark:bg-[#1E2824] text-neutral-600 dark:text-[#9AA39F] hover:bg-neutral-200 dark:hover:bg-[#26302C]"
            }`}
          >
            {tFilters("thisMonth")}
          </button>
          <button
            type="button"
            onClick={() => handleDatePreset("lastMonth")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              activeDatePreset === "lastMonth"
                ? "bg-[#065F46] dark:bg-[#10B981] text-white dark:text-[#04231A] shadow-2xs font-bold"
                : "bg-neutral-100 dark:bg-[#1E2824] text-neutral-600 dark:text-[#9AA39F] hover:bg-neutral-200 dark:hover:bg-[#26302C]"
            }`}
          >
            {tFilters("lastMonth")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-[#26302C] px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:text-[#ECEAE4] hover:bg-neutral-50 dark:hover:bg-[#1E2824]"
        >
          <svg className="h-3.5 w-3.5 text-neutral-500 dark:text-[#9AA39F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>{tFilters("filterByClientAndDate")}</span>
          <span className="text-[10px] text-neutral-400 dark:text-[#66706B]">{showAdvanced ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* 3. Advanced Row: Client, Project, Custom Dates */}
      {showAdvanced && (
        <div className="grid grid-cols-1 gap-2.5 border-t border-neutral-100 dark:border-[#26302C] pt-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in-0 duration-150">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#9AA39F]">{tFilters("client")}</label>
            <select
              value={currentFilters.clientId ?? ""}
              onChange={(e) => updateParams({ clientId: e.target.value || null })}
              className="rounded-xl border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-3 py-1.5 text-xs text-neutral-800 dark:text-[#ECEAE4] focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{tFilters("allClients")}</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#9AA39F]">{tFilters("project")}</label>
            <select
              value={currentFilters.projectId ?? ""}
              onChange={(e) => updateParams({ projectId: e.target.value || null })}
              className="rounded-xl border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-3 py-1.5 text-xs text-neutral-800 dark:text-[#ECEAE4] focus:border-emerald-600 focus:outline-none"
            >
              <option value="">{tFilters("allProjects")}</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#9AA39F]">{tFilters("dateFrom")}</label>
            <input
              type="date"
              value={currentFilters.dateFrom ?? ""}
              onChange={(e) => updateParams({ dateFrom: e.target.value || null })}
              className="rounded-xl border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-2 py-1.5 text-xs text-neutral-800 dark:text-[#ECEAE4] focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-500 dark:text-[#9AA39F]">{tFilters("dateTo")}</label>
            <input
              type="date"
              value={currentFilters.dateTo ?? ""}
              onChange={(e) => updateParams({ dateTo: e.target.value || null })}
              className="rounded-xl border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-2 py-1.5 text-xs text-neutral-800 dark:text-[#ECEAE4] focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 4. Active Filter Badges */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 dark:border-[#26302C] pt-2.5 text-xs">
          <span className="text-neutral-400 dark:text-[#66706B] text-[11px]">{tFilters("activeFilters")}</span>

          {currentFilters.status && currentFilters.status !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-[#1E2824] px-2 py-0.5 font-medium text-neutral-700 dark:text-[#ECEAE4]">
              <span>
                {tFilters("statusFilter", {
                  status:
                    currentFilters.status === "unpaid"
                      ? tFilters("unpaid")
                      : currentFilters.status === "partially_paid"
                      ? tFilters("partiallyPaid")
                      : currentFilters.status === "paid"
                      ? tFilters("paid")
                      : currentFilters.status === "overdue"
                      ? tFilters("overdue")
                      : tFilters("cancelled"),
                })}
              </span>
              <button
                type="button"
                onClick={() => updateParams({ status: null })}
                className="text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-700 dark:hover:text-[#ECEAE4]"
              >
                ✕
              </button>
            </span>
          )}

          {activeClient && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-[#1E2824] px-2 py-0.5 font-medium text-neutral-700 dark:text-[#ECEAE4]">
              <span>{tFilters("clientFilter", { name: activeClient.name })}</span>
              <button
                type="button"
                onClick={() => updateParams({ clientId: null })}
                className="text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-700 dark:hover:text-[#ECEAE4]"
              >
                ✕
              </button>
            </span>
          )}

          {activeProject && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-[#1E2824] px-2 py-0.5 font-medium text-neutral-700 dark:text-[#ECEAE4]">
              <span>{tFilters("projectFilter", { name: activeProject.name })}</span>
              <button
                type="button"
                onClick={() => updateParams({ projectId: null })}
                className="text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-700 dark:hover:text-[#ECEAE4]"
              >
                ✕
              </button>
            </span>
          )}

          {currentFilters.search && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-[#1E2824] px-2 py-0.5 font-medium text-neutral-700 dark:text-[#ECEAE4]">
              <span>{tFilters("searchFilter", { query: currentFilters.search })}</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateParams({ search: null });
                }}
                className="text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-700 dark:hover:text-[#ECEAE4]"
              >
                ✕
              </button>
            </span>
          )}

          {activeDatePreset === "custom" && currentFilters.dateFrom && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-[#1E2824] px-2 py-0.5 font-medium text-neutral-700 dark:text-[#ECEAE4]">
              <span>{tFilters("from", { date: currentFilters.dateFrom })}</span>
              <button
                type="button"
                onClick={() => updateParams({ dateFrom: null })}
                className="text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-700 dark:hover:text-[#ECEAE4]"
              >
                ✕
              </button>
            </span>
          )}

          {activeDatePreset === "custom" && currentFilters.dateTo && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-[#1E2824] px-2 py-0.5 font-medium text-neutral-700 dark:text-[#ECEAE4]">
              <span>{tFilters("to", { date: currentFilters.dateTo })}</span>
              <button
                type="button"
                onClick={() => updateParams({ dateTo: null })}
                className="text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-700 dark:hover:text-[#ECEAE4]"
              >
                ✕
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              updateParams({
                status: null,
                clientId: null,
                projectId: null,
                search: null,
                dateFrom: null,
                dateTo: null,
                datePreset: null,
              });
            }}
            className="ms-auto rounded-lg px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            {tFilters("clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
