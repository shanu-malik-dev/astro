import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Phone, Search, X } from "lucide-react";
import { ApiError, customerApi, type CustomerDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import { Pagination } from "../shared";

type MainTab = "today" | "all";

const CALL_STATUS_OPTIONS = [
  { value: "", label: "All call status" },
  { value: "called", label: "Called" },
  { value: "not_called", label: "Not called" },
];

function statusClass(status: CustomerDto["call_status"]) {
  return status === "called"
    ? "bg-green-50 text-green-700"
    : "bg-yellow-50 text-yellow-700";
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CustomersModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [rows, setRows] = useState<CustomerDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [mainTab, setMainTab] = useState<MainTab>("today");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const lastFetchKeyRef = useRef("");

  const loadCustomers = useCallback(
    async (page: number) => {
      if (!accessToken) return;

      snackbar.setPageLoading(true);
      try {
        const response = await customerApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          range: mainTab,
          search: appliedSearch.trim() || undefined,
          call_status: callStatus
            ? (callStatus as CustomerDto["call_status"])
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
          err instanceof ApiError ? err.message : "Unable to load customers."
        );
      } finally {
        snackbar.setPageLoading(false);
      }
    },
    [accessToken, appliedSearch, callStatus, mainTab, snackbar, tenant.id]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "customers",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      currentPage,
      mainTab,
      appliedSearch,
      callStatus,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadCustomers(currentPage);
  }, [
    accessToken,
    appliedSearch,
    callStatus,
    currentPage,
    loadCustomers,
    mainTab,
    tenant.id,
  ]);

  const tabItems = useMemo(
    () => [
      { value: "today" as const, label: "Today" },
      { value: "all" as const, label: "All" },
    ],
    []
  );

  const selectMainTab = (tab: MainTab) => {
    setMainTab(tab);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setAppliedSearch(search);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setCallStatus("");
    setCurrentPage(1);
  };

  const updateCallStatus = async (
    customer: CustomerDto,
    nextStatus: CustomerDto["call_status"]
  ) => {
    if (!accessToken) return;

    snackbar.setPageLoading(true);
    try {
      await customerApi.updateCallStatus(tenant.id, accessToken, {
        id: customer.id,
        call_status: nextStatus,
      });
      setRows((currentRows) =>
        currentRows.map((row) =>
          row.id === customer.id ? { ...row, call_status: nextStatus } : row
        )
      );
      snackbar.success("Customer call status updated.");
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to update call status."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-[0.35em] text-gold-dark">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            Customer Module
          </h1>
        </div>
        <div className="rounded-md border border-mist bg-white px-4 py-2 text-sm text-ink/60">
          {totalRecords} customers
        </div>
      </div>

      <div className="mt-5 overflow-visible rounded-lg border border-mist bg-white shadow-sm">
        <div className="border-b border-mist bg-white">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <div className="inline-flex h-10 rounded-md border border-mist bg-parchment p-1">
              {tabItems.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => selectMainTab(tab.value)}
                  className={
                    mainTab === tab.value
                      ? "rounded bg-white px-3 text-xs font-semibold text-ink shadow-sm"
                      : "rounded px-3 text-xs font-medium text-ink/55 transition hover:text-ink"
                  }
                >
                  {tab.label}
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
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
                placeholder="Search customer name or number"
                className="h-full w-full rounded-md border border-mist bg-white pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-gold"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/35 transition hover:bg-parchment hover:text-ink"
                  aria-label="Clear customer search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <CustomSelect
              instanceId="customer-call-status-filter"
              options={CALL_STATUS_OPTIONS}
              value={
                CALL_STATUS_OPTIONS.find((option) => option.value === callStatus) ||
                null
              }
              variant="light"
              onChange={(option) => {
                setCallStatus(option?.value || "");
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

            {(search || appliedSearch || callStatus) && (
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
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-56 px-4 py-2.5 font-semibold">Customer</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Mobile</th>
                <th className="w-36 px-4 py-2.5 font-semibold">Call Status</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created</th>
                <th className="w-56 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-sm text-ink/50">
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((customer) => (
                  <tr key={customer.id} className="text-sm transition hover:bg-parchment/55">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{customer.id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{customer.name}</p>
                    </td>
                    <td className="px-4 py-2.5 text-ink/65">
                      {customer.customer_mobile}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(customer.call_status)}`}>
                        {customer.call_status === "called" ? "Called" : "Not called"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ink/60">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`tel:${customer.country_code}${customer.mobile}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-mist bg-white px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                        >
                          <Phone size={14} />
                          Call
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            updateCallStatus(
                              customer,
                              customer.call_status === "called"
                                ? "not_called"
                                : "called"
                            )
                          }
                          className="rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                        >
                          {customer.call_status === "called"
                            ? "Mark Not Called"
                            : "Mark Called"}
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
