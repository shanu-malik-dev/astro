import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Search, X } from "lucide-react";
import { ApiError, supportApi, type SupportRequestDto, type SupportRequestStatus } from "@/lib/api";
import { SUPPORT_STATUS, SUPPORT_STATUS_LABELS } from "@/lib/status-constants";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import {
  DateRangeFilter,
  EmptyListState,
  formatAdminDate,
  ListPanelHeader,
  Pagination,
  toAdminDateRange,
} from "../shared";
import type { DateRangeValue } from "@/components/ui/CustomDatePicker";

type RangeTab = "today" | "all";

export function SupportModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [rows, setRows] = useState<SupportRequestDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [range, setRange] = useState<RangeTab>("today");
  const [appliedRange, setAppliedRange] = useState<RangeTab>("today");
  const [status, setStatus] = useState<SupportRequestStatus>(SUPPORT_STATUS.OPEN);
  const [appliedStatus, setAppliedStatus] = useState<SupportRequestStatus>(SUPPORT_STATUS.OPEN);
  const [counts, setCounts] = useState<Record<number | "total", number>>({
    [SUPPORT_STATUS.OPEN]: 0,
    [SUPPORT_STATUS.CLOSED]: 0,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const [appliedDateFilter, setAppliedDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const lastFetchKeyRef = useRef("");

  const loadSupportRequests = useCallback(
    async (page: number) => {
      if (!accessToken) return;

      snackbar.setPageLoading(true);
      try {
        const response = await supportApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          range: appliedRange,
          status: appliedStatus,
          search: appliedSearch.trim() || undefined,
          date_from: appliedDateFilter.start || undefined,
          date_to: appliedDateFilter.end || undefined,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setRows(records);
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
        setCounts(response.data?.counts || {
          [SUPPORT_STATUS.OPEN]: 0,
          [SUPPORT_STATUS.CLOSED]: 0,
          total: 0,
        });
      } catch (err) {
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load support requests."
        );
      } finally {
        snackbar.setPageLoading(false);
      }
    },
    [
      accessToken,
      appliedDateFilter,
      appliedRange,
      appliedSearch,
      appliedStatus,
      snackbar,
      tenant.id,
    ]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "support",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      currentPage,
      range: appliedRange,
      status: appliedStatus,
      appliedSearch,
      date: appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadSupportRequests(currentPage);
  }, [
    accessToken,
    appliedDateFilter,
    appliedRange,
    appliedSearch,
    appliedStatus,
    currentPage,
    loadSupportRequests,
    tenant.id,
  ]);

  const updateStatus = async (request: SupportRequestDto, nextStatus: SupportRequestStatus) => {
    if (!accessToken) return;

    snackbar.setPageLoading(true);
    try {
      await supportApi.updateStatus(tenant.id, accessToken, {
        id: Number(request.id),
        status: nextStatus,
      });
      snackbar.success("Support request status updated.");
      await loadSupportRequests(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to update support request."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedRange(range);
    setAppliedStatus(status);
    setAppliedDateFilter(toAdminDateRange(dateFilter));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setRange("today");
    setAppliedRange("today");
    setStatus(SUPPORT_STATUS.OPEN);
    setAppliedStatus(SUPPORT_STATUS.OPEN);
    setDateFilter({ start: "", end: "" });
    setAppliedDateFilter({ start: "", end: "" });
    setCurrentPage(1);
  };

  const applyDateFilter = (range = dateFilter) => {
    setAppliedDateFilter(toAdminDateRange(range));
  };

  const clearDateFilter = () => {
    const emptyRange = { start: "", end: "" };
    setDateFilter(emptyRange);
    setAppliedDateFilter(emptyRange);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="admin-filter-panel">
        <div className="flex flex-wrap items-center gap-2">
            <div className="admin-filter-segment">
              {(["today", "all"] as RangeTab[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRange(item);
                  }}
                  className={
                    range === item
                      ? "rounded bg-white px-3 text-xs font-semibold capitalize text-ink shadow-sm"
                      : "rounded px-3 text-xs font-medium capitalize text-ink/55 transition hover:text-ink"
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="admin-filter-segment">
              {([SUPPORT_STATUS.OPEN, SUPPORT_STATUS.CLOSED] as SupportRequestStatus[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setStatus(item);
                  }}
                  className={
                    status === item
                      ? "inline-flex items-center gap-2 rounded bg-white px-3 text-xs font-semibold capitalize text-ink shadow-sm"
                      : "inline-flex items-center gap-2 rounded px-3 text-xs font-medium capitalize text-ink/55 transition hover:text-ink"
                  }
                >
                  <span>{SUPPORT_STATUS_LABELS[item]}</span>
                  <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-gold-dark">
                    {counts[item]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative h-10 w-full sm:w-72">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search name, email or subject"
                className="h-full w-full rounded-md border border-mist bg-white pl-3 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-gold"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/35 transition hover:bg-parchment hover:text-ink"
                  aria-label="Clear support search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

        </div>
        <div>
          <DateRangeFilter
            value={dateFilter}
            onChange={setDateFilter}
            onApply={applyDateFilter}
            onClear={clearDateFilter}
            hasValue={Boolean(appliedDateFilter.start || appliedDateFilter.end)}
          />
        </div>
        {(search || appliedSearch || range !== appliedRange || status !== appliedStatus) && (
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

      <div data-admin-list className="mt-4 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <ListPanelHeader
          title="Support Listing"
          totalRecords={totalRecords}
          onList={() => loadSupportRequests(currentPage)}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created Date</th>
                <th className="w-52 px-4 py-2.5 font-semibold">Name</th>
                <th className="w-64 px-4 py-2.5 font-semibold">Email</th>
                <th className="w-56 px-4 py-2.5 font-semibold">Subject</th>
                <th className="px-4 py-2.5 font-semibold">Message</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-32 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-5">
                    <EmptyListState message="No support requests found." />
                  </td>
                </tr>
              ) : (
                rows.map((request) => (
                  <tr key={request.id} className="text-sm transition hover:bg-parchment/55">
                    <td data-label="ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">#{request.id.toString().padStart(4, "0")}</td>
                    <td data-label="Created Date" className="px-4 py-2.5 text-ink/60">{formatAdminDate(request.created_at)}</td>
                    <td data-label="Name" className="px-4 py-2.5"><p className="font-medium text-ink">{request.full_name}</p></td>
                    <td data-label="Email" className="px-4 py-2.5 text-ink/65">{request.email}</td>
                    <td data-label="Subject" className="px-4 py-2.5 text-ink/70">{request.subject || "-"}</td>
                    <td data-label="Message" className="px-4 py-2.5 text-ink/60">{request.message}</td>
                    <td data-label="Status" className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${request.status === SUPPORT_STATUS.OPEN ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>
                        {SUPPORT_STATUS_LABELS[request.status] || request.status}
                      </span>
                    </td>
                    <td data-label="Actions" className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => updateStatus(request, request.status === SUPPORT_STATUS.OPEN ? SUPPORT_STATUS.CLOSED : SUPPORT_STATUS.OPEN)}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="Toggle support status"
                        >
                          {request.status === SUPPORT_STATUS.OPEN ? <CheckCircle2 size={15} /> : <RotateCcw size={15} />}
                        </button>
                      </div>
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
