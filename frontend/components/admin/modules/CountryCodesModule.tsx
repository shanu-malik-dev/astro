import { useCallback, useEffect, useRef, useState } from "react";
import { Edit3, Loader2, Search, Trash2, X } from "lucide-react";
import {
  ApiError,
  countryCodeApi,
  type CountryCodeDto,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { clearCountryCodeCache } from "@/lib/country-code-store";
import { useTenant } from "@/lib/tenant-context";
import CustomSelect, { type SelectOption } from "@/components/ui/CustomSelect";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import {
  DateRangeFilter,
  EmptyListState,
  formatAdminDate,
  ListPanelHeader,
  ModuleHeader,
  Pagination,
  StatusBadge,
  toAdminDateRange,
} from "../shared";
import type { DateRangeValue } from "@/components/ui/CustomDatePicker";

type CountryCodeForm = {
  id?: number;
  country_name: string;
  country_code: string;
  mobile_prefix: string;
  logo: string;
  status: number;
};

type CountryCodeFormErrors = Partial<
  Record<"country_name" | "country_code" | "mobile_prefix" | "status", string>
>;

const emptyForm: CountryCodeForm = {
  country_name: "",
  country_code: "",
  mobile_prefix: "",
  logo: "",
  status: 1,
};

const statusOptions: SelectOption[] = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

function validateForm(form: CountryCodeForm) {
  const errors: CountryCodeFormErrors = {};

  if (!form.country_name.trim()) errors.country_name = "Country name is required.";
  if (!form.country_code.trim()) errors.country_code = "Country code is required.";
  if (!form.mobile_prefix.trim()) {
    errors.mobile_prefix = "Mobile prefix is required.";
  } else if (!/^\+\d{1,4}$/.test(form.mobile_prefix.trim())) {
    errors.mobile_prefix = "Use format like +91.";
  }
  if (![0, 1].includes(Number(form.status))) errors.status = "Status is required.";

  return errors;
}

export function CountryCodesModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [rows, setRows] = useState<CountryCodeDto[]>([]);
  const [draft, setDraft] = useState<CountryCodeForm | null>(null);
  const [formErrors, setFormErrors] = useState<CountryCodeFormErrors>({});
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [dateFilter, setDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const [appliedDateFilter, setAppliedDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const lastFetchKeyRef = useRef("");

  const loadCountries = useCallback(
    async (page: number, sortOrder = sortDirection) => {
      if (!accessToken) return;

      setLoading(true);
      snackbar.setPageLoading(true);
      try {
        const response = await countryCodeApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          search: appliedSearch.trim() || undefined,
          sort_order: sortOrder,
          date_from: appliedDateFilter.start || undefined,
          date_to: appliedDateFilter.end || undefined,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setRows(records);
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
      } catch (error) {
        snackbar.error(
          error instanceof ApiError
            ? error.message
            : "Unable to load country codes."
        );
      } finally {
        setLoading(false);
        snackbar.setPageLoading(false);
      }
    },
    [
      accessToken,
      appliedDateFilter,
      appliedSearch,
      snackbar,
      sortDirection,
      tenant.id,
    ]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "countryCodes",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      page: currentPage,
      search: appliedSearch,
      sortDirection,
      date: appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadCountries(currentPage);
  }, [
    accessToken,
    appliedDateFilter,
    appliedSearch,
    currentPage,
    loadCountries,
    sortDirection,
    tenant.id,
  ]);

  const openCreate = () => {
    setFormErrors({});
    setDraft(emptyForm);
  };

  const openEdit = (country: CountryCodeDto) => {
    setFormErrors({});
    setDraft({
      id: Number(country.id),
      country_name: country.country_name,
      country_code: country.country_code,
      mobile_prefix: country.mobile_prefix || "",
      logo: country.logo || "",
      status: Number(country.status),
    });
  };

  const updateDraft = <Field extends keyof CountryCodeForm>(
    field: Field,
    value: CountryCodeForm[Field]
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
    setFormErrors((current) => {
      const updated = { ...current };
      delete updated[field as keyof CountryCodeFormErrors];
      return updated;
    });
  };

  const saveCountry = async () => {
    if (!accessToken || !draft) return;

    const errors = validateForm(draft);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      snackbar.error(Object.values(errors)[0] || "Please fix form errors.");
      return;
    }

    setSaving(true);
    snackbar.setPageLoading(true);
    try {
      await countryCodeApi.save(tenant.id, accessToken, {
        ...(draft.id ? { id: Number(draft.id) } : {}),
        country_name: draft.country_name.trim(),
        country_code: draft.country_code.trim().toUpperCase(),
        mobile_prefix: draft.mobile_prefix.trim(),
        ...(draft.logo.trim() ? { logo: draft.logo.trim() } : {}),
        status: Number(draft.status),
      });
      clearCountryCodeCache();
      snackbar.success("Country code saved successfully.");
      setDraft(null);
      await loadCountries(currentPage);
    } catch (error) {
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to save country code."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  const deleteCountry = async (country: CountryCodeDto) => {
    if (!accessToken) return;
    const confirmed = await snackbar.confirm({
      title: "Delete Country Code",
      message: `Are you sure you want to delete ${country.country_name}?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    snackbar.setPageLoading(true);
    try {
      await countryCodeApi.delete(tenant.id, accessToken, {
        id: Number(country.id),
      });
      clearCountryCodeCache();
      snackbar.success("Country code deleted successfully.");
      await loadCountries(currentPage);
    } catch (error) {
      snackbar.error(
        error instanceof ApiError
          ? error.message
          : "Unable to delete country code."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedDateFilter(toAdminDateRange(dateFilter));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setCurrentPage(1);
  };

  const applyDateFilter = (range = dateFilter) => {
    setAppliedDateFilter(toAdminDateRange(range));
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    const emptyRange = { start: "", end: "" };
    setDateFilter(emptyRange);
    setAppliedDateFilter(emptyRange);
    setCurrentPage(1);
  };

  const inputClass = (field: keyof CountryCodeFormErrors) =>
    `mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-gold ${
      formErrors[field] ? "border-red-300" : "border-mist"
    }`;

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Country Codes Module"
        createLabel="Add Country"
        onCreate={openCreate}
        onList={() => loadCountries(currentPage)}
        onSort={() => {
          const nextDirection = sortDirection === "asc" ? "desc" : "asc";
          setSortDirection(nextDirection);
          loadCountries(1, nextDirection);
        }}
        sortDirection={sortDirection}
      />

      <div className="admin-filter-panel mt-3">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="relative h-10 w-full sm:w-64">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-full w-full rounded-md border border-mist bg-white pl-3 pr-9 text-sm outline-none focus:border-gold"
              placeholder="Search country"
            />
            {search && (
              <button
                type="button"
                onClick={clearFilters}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/35 transition hover:text-ink"
                aria-label="Clear search"
              >
              <X size={15} />
              </button>
            )}
          </div>
          <DateRangeFilter
            value={dateFilter}
            onChange={setDateFilter}
            onApply={applyDateFilter}
            onClear={clearDateFilter}
            hasValue={Boolean(appliedDateFilter.start || appliedDateFilter.end)}
          />
          <button type="submit" className="admin-create-button" title="Search" aria-label="Search">
            <Search size={16} />
          </button>
        </form>
      </div>

      <div data-admin-list className="mt-4 overflow-visible rounded-lg border border-mist bg-white shadow-sm">
        <ListPanelHeader
          title="Country Code Listing"
          totalRecords={totalRecords}
          createLabel="Add Country"
          onCreate={openCreate}
          onList={() => loadCountries(currentPage)}
          onSort={() => {
            const nextDirection = sortDirection === "asc" ? "desc" : "asc";
            setSortDirection(nextDirection);
            loadCountries(1, nextDirection);
          }}
          sortDirection={sortDirection}
          loading={loading}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created Date</th>
                <th className="w-56 px-4 py-2.5 font-semibold">Country</th>
                <th className="w-36 px-4 py-2.5 font-semibold">Code</th>
                <th className="w-40 px-4 py-2.5 font-semibold">Mobile Prefix</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-32 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-5">
                    <EmptyListState
                      loading={loading}
                      message="No country codes found."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((country) => (
                  <tr key={country.id} className="text-sm transition hover:bg-parchment/55">
                    <td data-label="ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{country.id.toString().padStart(3, "0")}
                    </td>
                    <td data-label="Created Date" className="px-4 py-2.5 text-ink/60">
                      {formatAdminDate(country.created_at)}
                    </td>
                    <td data-label="Country" className="px-4 py-2.5 font-medium text-ink">
                      {country.country_name}
                    </td>
                    <td data-label="Code" className="px-4 py-2.5 text-ink/65">
                      {country.country_code}
                    </td>
                    <td data-label="Mobile Prefix" className="px-4 py-2.5 text-ink/65">
                      {country.mobile_prefix}
                    </td>
                    <td data-label="Status" className="px-4 py-2.5">
                      <StatusBadge status={country.status === 1 ? "active" : "inactive"} />
                    </td>
                    <td data-label="Actions" className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(country)}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="Edit country code"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCountry(country)}
                          className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                          aria-label="Delete country code"
                        >
                          <Trash2 size={15} />
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
        onPageChange={(page) => loadCountries(page)}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Country Code</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {draft.id ? "Edit Country" : "Add Country"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close country code form"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="text-sm font-medium text-ink">
                Country Name
                <input
                  value={draft.country_name}
                  onChange={(event) => updateDraft("country_name", event.target.value)}
                  className={inputClass("country_name")}
                />
                {formErrors.country_name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.country_name}</p>
                )}
              </label>

              <label className="text-sm font-medium text-ink">
                Country Code
                <input
                  value={draft.country_code}
                  onChange={(event) => updateDraft("country_code", event.target.value.toUpperCase())}
                  placeholder="IN"
                  className={inputClass("country_code")}
                />
                {formErrors.country_code && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.country_code}</p>
                )}
              </label>

              <label className="text-sm font-medium text-ink">
                Mobile Prefix
                <input
                  value={draft.mobile_prefix}
                  onChange={(event) => updateDraft("mobile_prefix", event.target.value)}
                  placeholder="+91"
                  className={inputClass("mobile_prefix")}
                />
                {formErrors.mobile_prefix && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.mobile_prefix}</p>
                )}
              </label>

              <div className="text-sm font-medium text-ink">
                Status
                <CustomSelect
                  className="mt-2"
                  instanceId="country-code-status"
                  variant="light"
                  options={statusOptions}
                  value={
                    statusOptions.find(
                      (option) => Number(option.value) === draft.status
                    ) || statusOptions[0]
                  }
                  isSearchable={false}
                  onChange={(option) =>
                    updateDraft("status", Number(option?.value || 1))
                  }
                />
                {formErrors.status && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.status}</p>
                )}
              </div>

              <label className="text-sm font-medium text-ink md:col-span-2">
                Logo URL
                <input
                  value={draft.logo}
                  onChange={(event) => updateDraft("logo", event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-mist bg-white px-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist bg-white px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCountry}
                disabled={saving}
                className="admin-create-button"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save Country
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
