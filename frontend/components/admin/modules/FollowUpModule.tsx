import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import CustomDatePicker, { type DateRangeValue } from "@/components/ui/CustomDatePicker";
import { ApiError, followUpApi, type FollowUpDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import { Pagination } from "../shared";
import type { FollowUpRow, FollowUpStatus } from "../types";

const STATUS_LABELS: Record<FollowUpStatus, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

type MainDateTab = "today" | "all";

function getTodayRange(): DateRangeValue {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function toApiRange(range: DateRangeValue, mainTab: MainDateTab) {
  if (mainTab === "today") return getTodayRange();

  return {
    start: range.start ? new Date(range.start).toISOString() : "",
    end: range.end ? new Date(range.end).toISOString() : "",
  };
}

function mapFollowUpDto(followUp: FollowUpDto): FollowUpRow {
  return {
    followup_id: Number(followUp.id),
    enq_id: Number(followUp.enq_id),
    customer_name: followUp.customer_name,
    customer_number:
      followUp.customer_mobile || `${followUp.country_code} ${followUp.mobile}`,
    problem_name: followUp.problem_name,
    remark: followUp.remark,
    status: followUp.status,
  };
}

export function FollowUpModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [mainTab, setMainTab] = useState<MainDateTab>("today");
  const [activeStatus, setActiveStatus] = useState<FollowUpStatus>("hot");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customerFilter, setCustomerFilter] = useState("");
  const [appliedCustomerFilter, setAppliedCustomerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const [appliedDateFilter, setAppliedDateFilter] =
    useState<DateRangeValue>(getTodayRange);
  const [statusCounts, setStatusCounts] = useState<Record<FollowUpStatus, number>>({
    hot: 0,
    warm: 0,
    cold: 0,
  });

  const loadFollowUps = useCallback(
    async (
      page: number,
      status: FollowUpStatus,
      search: string,
      range: DateRangeValue
    ) => {
      if (!accessToken) return;

      snackbar.setPageLoading(true);
      try {
        const response = await followUpApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          status,
          search: search.trim() || undefined,
          date_from: range.start || undefined,
          date_to: range.end || undefined,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;
        const total = pagination?.total || records.length;

        setRows(records.map(mapFollowUpDto));
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(total);
        setStatusCounts((current) => ({ ...current, [status]: total }));
      } catch (err) {
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load follow ups."
        );
      } finally {
        snackbar.setPageLoading(false);
      }
    },
    [accessToken, snackbar, tenant.id]
  );

  useEffect(() => {
    loadFollowUps(
      currentPage,
      activeStatus,
      appliedCustomerFilter,
      appliedDateFilter
    );
  }, [
    activeStatus,
    appliedCustomerFilter,
    appliedDateFilter,
    currentPage,
    loadFollowUps,
  ]);

  const selectStatus = (status: FollowUpStatus) => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  const selectMainTab = (tab: MainDateTab) => {
    setMainTab(tab);
    setDateFilter({ start: "", end: "" });
    setAppliedDateFilter(tab === "today" ? getTodayRange() : { start: "", end: "" });
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setAppliedCustomerFilter(customerFilter);
    setAppliedDateFilter(toApiRange(dateFilter, mainTab));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const emptyRange = { start: "", end: "" };
    setCustomerFilter("");
    setDateFilter(emptyRange);
    setAppliedCustomerFilter("");
    setAppliedDateFilter(mainTab === "today" ? getTodayRange() : emptyRange);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-[0.35em] text-gold-dark">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            Follow Up Module
          </h1>
        </div>
        <div className="rounded-md border border-mist bg-white px-4 py-2 text-sm text-ink/60">
          {totalRecords} {activeStatus} follow-ups
        </div>
      </div>

      <div className="mt-5 overflow-visible rounded-lg border border-mist bg-white shadow-sm">
        <div className="space-y-3 border-b border-mist bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Follow Up Listing</h2>
            <p className="text-[11px] text-ink/50">
              Track follow-ups by Hot, Warm, and Cold status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-10 rounded-md border border-mist bg-parchment p-1">
              {(["today", "all"] as MainDateTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectMainTab(tab)}
                  className={
                    mainTab === tab
                      ? "rounded bg-white px-3 text-xs font-semibold capitalize text-ink shadow-sm"
                      : "rounded px-3 text-xs font-medium capitalize text-ink/55 transition hover:text-ink"
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="inline-flex h-10 rounded-md border border-mist bg-parchment p-1">
              {(["hot", "warm", "cold"] as FollowUpStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => selectStatus(status)}
                  className={
                    activeStatus === status
                      ? "inline-flex items-center gap-2 rounded bg-white px-3 text-xs font-semibold text-ink shadow-sm"
                      : "inline-flex items-center gap-2 rounded px-3 text-xs font-medium text-ink/55 transition hover:text-ink"
                  }
                >
                  {STATUS_LABELS[status]}
                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-gold-dark">
                    {statusCounts[status]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative h-10 min-w-[240px] flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
              />
              <input
                type="search"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search customer name or number"
                className="h-full w-full rounded-md border border-mist bg-white pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-gold"
              />
              {customerFilter && (
                <button
                  type="button"
                  onClick={() => setCustomerFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/35 transition hover:bg-parchment hover:text-ink"
                  aria-label="Clear customer filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {mainTab === "all" && (
              <CustomDatePicker
                dateRange
                showTime
                rangeValue={dateFilter}
                onRangeChange={setDateFilter}
                placeholder="Follow up date"
                variant="light"
                className="w-full sm:w-52"
              />
            )}

            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-3 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Search size={14} />
              Search
            </button>
            {(customerFilter ||
              appliedCustomerFilter ||
              (mainTab === "all" &&
                (dateFilter.start ||
                  dateFilter.end ||
                  appliedDateFilter.start ||
                  appliedDateFilter.end))) && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-md border border-mist bg-white px-3 text-xs font-medium text-ink/60 transition hover:border-gold hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-28 px-4 py-2.5 font-semibold">Follow ID</th>
                <th className="w-24 px-4 py-2.5 font-semibold">Enq ID</th>
                <th className="w-48 px-4 py-2.5 font-semibold">Customer</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Mobile</th>
                <th className="px-4 py-2.5 font-semibold">Problem</th>
                <th className="px-4 py-2.5 font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-sm text-ink/50">
                    No follow-ups found.
                  </td>
                </tr>
              ) : (
                rows.map((followUp) => (
                  <tr
                    key={followUp.followup_id}
                    className="text-sm transition hover:bg-parchment/55"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{followUp.followup_id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{followUp.enq_id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {followUp.customer_name}
                    </td>
                    <td className="px-4 py-2.5 text-ink/65">
                      {followUp.customer_number}
                    </td>
                    <td className="px-4 py-2.5 text-ink/70">
                      {followUp.problem_name}
                    </td>
                    <td className="px-4 py-2.5 text-ink/65">
                      {followUp.remark}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
