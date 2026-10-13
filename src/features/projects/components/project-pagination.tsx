"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function ProjectPagination({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  searchParams,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  searchParams: Record<string, string | undefined>;
}) {
  const tCommon = useTranslations("common");

  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(totalItems, page * pageSize);

  function buildHref(targetPage: number, targetPageSize: number = pageSize) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page" && key !== "limit") {
        params.set(key, value);
      }
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    if (targetPageSize !== 10) {
      params.set("limit", String(targetPageSize));
    }
    const qs = params.toString();
    return `/dashboard/projects${qs ? `?${qs}` : ""}`;
  }

  // Generate page numbers around current
  const pageNumbers: number[] = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  for (let p = startPage; p <= endPage; p++) {
    pageNumbers.push(p);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 shadow-xs sm:flex-row sm:px-5">
      {/* 1. Showing range */}
      <div className="text-xs font-medium text-neutral-500">
        {tCommon("showingRange", { from, to, total: totalItems })}
      </div>

      {/* 2. Page Navigation Buttons (Only if totalPages > 1) */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 text-xs">
        {/* Previous Page */}
        <Link
          href={buildHref(Math.max(1, page - 1))}
          scroll={false}
          prefetch={true}
          aria-disabled={page <= 1}
          className={`flex h-8 items-center justify-center rounded-lg px-2.5 font-semibold transition ${
            page <= 1
              ? "pointer-events-none text-neutral-300"
              : "border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {tCommon("previous")}
        </Link>

        {/* First page if far */}
        {startPage > 1 && (
          <>
            <Link
              href={buildHref(1)}
              scroll={false}
              prefetch={true}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              1
            </Link>
            {startPage > 2 && <span className="px-1 text-neutral-400">...</span>}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map((p) => {
          const isActive = p === page;
          return (
            <Link
              key={p}
              href={buildHref(p)}
              scroll={false}
              prefetch={true}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                isActive
                  ? "bg-[#065F46] text-white shadow-2xs"
                  : "border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {p}
            </Link>
          );
        })}

        {/* Last page if far */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-neutral-400">...</span>}
            <Link
              href={buildHref(totalPages)}
              scroll={false}
              prefetch={true}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              {totalPages}
            </Link>
          </>
        )}

        {/* Next Page */}
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          scroll={false}
          prefetch={true}
          aria-disabled={page >= totalPages}
          className={`flex h-8 items-center justify-center rounded-lg px-2.5 font-semibold transition ${
            page >= totalPages
              ? "pointer-events-none text-neutral-300"
              : "border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {tCommon("next")}
        </Link>
      </div>
      )}

      {/* 3. Page Size Selector */}
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span>{tCommon("perPage")}</span>
        {[10, 20, 50].map((size) => {
          const isCurrent = size === pageSize;
          const targetPage = Math.max(1, Math.floor(((page - 1) * pageSize) / size) + 1);
          return (
            <Link
              key={size}
              href={buildHref(targetPage, size)}
              scroll={false}
              prefetch={true}
              className={`rounded-lg px-2 py-1 font-bold transition ${
                isCurrent
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {size}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
