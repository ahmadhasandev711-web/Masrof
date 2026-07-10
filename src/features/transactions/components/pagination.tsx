import Link from "next/link";

export function TransactionPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `/dashboard/transactions?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-lg border px-3 py-1.5 ${
          page <= 1
            ? "pointer-events-none border-neutral-100 text-neutral-300"
            : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        {"‹"}
      </Link>
      <span className="text-neutral-500">
        {page} / {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-lg border px-3 py-1.5 ${
          page >= totalPages
            ? "pointer-events-none border-neutral-100 text-neutral-300"
            : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        {"›"}
      </Link>
    </div>
  );
}
