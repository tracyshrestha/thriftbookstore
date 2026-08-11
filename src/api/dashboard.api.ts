import { apiRequest } from "./client";
import { API_PATHS } from "./paths";
import { isAdminRole } from "@/constants";

export type ValueFormat = "count" | "currency" | "minutes";

export interface DashboardMetric {
  title: string;
  value: string;
  numericValue: number;
  change: string;
  up: boolean;
  isCurrency?: boolean;
  isPercent?: boolean;
  isMinutes?: boolean;
}

export interface ActivityBar {
  label: string;
  total: number;
  segments: Record<string, number>;
}

export interface TimePoint {
  label: string;
  value: number;
}

export interface DistributionSlice {
  label: string;
  value: number;
  color: string;
}

export interface TopRow {
  name: string;
  type: string;
  rate: number;
  value: number;
  color: string;
}

export interface DashboardOverview {
  scope: "admin" | "user";
  dateRange: string;
  metrics: DashboardMetric[];
  /** Sold vs bought (and saved) over time */
  activityChart: {
    title: string;
    change: string;
    up: boolean;
    valueFormat: ValueFormat;
    legend: string[];
    periods: {
      weekly: ActivityBar[];
      monthly: ActivityBar[];
      quarterly: ActivityBar[];
    };
  };
  /** Time spent / session engagement */
  timeChart: {
    title: string;
    change: string;
    up: boolean;
    valueFormat: "minutes";
    periods: {
      weekly: TimePoint[];
      monthly: TimePoint[];
    };
  };
  distribution: {
    title: string;
    valueFormat: ValueFormat;
    modes: {
      monthly: { total: number; slices: DistributionSlice[] };
      weekly: { total: number; slices: DistributionSlice[] };
    };
  };
  topTable: {
    title: string;
    valueLabel: string;
    valueFormat: ValueFormat;
    rows: TopRow[];
  };
}

interface DashboardPayload {
  admin: DashboardOverview;
  users: Record<string, DashboardOverview>;
  defaultUser: DashboardOverview;
}

/** GET /mock-api/dashboard/overview.json — scoped by role / user id */
export async function getDashboardOverview(params: {
  role?: string;
  userId?: string;
}): Promise<DashboardOverview> {
  const payload = await apiRequest<DashboardPayload>(API_PATHS.DASHBOARD_OVERVIEW);

  if (isAdminRole(params.role)) {
    return payload.admin;
  }

  if (params.userId && payload.users[params.userId]) {
    return payload.users[params.userId];
  }

  return payload.defaultUser;
}

// Back-compat aliases used nowhere after UI update, but keep short names for chart code
export type SalesBar = ActivityBar;
export type MembersPoint = TimePoint;
export type DistributionChannel = DistributionSlice;
export type TopChannel = TopRow;
