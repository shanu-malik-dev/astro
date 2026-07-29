import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import CustomDatePicker, { type DateRangeValue } from "@/components/ui/CustomDatePicker";
import { ApiError, followUpApi, type FollowUpDto } from "@/lib/api";
import { FOLLOW_UP_STATUS, FOLLOW_UP_STATUS_LABELS } from "@/lib/status-constants";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import { EmptyListState, formatAdminDate, ListPanelHeader, Pagination } from "../shared";
import type { AdminDateFilter, FollowUpRow, FollowUpStatus } from "../types";

type MainDateTab = "today" | "all";
type FollowUpTabData = Record<
  FollowUpStatus,
  {
    rows: FollowUpRow[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
  }
>;

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
    created_at: followUp.created_at,
    enq_id: Number(followUp.enq_id),
    customer_name: followUp.customer_name,
    customer_number:
      followUp.customer_mobile || `${followUp.country_code} ${followUp.mobile}`,
    problem_name: followUp.problem_name,
    remark: followUp.remark,
    status: followUp.status,
    follow_up_at: followUp.follow_up_at,
  };
}

function formatFollowDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function FollowUpModule({
  initialDateFilter,
  filterToken,
}: {
  initialDateFilter?: AdminDateFilter | null;
  filterToken?: number;
} = {}) {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [mainTab, setMainTab] = useState<MainDateTab>("today");
  const [activeStatus, setActiveStatus] = useState<FollowUpStatus>(FOLLOW_UP_STATUS.HOT);
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
    [FOLLOW_UP_STATUS.HOT]: 0,
    [FOLLOW_UP_STATUS.WARM]: 0,
    [FOLLOW_UP_STATUS.COLD]: 0,
  });
  const [tabData, setTabData] = useState<FollowUpTabData>({
    [FOLLOW_UP_STATUS.HOT]: { rows: [], totalRecords: 0, totalPages: 1, currentPage: 1 },
    [FOLLOW_UP_STATUS.WARM]: { rows: [], totalRecords: 0, totalPages: 1, currentPage: 1 },
    [FOLLOW_UP_STATUS.COLD]: { rows: [], totalRecords: 0, totalPages: 1, currentPage: 1 },
  });
  const lastFetchKeyRef = useRef("");
  const activeStatusRef = useRef(activeStatus);

  useEffect(() => {
    activeStatusRef.current = activeStatus;
  }, [activeStatus]);

  useEffect(() => {
    if (!filterToken || !initialDateFilter) return;

    setMainTab(initialDateFilter.preset === "today" ? "today" : "all");
    setDateFilter({
      start: initialDateFilter.start,
      end: initialDateFilter.end,
    });
    setAppliedDateFilter({
      start: initialDateFilter.start,
      end: initialDateFilter.end,
    });
    setCurrentPage(1);
  }, [filterToken, initialDateFilter]);

  const fetchFollowUps = useCallback(
    async (
      page: number,
      status: FollowUpStatus,
      search: string,
      range: DateRangeValue
    ) => {
      if (!accessToken) return null;

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

      return {
        status,
        rows: records.map(mapFollowUpDto),
        totalRecords: total,
        totalPages: pagination?.total_pages || 1,
        currentPage: pagination?.page || page,
      };
    },
    [accessToken, tenant.id]
  );

  const loadFollowUps = useCallback(
    async (page: number, search: string, range: DateRangeValue) => {
      if (!accessToken) return;

      snackbar.setPageLoading(true);
      try {
        const results = await Promise.all(
          ([FOLLOW_UP_STATUS.HOT, FOLLOW_UP_STATUS.WARM, FOLLOW_UP_STATUS.COLD] as FollowUpStatus[]).map((status) =>
            fetchFollowUps(page, status, search, range)
          )
        );
        const nextTabData = results.reduce<FollowUpTabData>(
          (current, result) => {
            if (!result) return current;
            current[result.status] = {
              rows: result.rows,
              totalRecords: result.totalRecords,
              totalPages: result.totalPages,
              currentPage: result.currentPage,
            };
            return current;
          },
          {
            [FOLLOW_UP_STATUS.HOT]: { rows: [], totalRecords: 0, totalPages: 1, currentPage: page },
            [FOLLOW_UP_STATUS.WARM]: { rows: [], totalRecords: 0, totalPages: 1, currentPage: page },
            [FOLLOW_UP_STATUS.COLD]: { rows: [], totalRecords: 0, totalPages: 1, currentPage: page },
          }
        );
        const activeData = nextTabData[activeStatusRef.current];

        setTabData(nextTabData);
        setRows(activeData.rows);
        setCurrentPage(activeData.currentPage);
        setTotalPages(activeData.totalPages);
        setTotalRecords(activeData.totalRecords);
        setStatusCounts({
          [FOLLOW_UP_STATUS.HOT]: nextTabData[FOLLOW_UP_STATUS.HOT].totalRecords,
          [FOLLOW_UP_STATUS.WARM]: nextTabData[FOLLOW_UP_STATUS.WARM].totalRecords,
          [FOLLOW_UP_STATUS.COLD]: nextTabData[FOLLOW_UP_STATUS.COLD].totalRecords,
        });
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
    [accessToken, fetchFollowUps, snackbar]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "followUps",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      currentPage,
      appliedCustomerFilter,
      appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadFollowUps(
      currentPage,
      appliedCustomerFilter,
      appliedDateFilter
    );
  }, [
    appliedCustomerFilter,
    appliedDateFilter,
    currentPage,
    loadFollowUps,
    tenant.id,
    accessToken,
  ]);

  useEffect(() => {
    const activeData = tabData[activeStatus];
    setRows(activeData.rows);
    setCurrentPage(activeData.currentPage);
    setTotalPages(activeData.totalPages);
    setTotalRecords(activeData.totalRecords);
  }, [activeStatus, tabData]);

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
      <div className="admin-filter-panel">
        <div className="w-full space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="admin-filter-segment">
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

            <div className="admin-filter-segment">
              {([FOLLOW_UP_STATUS.HOT, FOLLOW_UP_STATUS.WARM, FOLLOW_UP_STATUS.COLD] as FollowUpStatus[]).map((status) => (
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
                  {FOLLOW_UP_STATUS_LABELS[status]}
                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-gold-dark">
                    {statusCounts[status]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative h-10 w-full sm:w-72">
              <input
                type="search"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search customer name or number"
                className="h-full w-full rounded-md border border-mist bg-white pl-3 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-gold"
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
                className="w-full sm:w-44"
              />
            )}

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
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-mist bg-white text-ink/60 transition hover:border-gold hover:text-ink"
                title="Clear filters"
                aria-label="Clear filters"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={applyFilters}
              className="admin-create-button"
              title="Search"
              aria-label="Search"
            >
              <Search size={14} />
            </button>
          </div>
        </div>
      </div>

      <div data-admin-list className="mt-4 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <ListPanelHeader
          title="Follow Up Listing"
          totalRecords={totalRecords}
          onList={() =>
            loadFollowUps(currentPage, appliedCustomerFilter, appliedDateFilter)
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-28 px-4 py-2.5 font-semibold">Follow ID</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created Date</th>
                <th className="w-24 px-4 py-2.5 font-semibold">Enq ID</th>
                <th className="w-48 px-4 py-2.5 font-semibold">Customer</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Mobile</th>
                <th className="px-4 py-2.5 font-semibold">Problem</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Follow Date</th>
                <th className="px-4 py-2.5 font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-5">
                    <EmptyListState message="No follow-ups found." />
                  </td>
                </tr>
              ) : (
                rows.map((followUp) => (
                  <tr
                    key={followUp.followup_id}
                    className="text-sm transition hover:bg-parchment/55"
                  >
                    <td data-label="Follow ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{followUp.followup_id.toString().padStart(4, "0")}
                    </td>
                    <td data-label="Created Date" className="px-4 py-2.5 text-ink/60">
                      {formatAdminDate(followUp.created_at)}
                    </td>
                    <td data-label="Enq ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{followUp.enq_id.toString().padStart(4, "0")}
                    </td>
                    <td data-label="Customer" className="px-4 py-2.5 font-medium text-ink">
                      {followUp.customer_name}
                    </td>
                    <td data-label="Mobile" className="px-4 py-2.5 text-ink/65">
                      {followUp.customer_number}
                    </td>
                    <td data-label="Problem" className="px-4 py-2.5 text-ink/70">
                      {followUp.problem_name}
                    </td>
                    <td data-label="Follow Date" className="px-4 py-2.5 text-ink/60">
                      {formatFollowDate(followUp.follow_up_at)}
                    </td>
                    <td data-label="Remark" className="px-4 py-2.5 text-ink/65">
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
