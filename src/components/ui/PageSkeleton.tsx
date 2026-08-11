import React from "react";

/** Pulse bone — use for inline placeholders when needed. */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-ink-100 ${className}`}
      style={style}
      aria-hidden
    />
  );
}

/** Book cover cell — matches Browse Books grid card. */
function BookCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-100 bg-white overflow-hidden shadow-sm">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Default page loading shell shaped like Browse Books:
 * title + search tools → category chips → catalog grid of book cards.
 * Use for all non-dashboard content load states.
 */
export default function PageSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`w-full space-y-5 ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {/* Header: title + search / sort (Browse Books) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-full sm:w-64 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* Category chips */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <div className="flex flex-wrap gap-2">
          {[72, 88, 64, 96, 80, 70, 100, 76].map((w, i) => (
            <Skeleton
              key={i}
              className="h-8 rounded-full"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Catalog card */}
      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-5">
          <div className="space-y-2 min-w-0">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }, (_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard-only loading shell: KPIs, charts, table.
 * Keep this for DashboardOverview; all other pages use PageSkeleton.
 */
export function DashboardSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`w-full space-y-5 ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex items-end justify-between gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-36" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="h-64 flex items-end justify-around gap-3 px-1">
            {[40, 65, 50, 80, 55, 70].map((h, i) => (
              <Skeleton
                key={i}
                className="w-full max-w-[64px] rounded-md"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-3 w-16 rounded-full" />
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="h-36 flex items-end gap-1.5">
              {[45, 60, 35, 70, 50, 80, 40].map((h, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex items-center justify-center py-2">
              <Skeleton className="h-36 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="space-y-3">
          <div className="flex gap-4 pb-3 border-b border-ink-50">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16 ml-4" />
              <Skeleton className="h-1.5 flex-1 max-w-[120px] rounded-full" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
