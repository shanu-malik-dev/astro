import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import { ApiError, paymentApi, type CustomerPaymentDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import { Pagination } from "../shared";

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const PROVIDER_OPTIONS = [
  { value: "", label: "All providers" },
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
];

function statusClass(status: CustomerPaymentDto["payment_status"]) {
  if (status === "paid") return "bg-green-50 text-green-700";
  if (status === "failed" || status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "expired") return "bg-zinc-100 text-zinc-600";
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
  const [status, setStatus] = useState("");
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
          provider: provider ? (provider as "razorpay" | "stripe") : undefined,
          payment_status: status
            ? (status as CustomerPaymentDto["payment_status"])
            : undefined,
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
    [accessToken, appliedSearch, provider, snackbar, status, tenant.id]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "payments",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      currentPage,
      appliedSearch,
      provider,
      status,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadPayments(currentPage);
  }, [
    accessToken,
    appliedSearch,
    currentPage,
    loadPayments,
    provider,
    status,
    tenant.id,
  ]);

  const applyFilters = () => {
    setAppliedSearch(search);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setProvider("");
    setStatus("");
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
            Payment Module
          </h1>
        </div>
        <div className="rounded-md border border-mist bg-white px-4 py-2 text-sm text-ink/60">
          {totalRecords} payment entries
        </div>
      </div>

      <div className="mt-5 overflow-visible rounded-lg border border-mist bg-white shadow-sm">
        <div className="border-b border-mist bg-white">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <div className="relative h-10 min-w-[240px] flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search customer, mobile, payment id"
                className="h-full w-full rounded-md border border-mist bg-white pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-gold"
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
                setCurrentPage(1);
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
                setCurrentPage(1);
              }}
              className="w-full sm:w-44"
            />

            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-3 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <Search size={14} />
              Search
            </button>

            {(search || appliedSearch || provider || status) && (
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
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">ID</th>
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
                  <td colSpan={8} className="px-4 py-5 text-sm text-ink/50">
                    No payment entries found.
                  </td>
                </tr>
              ) : (
                rows.map((payment) => (
                  <tr key={payment.id} className="text-sm transition hover:bg-parchment/55">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{payment.id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{payment.customer_name}</p>
                      {payment.enq_id && (
                        <p className="text-xs text-ink/45">Enq #{payment.enq_id}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink/65">
                      {payment.customer_mobile}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {payment.currency} {payment.amount}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-ink/70">
                      {payment.provider}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(payment.payment_status)}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink/55">
                      {payment.provider_payment_id || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
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
