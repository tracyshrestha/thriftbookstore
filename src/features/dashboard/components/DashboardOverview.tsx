import React from "react";
import {
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  Info,
  MoreHorizontal,
  SlidersHorizontal,
} from "lucide-react";

const COLORS = {
  indigo: "#4338ca",
  purple: "#7c3aed",
  blue: "#60a5fa",
  teal: "#14b8a6",
  grayBar: "#e5e7eb",
};

const metricCards = [
  {
    title: "Books Borrowed",
    value: "12,450",
    change: "15.8%",
    up: true,
  },
  {
    title: "Total Revenue",
    value: "$ 363.95",
    change: "34.6%",
    up: false,
  },
  {
    title: "Return Rate",
    value: "86.5%",
    change: "24.2%",
    up: true,
  },
];

const salesStack = [
  {
    month: "Oct",
    total: "$4,005.65",
    segments: [32, 20, 24, 14, 10],
  },
  {
    month: "Nov",
    total: "$2,225.54",
    segments: [38, 18, 20, 14, 10],
  },
  {
    month: "Dec",
    total: "$3,025.97",
    segments: [30, 22, 22, 16, 10],
  },
];

const stackColors = [
  COLORS.indigo,
  COLORS.purple,
  COLORS.blue,
  COLORS.teal,
  "#a5b4fc",
];

const legend = ["Fiction", "Non-fiction", "Kids", "Textbooks", "Other"];

const weeklyVisitors = [
  { day: "Sun", value: 42 },
  { day: "Mon", value: 68 },
  { day: "Tue", value: 100, highlight: true, label: "3,874" },
  { day: "Wed", value: 55 },
  { day: "Thu", value: 62 },
  { day: "Fri", value: 48 },
  { day: "Sat", value: 58 },
];

const distribution = [
  { label: "Website", value: "$ 2,110", color: COLORS.indigo },
  { label: "In-store", value: "$ 1,520", color: COLORS.teal },
  { label: "Other", value: "$ 980", color: COLORS.blue },
];

const integrations = [
  { name: "Stripe", type: "Finance", rate: 40, profit: "$650.00", color: "#635bff" },
  { name: "Zapier", type: "CRM", rate: 80, profit: "$720.50", color: "#ff4a00" },
  { name: "Shopify", type: "Marketplace", rate: 20, profit: "$432.25", color: "#96bf48" },
];

export default function DashboardOverview() {
  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 shadow-sm"
          >
            <CalendarDays className="h-4 w-4 text-gray-400" />
            Oct 18 - Nov 18
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 shadow-sm"
          >
            Monthly
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 shadow-sm"
          >
            <Filter className="h-4 w-4 text-gray-400" />
            Filter
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-gray-900 text-sm text-white shadow-sm hover:bg-gray-800"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{card.title}</p>
              <Info className="h-4 w-4 text-gray-300" />
            </div>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight text-gray-900">
                {card.value}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.up
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-500"
                }`}
              >
                {card.change} {card.up ? "↑" : "↓"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Sales Overview */}
        <div className="xl:col-span-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Sales Overview</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-gray-900">
                  $ 9,257.51
                </p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  15.8% ↑
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconBtn icon={<Filter className="h-3.5 w-3.5" />} />
              <IconBtn icon={<SlidersHorizontal className="h-3.5 w-3.5" />} />
              <IconBtn icon={<MoreHorizontal className="h-3.5 w-3.5" />} />
            </div>
          </div>

          <div className="flex items-end justify-around gap-6 h-56 px-2">
            {salesStack.map((col) => (
              <div key={col.month} className="flex flex-col items-center gap-3 flex-1 max-w-[120px]">
                <span className="text-xs font-medium text-gray-500">
                  {col.total}
                </span>
                <div className="w-full max-w-[72px] h-40 rounded-md overflow-hidden flex flex-col-reverse shadow-sm">
                  {col.segments.map((pct, i) => (
                    <div
                      key={i}
                      style={{
                        height: `${pct}%`,
                        backgroundColor: stackColors[i],
                      }}
                      className="w-full"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {col.month}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legend.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: stackColors[i] }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Total Subscribers */}
        <div className="xl:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Members</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-gray-900">24,473</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  15.8% ↑
                </span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-600"
            >
              Weekly
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
          </div>

          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyVisitors.map((item) => (
              <div
                key={item.day}
                className="relative flex flex-1 flex-col items-center justify-end gap-2 h-full"
              >
                {item.highlight && item.label && (
                  <span className="absolute top-0 text-[11px] font-medium text-gray-700 bg-white border border-gray-100 rounded px-1.5 py-0.5 shadow-sm">
                    {item.label}
                  </span>
                )}
                <div
                  className={`w-full max-w-[36px] rounded-md transition-all ${
                    item.highlight ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  style={{ height: `${item.value}%` }}
                />
                <span className="text-xs text-gray-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Sales Distribution */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <p className="font-semibold text-gray-900">Sales Distribution</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-600"
            >
              Monthly
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {distribution.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <DonutChart />
          </div>
        </div>

        {/* Integration list */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900">Top Channels</p>
            <button type="button" className="text-sm text-indigo-600 hover:underline">
              See All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium w-8">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="pb-3 font-medium">Channel</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Rate</th>
                  <th className="pb-3 font-medium text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((row) => (
                  <tr key={row.name} className="border-b border-gray-50 last:border-0">
                    <td className="py-3.5">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300"
                        readOnly
                      />
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: row.color }}
                        >
                          {row.name.slice(0, 1)}
                        </span>
                        <span className="font-medium text-gray-900">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-gray-500">{row.type}</td>
                    <td className="py-3.5 min-w-[100px]">
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${row.rate}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-medium text-gray-900">
                      {row.profit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
    >
      {icon}
    </button>
  );
}

function DonutChart() {
  // Static SVG donut: ~45% indigo, ~30% teal, ~25% blue
  return (
    <div className="relative h-48 w-48">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke={COLORS.indigo}
          strokeWidth="16"
          strokeDasharray="118 264"
          strokeLinecap="butt"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke={COLORS.teal}
          strokeWidth="16"
          strokeDasharray="79 264"
          strokeDashoffset="-118"
          strokeLinecap="butt"
        />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke={COLORS.blue}
          strokeWidth="16"
          strokeDasharray="67 264"
          strokeDashoffset="-197"
          strokeLinecap="butt"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs text-gray-400">Total</p>
        <p className="text-lg font-semibold text-gray-900">$4,610</p>
      </div>
    </div>
  );
}
