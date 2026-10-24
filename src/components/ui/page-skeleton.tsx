export function PageSkeleton({
  cardsCount = 3,
  rowsCount = 4,
}: {
  cardsCount?: number;
  rowsCount?: number;
}) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-5 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-36 rounded-xl bg-[#E4DFD3]/70" />
          <div className="h-3 w-24 rounded-lg bg-[#E4DFD3]/50" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-[#E4DFD3]/60" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-2xl border border-[#E4DFD3]/60 bg-white p-3.5 shadow-xs"
          >
            <div className="h-3 w-16 rounded bg-[#E4DFD3]/50" />
            <div className="h-5 w-24 rounded bg-[#E4DFD3]/70" />
          </div>
        ))}
      </div>

      {/* List / Content Rows Skeleton */}
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: rowsCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-[#E4DFD3]/60 bg-white p-4 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#E4DFD3]/60 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-32 rounded bg-[#E4DFD3]/70" />
                <div className="h-3 w-20 rounded bg-[#E4DFD3]/40" />
              </div>
            </div>
            <div className="h-4 w-16 rounded bg-[#E4DFD3]/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
