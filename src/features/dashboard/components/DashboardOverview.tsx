import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  CalendarDays,
  Clock3,
  Download,
  Heart,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toPng } from "html-to-image";
import {
  getDashboardOverview,
  type ActivityBar,
  type DashboardMetric,
  type DashboardOverview as DashboardData,
  type DistributionSlice,
  type TimePoint,
  type ValueFormat,
} from "@/api/dashboard.api";
import { useUser } from "@/contexts/UserContext";
import { DashboardSkeleton } from "@/components/ui/PageSkeleton";
import { useToast } from "@/contexts/ToastContext";

const SERIES_COLORS = [
  "#08111c",
  "#152840",
  "#1e3552",
  "#2a4566",
  "#3d5a7c",
];

/** Ink-family tones used for metrics (matches app theme) */
const SPARKLINE_COLORS = ["#152840", "#1e3552", "#2a4566", "#3d5a7c"];

const USER_METRIC_ACCENTS = [
  {
    iconBg: "bg-ink-100",
    iconText: "text-ink-800",
    chip: "bg-ink-50 text-ink-700",
  },
  {
    iconBg: "bg-ink-50",
    iconText: "text-ink-700",
    chip: "bg-ink-50 text-ink-600",
  },
  {
    iconBg: "bg-ink-100",
    iconText: "text-ink-800",
    chip: "bg-ink-50 text-ink-700",
  },
  {
    iconBg: "bg-ink-50",
    iconText: "text-ink-700",
    chip: "bg-ink-50 text-ink-600",
  },
];

/** Simple rising/falling mock points from metric seed */
function sparkPoints(seed: number, up: boolean, n = 12): number[] {
  const pts: number[] = [];
  let v = 40 + (seed % 20);
  for (let i = 0; i < n; i++) {
    const drift = up ? 1.6 : -1.2;
    const wobble = Math.sin(i * 0.9 + seed) * 6 + ((seed * (i + 3)) % 7) - 3;
    v = Math.max(8, Math.min(92, v + drift + wobble * 0.35));
    pts.push(v);
  }
  return pts;
}

