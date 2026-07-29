import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import { ApiError, paymentApi, type CustomerPaymentDto } from "@/lib/api";
import { PAYMENT_STATUS, PAYMENT_STATUS_LABELS } from "@/lib/status-constants";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import CustomSelect from "@/components/ui/CustomSelect";
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

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: String(PAYMENT_STATUS.PENDING), label: "Pending" },
  { value: String(PAYMENT_STATUS.PAID), label: "Paid" },
  { value: String(PAYMENT_STATUS.FAILED), label: "Failed" },
  { value: String(PAYMENT_STATUS.CANCELLED), label: "Cancelled" },
  { value: String(PAYMENT_STATUS.EXPIRED), label: "Expired" },
];

const PROVIDER_OPTIONS = [
  { value: "", label: "All providers" },
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
];

function statusClass(status: CustomerPaymentDto["payment_status"]) {
  if (status === PAYMENT_STATUS.PAID) return "bg-green-50 text-green-700";
  if (status === PAYMENT_STATUS.FAILED || status === PAYMENT_STATUS.CANCELLED) return "bg-red-50 text-red-700";
  if (status === PAYMENT_STATUS.EXPIRED) return "bg-zinc-100 text-zinc-600";
  return "bg-yellow-50 text-yellow-700";
}

export function PaymentsModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [rows, setRows] = useState<CustomerPaymentDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [provider, setProvider] = useState("");
  const [appliedProvider, setAppliedProvider] = useState("");
  const [status, setStatus] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const [appliedDateFilter, setAppliedDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const lastFetchKeyRef = useRef("");

  const loadPayments = useCallback(
    async (page: number) => {
      if (!accessToken) return;

      snackbar.setPageLoading(true);
      try {
        const response = await paymentApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          search: appliedSearch.trim() || undefined,
          provider: appliedProvider ? (appliedProvider as "razorpay" | "stripe") : undefined,
          payment_status: appliedStatus
            ? Number(appliedStatus)
            : undefined,
          date_from: appliedDateFilter.start || undefined,
          date_to: appliedDateFilter.end || undefined,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setRows(records);
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
      } catch (err) {
        snackbar.error(
          err instanceof ApiError ? err.message : "Unable to load payments."
        );
      } finally {
        snackbar.setPageLoading(false);
      }
    },
    [
      accessToken,
      appliedDateFilter,
      appliedProvider,
      appliedSearch,
      appliedStatus,
      snackbar,
      tenant.id,
    ]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "payments",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      currentPage,
      appliedSearch,
      provider: appliedProvider,
      status: appliedStatus,
      date: appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadPayments(currentPage);
  }, [
    accessToken,
    appliedDateFilter,
    appliedProvider,
    appliedSearch,
    appliedStatus,
    currentPage,
    loadPayments,
    tenant.id,
  ]);

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedProvider(provider);
    setAppliedStatus(status);
    setAppliedDateFilter(toAdminDateRange(dateFilter));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setProvider("");
    setAppliedProvider("");
    setStatus("");
    setAppliedStatus("");
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
            <div className="relative h-10 w-full sm:w-72">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search customer, mobile, payment id"
                className="h-full w-full rounded-md border border-mist bg-white pl-3 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-gold"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/35 transition hover:bg-parchment hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <CustomSelect
              instanceId="payment-provider-filter"
              options={PROVIDER_OPTIONS}
              value={PROVIDER_OPTIONS.find((option) => option.value === provider) || null}
              variant="light"
              onChange={(option) => {
                setProvider(option?.value || "");
              }}
              className="w-full sm:w-44"
            />

            <CustomSelect
              instanceId="payment-status-filter"
              options={STATUS_OPTIONS}
              value={STATUS_OPTIONS.find((option) => option.value === status) || null}
              variant="light"
              onChange={(option) => {
                setStatus(option?.value || "");
              }}
              className="w-full sm:w-44"
            />

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
        {(search || appliedSearch || provider || appliedProvider || status || appliedStatus) && (
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
          title="Payment Listing"
          totalRecords={totalRecords}
          onList={() => loadPayments(currentPage)}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created Date</th>
                <th className="w-48 px-4 py-2.5 font-semibold">Customer</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Mobile</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Amount</th>
                <th className="w-28 px-4 py-2.5 font-semibold">Provider</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Payment ID</th>
                <th className="w-28 px-4 py-2.5 text-right font-semibold">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-5">
                    <EmptyListState message="No payment entries found." />
                  </td>
                </tr>
              ) : (
                rows.map((payment) => (
                  <tr key={payment.id} className="text-sm transition hover:bg-parchment/55">
                    <td data-label="ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{payment.id.toString().padStart(4, "0")}
                    </td>
                    <td data-label="Created Date" className="px-4 py-2.5 text-ink/60">
                      {formatAdminDate(payment.created_at)}
                    </td>
                    <td data-label="Customer" className="px-4 py-2.5">
                      <p className="font-medium text-ink">{payment.customer_name}</p>
                      {payment.enq_id && (
                        <p className="text-xs text-ink/45">Enq #{payment.enq_id}</p>
                      )}
                    </td>
                    <td data-label="Mobile" className="px-4 py-2.5 text-ink/65">
                      {payment.customer_mobile}
                    </td>
                    <td data-label="Amount" className="px-4 py-2.5 font-medium text-ink">
                      {payment.currency} {payment.amount}
                    </td>
                    <td data-label="Provider" className="px-4 py-2.5 capitalize text-ink/70">
                      {payment.provider}
                    </td>
                    <td data-label="Status" className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(payment.payment_status)}`}>
                        {PAYMENT_STATUS_LABELS[payment.payment_status] || payment.payment_status}
                      </span>
                    </td>
                    <td data-label="Payment ID" className="px-4 py-2.5 font-mono text-xs text-ink/55">
                      {payment.provider_payment_id || "-"}
                    </td>
                    <td data-label="Link" className="px-4 py-2.5 text-right">
                      {payment.payment_link ? (
                        <a
                          href={payment.payment_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-mist px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                        >
                          <ExternalLink size={14} />
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
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
