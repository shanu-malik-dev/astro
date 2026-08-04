import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, HelpCircle, ListChecks, Loader2, Users } from "lucide-react";
import CustomDatePicker, { type DateRangeValue } from "@/components/ui/CustomDatePicker";
import {
  ApiError,
  dashboardApi,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import type { AdminDateFilter, DashboardFilterPreset, MasterModuleKey, ModuleKey } from "../types";

type DashboardModuleProps = {
  onNavigate: (
    module: ModuleKey,
    filter: AdminDateFilter,
    masterSubmodule?: MasterModuleKey
  ) => void;
};

type DashboardTotals = {
  enquiries: {
    open: number;
    closed: number;
    total: number;
  };
  customers: {
    called: number;
    notCalled: number;
    total: number;
  };
  followUps: {
    hot: number;
    warm: number;
    cold: number;
    total: number;
  };
};

function dayRange(): AdminDateFilter {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { preset: "today", start: start.toISOString(), end: end.toISOString() };
}

function monthToDateRange(): AdminDateFilter {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { preset: "mtd", start: start.toISOString(), end: end.toISOString() };
}

function customRange(range: DateRangeValue): AdminDateFilter {
  return {
    preset: "custom",
    start: range.start ? new Date(range.start).toISOString() : "",
    end: range.end ? new Date(range.end).toISOString() : "",
  };
}

function formatCardDate(filter: AdminDateFilter) {
  if (filter.preset === "today") return "Today";
  if (filter.preset === "mtd") return "MTD";
  if (!filter.start && !filter.end) return "Date range";
  return "Custom";
}

function formatDateLabel(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRangeLabel(filter: AdminDateFilter) {
  if (filter.preset === "today") return formatDateLabel(filter.start);
  if (filter.preset === "mtd") {
    return `${formatDateLabel(filter.start)} - ${formatDateLabel(filter.end)}`;
  }
  if (filter.start && filter.end) {
    return `${formatDateLabel(filter.start)} - ${formatDateLabel(filter.end)}`;
  }
  return "Select range";
}

export function DashboardModule({ onNavigate }: DashboardModuleProps) {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [preset, setPreset] = useState<DashboardFilterPreset>("today");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ start: "", end: "" });
  const [totals, setTotals] = useState<DashboardTotals>({
    enquiries: { open: 0, closed: 0, total: 0 },
    customers: { called: 0, notCalled: 0, total: 0 },
    followUps: { hot: 0, warm: 0, cold: 0, total: 0 },
  });
  const [loading, setLoading] = useState(false);
  const lastRequestKeyRef = useRef("");

  const appliedFilter = useMemo(() => {
    if (preset === "today") return dayRange();
    if (preset === "mtd") return monthToDateRange();
    return customRange(dateRange);
  }, [dateRange, preset]);

  const loadTotals = useCallback(async () => {
    if (!accessToken) return;
    const requestKey = JSON.stringify({
      tenantId: tenant.id,
      accessToken,
      start: appliedFilter.start || "",
      end: appliedFilter.end || "",
    });
    if (lastRequestKeyRef.current === requestKey) return;
    lastRequestKeyRef.current = requestKey;

    setLoading(true);
    try {
      const response = await dashboardApi.summary(tenant.id, accessToken, {
        date_from: appliedFilter.start || undefined,
        date_to: appliedFilter.end || undefined,
      });
      const summary = response.data;

      setTotals({
        enquiries: {
          open: summary?.enquiries.open || 0,
          closed: summary?.enquiries.closed || 0,
          total: summary?.enquiries.total || 0,
        },
        customers: {
          called: summary?.customers.called || 0,
          notCalled: summary?.customers.not_called || 0,
          total: summary?.customers.total || 0,
        },
        followUps: {
          hot: summary?.follow_ups.hot || 0,
          warm: summary?.follow_ups.warm || 0,
          cold: summary?.follow_ups.cold || 0,
          total: summary?.follow_ups.total || 0,
        },
      });
    } catch (error) {
      lastRequestKeyRef.current = "";
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, appliedFilter, snackbar, tenant.id]);

  useEffect(() => {
    loadTotals();
  }, [loadTotals]);

  const cards = [
    {
      key: "enquiries",
      title: "Total Enquiry",
      value: totals.enquiries.total,
      icon: HelpCircle,
      accent: "border-l-[#2f80ed] bg-[#f3f8ff] text-[#1f5fbf]",
      stats: [
        { label: "Open", value: totals.enquiries.open },
        { label: "Closed", value: totals.enquiries.closed },
      ],
      onClick: () => onNavigate("enquiry", appliedFilter),
    },
    {
      key: "customers",
      title: "New Customer",
      value: totals.customers.total,
      icon: Users,
      accent: "border-l-[#16a06a] bg-[#effaf5] text-[#08764b]",
      stats: [
        { label: "Called", value: totals.customers.called },
        { label: "Not Called", value: totals.customers.notCalled },
      ],
      onClick: () => onNavigate("customers", appliedFilter),
    },
    {
      key: "followUps",
      title: "New Follow Up",
      value: totals.followUps.total,
      icon: ListChecks,
      accent: "border-l-[#b7791f] bg-[#fff8e8] text-[#91600d]",
      stats: [
        { label: "Hot", value: totals.followUps.hot },
        { label: "Warm", value: totals.followUps.warm },
        { label: "Cold", value: totals.followUps.cold },
      ],
      onClick: () => onNavigate("followUp", appliedFilter),
    },
  ];

  return (
    <>
      <div className="mb-5 rounded-lg border border-mist bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
            Admin
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            {formatRangeLabel(appliedFilter)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-mist bg-white p-2">
          <div className="admin-filter-segment">
            {(["today", "mtd", "custom"] as DashboardFilterPreset[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPreset(item)}
                className={
                  preset === item
                    ? "rounded bg-white px-4 text-xs font-semibold uppercase text-ink shadow-sm"
                    : "rounded px-4 text-xs font-medium uppercase text-ink/55 transition hover:bg-white/55 hover:text-ink"
                }
              >
                {item === "mtd" ? "MTD" : item}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <CustomDatePicker
              dateRange
              showTime
              rangeValue={dateRange}
              onRangeChange={setDateRange}
              placeholder="Date range"
              variant="light"
              className="w-full sm:w-56"
            />
          )}
        </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.key}
              type="button"
              onClick={card.onClick}
              className={`group min-h-44 rounded-lg border border-l-4 border-mist bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-current/10">
                  <Icon size={20} />
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-mist bg-white text-ink/35 transition group-hover:border-gold group-hover:text-ink">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-ink/45">
                    {formatCardDate(appliedFilter)}
                  </p>
                  <h2 className="mt-2 text-sm font-semibold text-ink/70">
                    {card.title}
                  </h2>
                  <p className="mt-3 flex h-10 items-center text-4xl font-semibold text-ink">
                    {loading ? (
                      <Loader2 size={26} className="animate-spin text-ink/45" />
                    ) : (
                      card.value.toLocaleString("en-IN")
                    )}
                  </p>
                </div>
                <CalendarDays size={18} className="mb-2 text-ink/25" />
              </div>
              <div className="mt-5 grid gap-2 border-t border-mist/80 pt-4">
                {card.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-ink/55">{stat.label}</span>
                    <span className="font-semibold text-ink">
                      {stat.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </section>
    </>
  );
}
