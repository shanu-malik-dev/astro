import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, CreditCard, ExternalLink, Phone, Save, Search, X } from "lucide-react";
import CustomDatePicker, { type DateRangeValue } from "@/components/ui/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  ApiError,
  enquiryApi,
  followUpApi,
  paymentApi,
  type CustomerPaymentDto,
  type EnquiryDto,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { FOLLOW_UP_STATUS_OPTIONS, PAGE_SIZE } from "../constants";
import { Pagination } from "../shared";
import type { EnquiryRow, EnquiryStatus, FollowUpStatus } from "../types";

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

function mapEnquiryDto(enquiry: EnquiryDto): EnquiryRow {
  return {
    enq_id: Number(enquiry.id),
    customer_name: enquiry.customer_name,
    customer_number:
      enquiry.customer_mobile || `${enquiry.country_code} ${enquiry.mobile}`,
    country_code: enquiry.country_code,
    mobile: enquiry.mobile,
    problem_name: enquiry.problem_name,
    status: enquiry.status,
    remark: enquiry.close_remark || undefined,
  };
}

export function EnquiryModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [mainTab, setMainTab] = useState<MainDateTab>("today");
  const [activeTab, setActiveTab] = useState<EnquiryStatus>("open");
  const [customerFilter, setCustomerFilter] = useState("");
  const [appliedCustomerFilter, setAppliedCustomerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const [appliedDateFilter, setAppliedDateFilter] =
    useState<DateRangeValue>(getTodayRange);
  const [counts, setCounts] = useState<Record<EnquiryStatus, number>>({
    open: 0,
    closed: 0,
  });
  const [followDraft, setFollowDraft] = useState<EnquiryRow | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowUpStatus>("warm");
  const [closeDraft, setCloseDraft] = useState<EnquiryRow | null>(null);
  const [closeRemarkError, setCloseRemarkError] = useState("");
  const [followError, setFollowError] = useState("");
  const [paymentDraft, setPaymentDraft] = useState<EnquiryRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [generatedPayment, setGeneratedPayment] =
    useState<CustomerPaymentDto | null>(null);
  const lastFetchKeyRef = useRef("");

  const loadEnquiries = useCallback(
    async (
      page: number,
      status: EnquiryStatus,
      search: string,
      range: DateRangeValue
    ) => {
      if (!accessToken) return;

      snackbar.setPageLoading(true);
      try {
        const response = await enquiryApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          status,
          search: search.trim() || undefined,
          date_from: range.start
            ? new Date(range.start).toISOString()
            : undefined,
          date_to: range.end ? new Date(range.end).toISOString() : undefined,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;
        const total = pagination?.total || records.length;

        setRows(records.map(mapEnquiryDto));
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(total);
        setCounts((current) => ({ ...current, [status]: total }));
      } catch (err) {
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load enquiries."
        );
      } finally {
        snackbar.setPageLoading(false);
      }
    },
    [accessToken, snackbar, tenant.id]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "enquiries",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      currentPage,
      activeTab,
      appliedCustomerFilter,
      appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadEnquiries(
      currentPage,
      activeTab,
      appliedCustomerFilter,
      appliedDateFilter
    );
  }, [
    activeTab,
    appliedCustomerFilter,
    appliedDateFilter,
    mainTab,
    currentPage,
    loadEnquiries,
    tenant.id,
    accessToken,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, mainTab]);

  const tabItems = useMemo(
    () => [
      { value: "open" as const, label: "Open", count: counts.open },
      { value: "closed" as const, label: "Closed", count: counts.closed },
    ],
    [counts.closed, counts.open]
  );

  const saveFollowUp = async () => {
    if (!followDraft || !accessToken) return;

    if (!followDraft.remark?.trim()) {
      setFollowError("Remark is required.");
      return;
    }

    snackbar.setPageLoading(true);
    try {
      await followUpApi.create(tenant.id, accessToken, {
        enq_id: followDraft.enq_id,
        remark: followDraft.remark.trim(),
        status: followStatus,
      });
      setFollowDraft(null);
      setFollowError("");
      setFollowStatus("warm");
      snackbar.success("Follow up created successfully.");
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to create follow up."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const closeEnquiry = async () => {
    if (!closeDraft || !accessToken) return;

    if (!closeDraft.remark?.trim()) {
      setCloseRemarkError("Close remark is required.");
      return;
    }

    snackbar.setPageLoading(true);
    try {
      await enquiryApi.close(tenant.id, accessToken, {
        id: closeDraft.enq_id,
        remark: closeDraft.remark.trim(),
      });
      snackbar.success("Enquiry closed successfully.");
      setCloseDraft(null);
      setCloseRemarkError("");
      await loadEnquiries(
        currentPage,
        activeTab,
        appliedCustomerFilter,
        appliedDateFilter
      );
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to close enquiry."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const openPaymentDraft = (enquiry: EnquiryRow) => {
    setPaymentDraft(enquiry);
    setPaymentAmount("");
    setPaymentError("");
    setGeneratedPayment(null);
  };

  const closePaymentDraft = () => {
    setPaymentDraft(null);
    setPaymentAmount("");
    setPaymentError("");
    setGeneratedPayment(null);
  };

  const generatePaymentLink = async () => {
    if (!paymentDraft || !accessToken) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Valid amount is required.");
      return;
    }

    snackbar.setPageLoading(true);
    try {
      const providerCurrency =
        paymentDraft.country_code.trim() === "+91" ? "INR" : "USD";
      const response = await paymentApi.generateLink(tenant.id, accessToken, {
        enq_id: paymentDraft.enq_id,
        amount,
        currency: providerCurrency,
      });
      const payment = response.data;
      setGeneratedPayment(payment || null);
      snackbar.success(
        payment?.provider === "razorpay"
          ? "Razorpay payment link generated."
          : "Stripe payment link generated."
      );
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to generate payment link."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const copyPaymentLink = async () => {
    if (!generatedPayment?.payment_link) return;
    await navigator.clipboard.writeText(generatedPayment.payment_link);
    snackbar.success("Payment link copied.");
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

  const selectMainTab = (tab: MainDateTab) => {
    setMainTab(tab);
    setDateFilter({ start: "", end: "" });
    setAppliedDateFilter(tab === "today" ? getTodayRange() : { start: "", end: "" });
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
            Enquiry Module
          </h1>
        </div>
        <div className="rounded-md border border-mist bg-white px-4 py-2 text-sm text-ink/60">
          {totalRecords} {activeTab} enquiries
        </div>
      </div>

      <div className="mt-5 overflow-visible rounded-lg border border-mist bg-white shadow-sm">
        <div className="border-b border-mist bg-white">
          <div className="space-y-3 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Enquiry Listing</h2>
              <p className="text-[11px] text-ink/50">
                Manage open enquiries and review closed enquiries.
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

              <div className="inline-flex h-10 w-fit rounded-md border border-mist bg-parchment p-1">
                {tabItems.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={
                      activeTab === tab.value
                        ? "inline-flex items-center gap-2 rounded bg-white px-3 text-xs font-semibold text-ink shadow-sm"
                        : "inline-flex items-center gap-2 rounded px-3 text-xs font-medium text-ink/55 transition hover:text-ink"
                    }
                  >
                    {tab.label}
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] text-gold-dark">
                      {tab.count}
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
                  placeholder="Enquiry date"
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">Enq ID</th>
                <th className="w-48 px-4 py-2.5 font-semibold">Customer</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Number</th>
                <th className="px-4 py-2.5 font-semibold">Problem</th>
                {activeTab === "closed" && (
                  <th className="px-4 py-2.5 font-semibold">Close Remark</th>
                )}
                {activeTab === "open" && (
                  <th className="w-72 px-4 py-2.5 text-right font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "open" ? 5 : 5}
                    className="px-4 py-5 text-sm text-ink/50"
                  >
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                rows.map((enquiry) => (
                  <tr key={enquiry.enq_id} className="text-sm transition hover:bg-parchment/55">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{enquiry.enq_id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{enquiry.customer_name}</p>
                    </td>
                    <td className="px-4 py-2.5 text-ink/65">
                      {enquiry.customer_number}
                    </td>
                    <td className="px-4 py-2.5 text-ink/70">
                      {enquiry.problem_name}
                    </td>
                    {activeTab === "closed" && (
                      <td className="px-4 py-2.5 text-ink/60">
                        {enquiry.remark || "-"}
                      </td>
                    )}
                    {activeTab === "open" && (
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`tel:${enquiry.customer_number.replace(/\s/g, "")}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-mist bg-white px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          >
                            <Phone size={14} />
                            Call
                          </a>
                          <button
                            type="button"
                            onClick={() => openPaymentDraft(enquiry)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-mist bg-white px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          >
                            <CreditCard size={14} />
                            Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFollowError("");
                              setFollowStatus("warm");
                              setFollowDraft({ ...enquiry, remark: "" });
                            }}
                            className="rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                          >
                            Follow
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCloseRemarkError("");
                              setCloseDraft({ ...enquiry, remark: "" });
                            }}
                            className="rounded-md border border-mist bg-white px-2.5 py-1.5 text-xs font-medium text-ink/65 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    )}
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

      {followDraft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
                  Follow Up
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {followDraft.customer_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFollowDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close follow up"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 rounded-md border border-mist bg-parchment p-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Customer Number</p>
                  <p className="mt-1 font-medium text-ink">{followDraft.customer_number}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Problem</p>
                  <p className="mt-1 font-medium text-ink">{followDraft.problem_name}</p>
                </div>
              </div>

              <label className="block text-sm font-medium text-ink">
                Status
                <CustomSelect
                  instanceId="follow-up-status"
                  options={FOLLOW_UP_STATUS_OPTIONS}
                  value={
                    FOLLOW_UP_STATUS_OPTIONS.find(
                      (option) => option.value === followStatus
                    ) || null
                  }
                  variant="light"
                  onChange={(option) => {
                    if (!option) return;
                    setFollowStatus(option.value as FollowUpStatus);
                  }}
                  className="mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Remark <span className="text-red-500">*</span>
                <textarea
                  value={followDraft.remark || ""}
                  onChange={(event) => {
                    setFollowError("");
                    setFollowDraft({
                      ...followDraft,
                      remark: event.target.value,
                    });
                  }}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                  placeholder="Enter follow-up remark"
                />
                {followError && (
                  <p className="mt-2 text-xs text-red-600">{followError}</p>
                )}
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={() => setFollowDraft(null)}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFollowUp}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white"
              >
                <Save size={16} />
                Save Follow
              </button>
            </div>
          </div>
        </div>
      )}

      {closeDraft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
                  Close Enquiry
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {closeDraft.customer_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCloseDraft(null);
                  setCloseRemarkError("");
                }}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 rounded-md border border-mist bg-parchment p-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Customer Number</p>
                  <p className="mt-1 font-medium text-ink">{closeDraft.customer_number}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Problem</p>
                  <p className="mt-1 font-medium text-ink">{closeDraft.problem_name}</p>
                </div>
              </div>

              <label className="block text-sm font-medium text-ink">
                Close remark <span className="text-red-500">*</span>
                <textarea
                  value={closeDraft.remark || ""}
                  onChange={(event) => {
                    setCloseRemarkError("");
                    setCloseDraft({
                      ...closeDraft,
                      remark: event.target.value,
                    });
                  }}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                  placeholder="Enter close remark"
                />
                {closeRemarkError && (
                  <p className="mt-2 text-xs text-red-600">{closeRemarkError}</p>
                )}
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setCloseDraft(null);
                  setCloseRemarkError("");
                }}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={closeEnquiry}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white"
              >
                <Save size={16} />
                Close Enquiry
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentDraft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
                  Generate Payment Link
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {paymentDraft.customer_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePaymentDraft}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close payment modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 rounded-md border border-mist bg-parchment p-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Customer Number</p>
                  <p className="mt-1 font-medium text-ink">{paymentDraft.customer_number}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/45">Gateway</p>
                  <p className="mt-1 font-medium capitalize text-ink">
                    {paymentDraft.country_code.trim() === "+91"
                      ? "Razorpay"
                      : "Stripe"}
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium text-ink">
                Amount{" "}
                <span className="text-xs text-ink/45">
                  ({paymentDraft.country_code.trim() === "+91" ? "INR" : "USD"})
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => {
                    setPaymentError("");
                    setPaymentAmount(event.target.value);
                  }}
                  className="mt-2 h-11 w-full rounded-md border border-mist bg-parchment px-3 text-sm outline-none focus:border-gold"
                  placeholder="Enter amount"
                />
                {paymentError && (
                  <p className="mt-2 text-xs text-red-600">{paymentError}</p>
                )}
              </label>

              {generatedPayment && (
                <div className="rounded-md border border-mist bg-parchment p-4">
                  <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                    {generatedPayment.qr_code_url && (
                      <img
                        src={generatedPayment.qr_code_url}
                        alt="Payment QR code"
                        className="h-40 w-40 rounded-md border border-mist bg-white p-2"
                      />
                    )}
                    <div className="min-w-0 space-y-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ink/45">Payment ID</p>
                        <p className="mt-1 break-all font-mono text-xs text-ink/70">
                          {generatedPayment.provider_payment_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-ink/45">Payment Link</p>
                        <p className="mt-1 break-all text-ink/70">
                          {generatedPayment.payment_link}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedPayment.payment_link && (
                          <>
                            <button
                              type="button"
                              onClick={copyPaymentLink}
                              className="inline-flex items-center gap-1.5 rounded-md border border-mist bg-white px-3 py-2 text-xs font-medium text-ink/70 hover:border-gold hover:text-ink"
                            >
                              <Copy size={14} />
                              Copy
                            </button>
                            <a
                              href={generatedPayment.payment_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                            >
                              <ExternalLink size={14} />
                              Open
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={closePaymentDraft}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generatePaymentLink}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white"
              >
                <CreditCard size={16} />
                Generate Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