function Sparkline({
  values,
  color,
  id,
}: {
  values: number[];
  color: string;
  id: string;
}) {
  const w = 120;
  const h = 48;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const coords = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return { x, y };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${h} L ${coords[0].x.toFixed(1)} ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-12 w-[7.5rem] shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatMetricDisplay(
  card: DashboardMetric,
  jitter: number,
): string {
  if (card.isCurrency) return formatMoney(card.numericValue + jitter);
  if (card.isPercent)
    return `${(card.numericValue + jitter * 0.05).toFixed(1)}%`;
  if (card.isMinutes)
    return formatValue(Math.max(0, card.numericValue + jitter), "minutes");
  return formatCompact(Math.max(0, card.numericValue + jitter));
}

type ActivityPeriod = "weekly" | "monthly" | "quarterly";
type TimePeriod = "weekly" | "monthly";
type DistMode = "weekly" | "monthly";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatValue(n: number, format: ValueFormat) {
  if (format === "currency") return formatMoney(n);
  if (format === "minutes") {
    if (n >= 60) {
      const h = Math.floor(n / 60);
      const m = Math.round(n % 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${Math.round(n)}m`;
  }
  return formatCompact(n);
}

function metricIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("sold") || t.includes("list")) return BookMarked;
  if (t.includes("bought") || t.includes("purchase")) return ShoppingBag;
  if (t.includes("saved") || t.includes("wish")) return Heart;
  if (t.includes("time") || t.includes("session")) return Clock3;
  return BookMarked;
}

function metricSublabel(card: DashboardMetric): string {
  if (card.change && card.change !== "—") {
    return `${card.change} ${card.up ? "up" : "down"}`;
  }
  if (card.isMinutes) return "Avg. time";
  if (card.isCurrency) return "Revenue";
  if (card.isPercent) return "Share";
  return "This period";
}

export default function DashboardOverview() {
  const { user } = useUser();
  const { toast } = useToast();
  const exportRootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [activityPeriod, setActivityPeriod] =
    useState<ActivityPeriod>("monthly");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");
  const [distMode, setDistMode] = useState<DistMode>("monthly");
  const [visibleSeries, setVisibleSeries] = useState<string[]>([]);
  const [selectedActivityBar, setSelectedActivityBar] = useState<string | null>(
    null,
  );
  const [hoverActivity, setHoverActivity] = useState<{
    bar: string;
    series: string;
    value: number;
  } | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [hoverTime, setHoverTime] = useState<TimePoint | null>(null);
  const [activeDonut, setActiveDonut] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [metricTick, setMetricTick] = useState(0);
  const [showAllRows, setShowAllRows] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError("");
    getDashboardOverview({ role: user?.role, userId: user?.id })
      .then((overview) => {
        setData(overview);
        setVisibleSeries(overview.activityChart.legend);
        setSelectedActivityBar(null);
        setSelectedTime(null);
        setAnimateIn(false);
        requestAnimationFrame(() => setAnimateIn(true));
      })
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when auth principal changes
  }, [user?.id, user?.role]);

  useEffect(() => {
    setAnimateIn(false);
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [activityPeriod, timePeriod, distMode, visibleSeries.join("|")]);

  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => setMetricTick((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, [data]);

  const activityBars: ActivityBar[] = useMemo(() => {
    if (!data) return [];
    return data.activityChart.periods[activityPeriod];
  }, [data, activityPeriod]);

  const activityTotal = useMemo(() => {
    return activityBars.reduce((sum, bar) => {
      const visible = visibleSeries.reduce(
        (s, key) => s + (bar.segments[key] ?? 0),
        0,
      );
      return sum + visible;
    }, 0);
  }, [activityBars, visibleSeries]);

  const maxActivity = useMemo(() => {
    return Math.max(
      ...activityBars.map((bar) =>
        visibleSeries.reduce((s, key) => s + (bar.segments[key] ?? 0), 0),
      ),
      1,
    );
  }, [activityBars, visibleSeries]);

  const timePoints = useMemo(() => {
    if (!data) return [];
    return data.timeChart.periods[timePeriod];
  }, [data, timePeriod]);

  const maxTime = useMemo(
    () => Math.max(...timePoints.map((p) => p.value), 1),
    [timePoints],
  );

  const timeSum = useMemo(
    () => timePoints.reduce((s, p) => s + p.value, 0),
    [timePoints],
  );

  const distribution = useMemo(() => {
    if (!data) return { total: 0, slices: [] as DistributionSlice[] };
    return data.distribution.modes[distMode];
  }, [data, distMode]);

  const tableRows = useMemo(() => {
    if (!data) return [];
    return showAllRows
      ? data.topTable.rows
      : data.topTable.rows.slice(0, 3);
  }, [data, showAllRows]);

  const toggleSeries = (name: string) => {
    setVisibleSeries((prev) => {
      if (prev.includes(name)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== name);
      }
      return [...prev, name];
    });
  };

  const handleExportImage = async () => {
    const node = exportRootRef.current;
    if (!node || isExporting) return;

    setIsExporting(true);
    // Clear ephemeral UI that shouldn't appear in the snapshot
    setHoverActivity(null);
    setHoverTime(null);
    setActiveDonut(null);

    try {
      // Let paint clear hover tooltips before capture
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r(null))),
      );

      const width = node.scrollWidth;
      const height = node.scrollHeight;
      const pixelRatio = Math.min(2, window.devicePixelRatio || 2);

      const captureOptions = {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#f8fafc",
        width,
        height,
        style: {
          // Stabilize layout during serialization
          transform: "none",
          width: `${width}px`,
          height: `${height}px`,
        },
        filter: (el: HTMLElement) => {
          if (el.hasAttribute?.("data-export-ignore")) return false;
          return true;
        },
        skipFonts: true,
      };

      // html-to-image handles modern CSS (oklch) better than html2canvas
      let dataUrl = "";
      try {
        dataUrl = await toPng(node, captureOptions);
      } catch (firstErr) {
        console.warn("Export attempt 1 failed, retrying…", firstErr);
        // Retry without size override (some browsers choke on explicit dims)
        dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: "#ffffff",
          skipFonts: true,
          filter: captureOptions.filter,
        });
      }

      if (!dataUrl || dataUrl.length < 32) {
        throw new Error("Empty export image");
      }

      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `thrift-dashboard-${stamp}.png`;

      // Download PNG only
      const a = document.createElement("a");
      a.download = filename;
      a.href = dataUrl;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast({
        message: "Dashboard image saved.",
        variant: "success",
      });
    } catch (err) {
      console.error("Dashboard export failed:", err);
      toast({
        message: "Could not export the dashboard image. Try again.",
        variant: "default",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 flex items-center justify-between gap-3">
        <span>{error || "No dashboard data."}</span>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1 text-ink-700 hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const isAdmin = data.scope === "admin";
  const activityFormat = data.activityChart.valueFormat;
  const distFormat = data.distribution.valueFormat;

  return (
    <div ref={exportRootRef} className="w-full space-y-5 rounded-xl bg-ink-50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Dashboard</h1>
          <p className="text-sm text-ink-600/70 mt-1">
            Welcome back{user?.name ? `, ${user.name}` : ""}
            {isAdmin
              ? " · platform overview"
              : " · your thrift activity"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-ink-100 bg-white text-sm text-ink-700 shadow-sm">
            <CalendarDays className="h-4 w-4 text-ink-400" />
            {data.dateRange}
          </span>

          <Segmented
            value={activityPeriod}
            options={[
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "quarterly", label: "Quarterly" },
            ]}
            onChange={(v) => setActivityPeriod(v as ActivityPeriod)}
          />

          <button
            type="button"
            data-export-ignore
            onClick={load}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-ink-100 bg-white text-sm text-ink-700 shadow-sm hover:bg-ink-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            data-export-ignore
            onClick={handleExportImage}
            disabled={isExporting}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-ink-600 text-sm text-white shadow-sm hover:bg-ink-700 disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>

      {/* KPI metrics */}
      {isAdmin ? (
        <div className="rounded-xl border border-ink-100 bg-white shadow-sm overflow-hidden">
          <div
            className={`grid grid-cols-1 divide-y divide-ink-100 sm:divide-y-0 sm:divide-x ${
              data.metrics.length >= 4
                ? "sm:grid-cols-2 xl:grid-cols-4"
                : "sm:grid-cols-3"
            }`}
          >
            {data.metrics.map((card, idx) => {
              const scale =
                card.numericValue < 20
                  ? 0.02
                  : card.numericValue < 100
                    ? 0.15
                    : 1.2;
              const jitter =
                ((metricTick + idx) % 3) * (card.up ? scale : -scale * 0.6);
              const display = formatMetricDisplay(card, jitter);
              const color =
                SPARKLINE_COLORS[idx % SPARKLINE_COLORS.length];
              const points = sparkPoints(
                card.numericValue + idx * 17,
                card.up,
              );
              const changeLabel =
                card.change && card.change !== "—"
                  ? card.change
                  : card.up
                    ? "0%"
                    : "0%";

              return (
                <div
                  key={card.title}
                  className="flex items-center justify-between gap-4 px-5 py-5 bg-white"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-800">
                      {card.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                        {display}
                      </p>
                      {card.change !== "—" && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            card.up
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          {card.up ? "↑" : "↓"} {changeLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-400">
                      compared to last week
                    </p>
                  </div>
                  <Sparkline
                    values={points}
                    color={color}
                    id={`spark-${idx}-${card.title.replace(/\s+/g, "-")}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 ${
            data.metrics.length >= 4
              ? "sm:grid-cols-2 xl:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {data.metrics.map((card, idx) => {
            const scale =
              card.numericValue < 20
                ? 0.02
                : card.numericValue < 100
                  ? 0.15
                  : 1.2;
            const jitter =
              ((metricTick + idx) % 3) * (card.up ? scale : -scale * 0.6);
            const display = formatMetricDisplay(card, jitter);
            const Icon = metricIcon(card.title);
            const tone =
              USER_METRIC_ACCENTS[idx % USER_METRIC_ACCENTS.length];
            const sparkColor =
              SPARKLINE_COLORS[idx % SPARKLINE_COLORS.length];
            const points = sparkPoints(
              card.numericValue + idx * 17,
              card.up,
            );

            return (
              <div
                key={card.title}
                className="relative overflow-hidden rounded-xl border border-ink-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: sparkColor }}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-3 pl-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-800">
                      {card.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                        {display}
                      </p>
                      {card.change && card.change !== "—" && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            card.up
                              ? "bg-ink-50 text-ink-700"
                              : "bg-ink-100 text-ink-600"
                          }`}
                        >
                          {card.up ? "↑" : "↓"} {card.change}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-400">
                      {metricSublabel(card)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone.iconBg}`}
                    >
                      <Icon
                        className={`h-4 w-4 ${tone.iconText}`}
                        strokeWidth={1.75}
                      />
                    </span>
                    <Sparkline
                      values={points}
                      color={sparkColor}
                      id={`user-spark-${idx}-${card.title.replace(/\s+/g, "-")}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Activity: sold / bought / saved */}
        <div className="xl:col-span-3 rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <p className="text-sm text-ink-600/80 mb-1">
                {data.activityChart.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-semibold text-ink-950 tabular-nums">
                  {formatValue(activityTotal, activityFormat)}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    data.activityChart.up
                      ? "bg-ink-50 text-ink-700"
                      : "bg-rose-50 text-rose-500"
                  }`}
                >
                  {data.activityChart.change}{" "}
                  {data.activityChart.up ? "↑" : "↓"}
                </span>
                {selectedActivityBar && (
                  <span className="text-xs text-ink-500">
                    Selected: {selectedActivityBar}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-ink-400 self-end">
              Click legend to toggle · click bars to focus
            </p>
          </div>

          <div className="relative h-64 flex items-end justify-around gap-3 px-1 pb-1">
            {hoverActivity && (
              <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-10 rounded-lg border border-ink-100 bg-white px-3 py-2 shadow-lg text-xs text-ink-900">
                <p className="font-semibold">{hoverActivity.bar}</p>
                <p>
                  {hoverActivity.series}:{" "}
                  {formatValue(hoverActivity.value, activityFormat)}
                </p>
              </div>
            )}

            {activityBars.map((bar) => {
              const barTotal = visibleSeries.reduce(
                (s, key) => s + (bar.segments[key] ?? 0),
                0,
              );
              const heightPct = (barTotal / maxActivity) * 100;
              const dimmed =
                selectedActivityBar !== null &&
                selectedActivityBar !== bar.label;

              return (
                <button
                  type="button"
                  key={bar.label}
                  onClick={() =>
                    setSelectedActivityBar((prev) =>
                      prev === bar.label ? null : bar.label,
                    )
                  }
                  className={`group flex flex-col items-center gap-2 flex-1 max-w-[100px] h-full justify-end transition-opacity ${
                    dimmed ? "opacity-35" : "opacity-100"
                  }`}
                >
                  <span className="text-[11px] font-medium text-ink-500 tabular-nums min-h-[1rem]">
                    {formatValue(barTotal, activityFormat)}
                  </span>
                  <div
                    className="w-full max-w-[64px] rounded-md overflow-hidden flex flex-col-reverse shadow-sm ring-0 group-hover:ring-2 group-hover:ring-ink-200 transition-all"
                    style={{
                      height: animateIn ? `${Math.max(heightPct, 4)}%` : "0%",
                      transition: "height 700ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {visibleSeries.map((series) => {
                      const value = bar.segments[series] ?? 0;
                      const pct = barTotal > 0 ? (value / barTotal) * 100 : 0;
                      const colorIdx =
                        data.activityChart.legend.indexOf(series);
                      return (
                        <div
                          key={series}
                          className="w-full transition-all hover:brightness-110"
                          style={{
                            height: `${pct}%`,
                            backgroundColor:
                              SERIES_COLORS[colorIdx % SERIES_COLORS.length],
                            minHeight: value > 0 ? 4 : 0,
                          }}
                          onMouseEnter={() =>
                            setHoverActivity({
                              bar: bar.label,
                              series,
                              value,
                            })
                          }
                          onMouseLeave={() => setHoverActivity(null)}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm font-medium text-ink-800">
                    {bar.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {data.activityChart.legend.map((label, i) => {
              const active = visibleSeries.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleSeries(label)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${
                    active
                      ? "border-ink-200 bg-ink-50 text-ink-800"
                      : "border-ink-50 bg-white text-ink-300 line-through"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{
                      backgroundColor: active
                        ? SERIES_COLORS[i % SERIES_COLORS.length]
                        : "#cbd5e1",
                    }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time on site */}
        <div className="xl:col-span-2 rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <p className="text-sm text-ink-600/80 mb-1">
                {data.timeChart.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-semibold text-ink-950 tabular-nums">
                  {formatValue(
                    selectedTime
                      ? (timePoints.find((p) => p.label === selectedTime)
                          ?.value ?? timeSum)
                      : timePeriod === "weekly"
                        ? timeSum / Math.max(timePoints.length, 1)
                        : timeSum / Math.max(timePoints.length, 1),
                    "minutes",
                  )}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    data.timeChart.up
                      ? "bg-ink-50 text-ink-700"
                      : "bg-rose-50 text-rose-500"
                  }`}
                >
                  {data.timeChart.change} {data.timeChart.up ? "↑" : "↓"}
                </span>
              </div>
              {!selectedTime && (
                <p className="text-[11px] text-ink-400 mt-0.5">
                  Avg per period
                </p>
              )}
            </div>
            <Segmented
              value={timePeriod}
              options={[
                { id: "weekly", label: "Weekly" },
                { id: "monthly", label: "Monthly" },
              ]}
              onChange={(v) => {
                setTimePeriod(v as TimePeriod);
                setSelectedTime(null);
              }}
            />
          </div>

          <div className="relative h-52 flex items-end justify-between gap-1.5">
            {hoverTime && (
              <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 z-10 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 shadow-lg text-xs text-ink-900">
                {hoverTime.label}: {formatValue(hoverTime.value, "minutes")}
              </div>
            )}
            {timePoints.map((item) => {
              const h = (item.value / maxTime) * 100;
              const selected = selectedTime === item.label;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() =>
                    setSelectedTime((prev) =>
                      prev === item.label ? null : item.label,
                    )
                  }
                  onMouseEnter={() => setHoverTime(item)}
                  onMouseLeave={() => setHoverTime(null)}
                  className="relative flex flex-1 flex-col items-center justify-end gap-2 h-full"
                >
                  <div
                    className={`w-full max-w-[40px] rounded-md transition-all duration-500 hover:brightness-110 ${
                      selected || hoverTime?.label === item.label
                        ? "bg-ink-600 shadow-md shadow-ink-200"
                        : "bg-ink-200"
                    }`}
                    style={{
                      height: animateIn ? `${Math.max(h, 6)}%` : "0%",
                    }}
                  />
                  <span
                    className={`text-[11px] ${
                      selected ? "text-ink-700 font-semibold" : "text-ink-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Distribution donut */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <p className="font-semibold text-ink-950">
              {data.distribution.title}
            </p>
            <Segmented
              value={distMode}
              options={[
                { id: "weekly", label: "Weekly" },
                { id: "monthly", label: "Monthly" },
              ]}
              onChange={(v) => setDistMode(v as DistMode)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {distribution.slices.map((item) => (
              <button
                type="button"
                key={item.label}
                onClick={() =>
                  setActiveDonut((prev) =>
                    prev === item.label ? null : item.label,
                  )
                }
                className={`text-left rounded-lg p-2 transition-colors ${
                  activeDonut === item.label
                    ? "bg-ink-50 ring-1 ring-ink-200"
                    : "hover:bg-ink-50/50"
                }`}
              >
                <p className="text-xs text-ink-500 mb-1">{item.label}</p>
                <p className="text-lg font-semibold text-ink-950 tabular-nums">
                  {formatValue(item.value, distFormat)}
                </p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <InteractiveDonut
              slices={distribution.slices}
              total={distribution.total}
              valueFormat={distFormat}
              active={activeDonut}
              onActiveChange={setActiveDonut}
              animate={animateIn}
            />
          </div>
        </div>

        {/* Top table */}
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-ink-950">{data.topTable.title}</p>
            {data.topTable.rows.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllRows((v) => !v)}
                className="text-sm text-ink-600 hover:underline"
              >
                {showAllRows ? "Show less" : "See All"}
              </button>
            )}
          </div>

          {tableRows.length === 0 ? (
            <p className="text-sm text-ink-500 py-10 text-center">
              No activity yet for this view.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-400 border-b border-ink-50">
                    <th className="pb-3 font-medium">
                      {isAdmin ? "Seller" : "Book"}
                    </th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Share</th>
                    <th className="pb-3 font-medium text-right">
                      {data.topTable.valueLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-ink-50/80 last:border-0 transition-colors hover:bg-ink-50/40"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: row.color }}
                          >
                            {row.name.slice(0, 1)}
                          </span>
                          <span className="font-medium text-ink-950">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-ink-600/80">{row.type}</td>
                      <td className="py-3.5 min-w-[110px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-full rounded-full bg-ink-50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-ink-600 transition-all duration-700"
                              style={{
                                width: animateIn ? `${row.rate}%` : "0%",
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-ink-500 w-8">
                            {row.rate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-medium text-ink-950 tabular-nums">
                        {formatValue(
                          row.value,
                          data.topTable.valueFormat,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-ink-100 bg-white p-0.5 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`h-8 px-2.5 rounded-md text-xs font-medium transition-all ${
            value === opt.id
              ? "bg-ink-600 text-white shadow-sm"
              : "text-ink-600 hover:bg-ink-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function InteractiveDonut({
  slices,
  total,
  valueFormat,
  active,
  onActiveChange,
  animate,
}: {
  slices: DistributionSlice[];
  total: number;
  valueFormat: ValueFormat;
  active: string | null;
  onActiveChange: (label: string | null) => void;
  animate: boolean;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const activeSlice = slices.find((c) => c.label === active);
  const centerValue = activeSlice
    ? formatValue(activeSlice.value, valueFormat)
    : formatValue(total, valueFormat);
  const centerLabel = activeSlice ? activeSlice.label : "Total";

  return (
    <div className="relative h-52 w-52">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e4e9f0"
          strokeWidth="16"
        />
        {slices.map((slice) => {
          const fraction = total > 0 ? slice.value / total : 0;
          const length = fraction * circumference;
          const dashOffset = -offset;
          offset += length;
          const isActive = active === slice.label;
          const isDimmed = active !== null && !isActive;

          return (
            <circle
              key={slice.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={isActive ? 20 : 16}
              strokeDasharray={`${animate ? length : 0} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              className="cursor-pointer transition-all duration-500"
              style={{ opacity: isDimmed ? 0.35 : 1 }}
              onMouseEnter={() => onActiveChange(slice.label)}
              onMouseLeave={() => onActiveChange(null)}
              onClick={() =>
                onActiveChange(isActive ? null : slice.label)
              }
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-xs text-ink-400">{centerLabel}</p>
        <p className="text-lg font-semibold text-ink-950 tabular-nums">
          {centerValue}
        </p>
      </div>
    </div>
  );
}
