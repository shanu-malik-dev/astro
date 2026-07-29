import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Loader2, Phone, Search, Trash2, X } from "lucide-react";
import {
  adminUserApi,
  ApiError,
  roleApi,
  type AdminUserDto,
  type RoleDto,
} from "@/lib/api";
import {
  CUSTOMER_CALL_STATUS,
  CUSTOMER_CALL_STATUS_LABELS,
} from "@/lib/status-constants";
import CustomSelect, { type SelectOption } from "@/components/ui/CustomSelect";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
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
import type { AdminDateFilter } from "../types";

type UserForm = {
  id?: number;
  role_id: number;
  name: string;
  mobile: string;
  email: string;
  password: string;
  status: number;
};

type UserFormErrors = Partial<
  Record<"role_id" | "status" | "name" | "mobile" | "email" | "password", string>
>;

type UserFormField = keyof UserFormErrors;
type CustomerRange = "all" | "today";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_MIN_LENGTH = 6;
const CALL_STATUS_OPTIONS = [
  { value: "", label: "All call status" },
  { value: String(CUSTOMER_CALL_STATUS.CALLED), label: "Called" },
  { value: String(CUSTOMER_CALL_STATUS.NOT_CALLED), label: "Not called" },
];

const emptyForm: UserForm = {
  role_id: 0,
  name: "",
  mobile: "",
  email: "",
  password: "",
  status: 1,
};

function callStatusClass(status: AdminUserDto["call_status"]) {
  return status === CUSTOMER_CALL_STATUS.CALLED
    ? "bg-green-50 text-green-700"
    : "bg-yellow-50 text-yellow-700";
}

function validateUserField(field: UserFormField, form: UserForm) {
  if (field === "role_id" && !form.role_id) return "Role is required.";
  if (field === "status" && ![0, 1].includes(Number(form.status))) {
    return "Status is required.";
  }
  if (field === "name" && !form.name.trim()) return "Name is required.";
  if (field === "email") {
    if (!form.email.trim()) return "Email is required.";
    if (!EMAIL_REGEX.test(form.email.trim())) return "Enter a valid email address.";
  }
  if (field === "mobile") {
    if (!form.mobile.trim()) return "Mobile number is required.";
    if (!INDIAN_MOBILE_REGEX.test(form.mobile.trim())) {
      return "Enter a valid 10 digit Indian mobile number.";
    }
  }
  if (field === "password") {
    if (!form.id && !form.password.trim()) return "Password is required.";
    if (form.password.trim() && form.password.trim().length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
  }

  return "";
}

function validateUserForm(form: UserForm) {
  const fields: UserFormField[] = [
    "role_id",
    "status",
    "name",
    "email",
    "mobile",
    "password",
  ];
  const errors: UserFormErrors = {};

  fields.forEach((field) => {
    const error = validateUserField(field, form);
    if (error) errors[field] = error;
  });

  return errors;
}

export function UsersModule({
  initialRoleName,
  initialDateFilter,
  filterToken,
}: {
  initialRoleName?: string;
  initialDateFilter?: AdminDateFilter | null;
  filterToken?: number;
} = {}) {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<number>(0);
  const [rows, setRows] = useState<AdminUserDto[]>([]);
  const [draft, setDraft] = useState<UserForm | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [customerRange, setCustomerRange] = useState<CustomerRange>("all");
  const [appliedCustomerRange, setAppliedCustomerRange] =
    useState<CustomerRange>("all");
  const [callStatus, setCallStatus] = useState("");
  const [appliedCallStatus, setAppliedCallStatus] = useState("");
  const [appliedDateFilter, setAppliedDateFilter] =
    useState<AdminDateFilter | null>(null);
  const [dateFilter, setDateFilter] = useState<DateRangeValue>({
    start: "",
    end: "",
  });
  const lastFetchKeyRef = useRef("");

  const activeRole = useMemo(
    () => roles.find((role) => Number(role.id) === activeRoleId),
    [activeRoleId, roles]
  );
  const isCustomerRole = activeRole?.name?.toLowerCase() === "customer";
  const customerRangeTabs = useMemo(
    () => [
      { value: "all" as const, label: "All" },
      { value: "today" as const, label: "Today" },
    ],
    []
  );
  const roleOptions = useMemo<SelectOption[]>(
    () =>
      roles.map((role) => ({
        value: String(role.id),
        label: role.name,
      })),
    [roles]
  );
  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
    ],
    []
  );
  const selectedRoleOption = useMemo(
    () =>
      roleOptions.find((option) => Number(option.value) === draft?.role_id) ||
      null,
    [draft?.role_id, roleOptions]
  );
  const selectedStatusOption = useMemo(
    () =>
      statusOptions.find((option) => Number(option.value) === draft?.status) ||
      statusOptions[0],
    [draft?.status, statusOptions]
  );
  const loadRoles = useCallback(async () => {
    if (!accessToken) return;

    const response = await roleApi.list(tenant.id, accessToken, {
      page: 1,
      limit: 100,
    });
    const nonAdminRoles = (response.data?.records || []).filter(
      (role) => Number(role.id) !== 1
    );

    setRoles(nonAdminRoles);
    setActiveRoleId((current) => current || Number(nonAdminRoles[0]?.id || 0));
  }, [accessToken, tenant.id]);

  const loadUsers = useCallback(
    async (page: number, roleId = activeRoleId, sortOrder = sortDirection) => {
      if (!accessToken || !roleId) return;

      setLoading(true);
      snackbar.setPageLoading(true);
      try {
        const response = await adminUserApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          role_id: Number(roleId),
          search: appliedSearch.trim() || undefined,
          sort_order: sortOrder,
          ...(isCustomerRole
            ? {
                range: appliedCustomerRange,
                call_status: appliedCallStatus ? Number(appliedCallStatus) : undefined,
                date_from: appliedDateFilter?.start || undefined,
                date_to: appliedDateFilter?.end || undefined,
              }
            : {}),
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setRows(records);
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
      } catch (error) {
        snackbar.error(
          error instanceof ApiError ? error.message : "Unable to load users."
        );
      } finally {
        setLoading(false);
        snackbar.setPageLoading(false);
      }
    },
    [
      accessToken,
      activeRoleId,
      appliedSearch,
      appliedDateFilter,
      appliedCallStatus,
      appliedCustomerRange,
      isCustomerRole,
      snackbar,
      sortDirection,
      tenant.id,
    ]
  );

  useEffect(() => {
    loadRoles().catch((error) => {
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to load roles."
      );
    });
  }, [loadRoles, snackbar]);

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "users",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      roleId: activeRoleId,
      page: currentPage,
      search: appliedSearch,
      sortDirection,
      customerRange: appliedCustomerRange,
      callStatus: appliedCallStatus,
      dateFrom: appliedDateFilter?.start || "",
      dateTo: appliedDateFilter?.end || "",
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadUsers(currentPage);
  }, [
    accessToken,
    activeRoleId,
    appliedSearch,
    appliedDateFilter,
    appliedCallStatus,
    appliedCustomerRange,
    currentPage,
    loadUsers,
    sortDirection,
    tenant.id,
  ]);

  useEffect(() => {
    if (!filterToken || !roles.length) return;

    if (initialRoleName) {
      const matchedRole = roles.find(
        (role) => role.name.toLowerCase() === initialRoleName.toLowerCase()
      );
      if (matchedRole) setActiveRoleId(Number(matchedRole.id));
    }

    if (initialDateFilter) {
      setAppliedDateFilter(initialDateFilter);
      setCustomerRange(initialDateFilter.preset === "today" ? "today" : "all");
      setAppliedCustomerRange(initialDateFilter.preset === "today" ? "today" : "all");
      setCurrentPage(1);
    }
  }, [filterToken, initialDateFilter, initialRoleName, roles]);

  const selectRole = (roleId: number) => {
    setActiveRoleId(roleId);
    setCurrentPage(1);
    setCustomerRange("all");
    setAppliedCustomerRange("all");
    setCallStatus("");
    setAppliedCallStatus("");
  };

  const openCreate = () => {
    setFormErrors({});
    setDraft({
      ...emptyForm,
      role_id: activeRoleId || Number(roles[0]?.id || 0),
    });
  };

  const openEdit = (user: AdminUserDto) => {
    setFormErrors({});
    setDraft({
      id: Number(user.id),
      role_id: Number(user.role_id),
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      password: "",
      status: Number(user.status),
    });
  };

  const updateDraftField = <Field extends keyof UserForm>(
    field: Field,
    value: UserForm[Field]
  ) => {
    setDraft((current) => {
      if (!current) return current;

      const next = { ...current, [field]: value };
      if (field in emptyForm || field === "id") {
        const error = validateUserField(field as UserFormField, next);
        setFormErrors((currentErrors) => {
          const updated = { ...currentErrors };
          if (error) updated[field as UserFormField] = error;
          else delete updated[field as UserFormField];
          return updated;
        });
      }

      return next;
    });
  };

  const inputClass = (field: UserFormField) =>
    `mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none focus:border-gold ${
      formErrors[field] ? "border-red-300" : "border-mist"
    }`;

  const saveUser = async () => {
    if (!accessToken || !draft) return;
    const errors = validateUserForm(draft);

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      snackbar.error(Object.values(errors)[0] || "Please fix form errors.");
      return;
    }

    setSaving(true);
    snackbar.setPageLoading(true);
    try {
      await adminUserApi.save(tenant.id, accessToken, {
        ...(draft.id ? { id: Number(draft.id) } : {}),
        role_id: Number(draft.role_id),
        name: draft.name.trim(),
        mobile: draft.mobile.trim(),
        email: draft.email.trim(),
        ...(draft.password.trim() ? { password: draft.password.trim() } : {}),
        status: Number(draft.status),
      });
      snackbar.success("User saved successfully.");
      setDraft(null);
      setActiveRoleId(Number(draft.role_id));
      await loadUsers(currentPage, Number(draft.role_id));
    } catch (error) {
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to save user."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  const deleteUser = async (user: AdminUserDto) => {
    if (!accessToken) return;
    const confirmed = await snackbar.confirm({
      title: "Delete User",
      message: `Are you sure you want to delete ${user.name}? This user will no longer be able to login.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    snackbar.setPageLoading(true);
    try {
      await adminUserApi.delete(tenant.id, accessToken, { id: Number(user.id) });
      snackbar.success("User deleted successfully.");
      await loadUsers(currentPage);
    } catch (error) {
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to delete user."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const updateCallStatus = async (
    user: AdminUserDto,
    nextStatus: AdminUserDto["call_status"]
  ) => {
    if (!accessToken) return;

    snackbar.setPageLoading(true);
    try {
      await adminUserApi.updateCallStatus(tenant.id, accessToken, {
        id: Number(user.id),
        call_status: Number(nextStatus),
      });
      setRows((currentRows) =>
        currentRows.map((row) =>
          row.id === user.id ? { ...row, call_status: nextStatus } : row
        )
      );
      snackbar.success("Customer call status updated.");
    } catch (error) {
      snackbar.error(
        error instanceof ApiError
          ? error.message
          : "Unable to update call status."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedCustomerRange(customerRange);
    setAppliedCallStatus(callStatus);
    setAppliedDateFilter({
      preset: "custom",
      ...toAdminDateRange(dateFilter),
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setCallStatus("");
    setAppliedCallStatus("");
    setCustomerRange("all");
    setAppliedCustomerRange("all");
    setAppliedDateFilter(null);
    setDateFilter({ start: "", end: "" });
    setCurrentPage(1);
  };

  const applyDateFilter = (nextDateFilter = dateFilter) => {
    const range = toAdminDateRange(nextDateFilter);
    setAppliedDateFilter({
      preset: "custom",
      start: range.start,
      end: range.end,
    });
  };

  const clearDateFilter = () => {
    setDateFilter({ start: "", end: "" });
    setAppliedDateFilter(null);
    setCurrentPage(1);
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Users Module"
        createLabel="Add User"
        onCreate={openCreate}
        onList={() => loadUsers(currentPage)}
        onSort={() => {
          const nextDirection = sortDirection === "asc" ? "desc" : "asc";
          setSortDirection(nextDirection);
          loadUsers(1, activeRoleId, nextDirection);
        }}
        sortDirection={sortDirection}
      />

      <div className="admin-filter-panel mt-3">
        {roles.length === 0 ? (
          <p className="text-sm text-ink/55">No roles available.</p>
        ) : (
          <div className="admin-filter-segment">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => selectRole(Number(role.id))}
                className={
                  activeRoleId === Number(role.id)
                    ? "rounded bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                    : "rounded px-3 py-1.5 text-xs font-medium text-ink/55 transition hover:text-ink"
                }
              >
                {role.name}
              </button>
            ))}
          </div>
        )}

        {isCustomerRole && (
          <div className="admin-filter-segment">
            {customerRangeTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setCustomerRange(tab.value);
                }}
                className={
                  customerRange === tab.value
                    ? "rounded bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                    : "rounded px-3 py-1.5 text-xs font-medium text-ink/55 transition hover:text-ink"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

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
              placeholder="Search users"
              className="h-full w-full rounded-md border border-mist bg-white pl-3 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-gold"
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
          {isCustomerRole && (
            <CustomSelect
              instanceId="user-customer-call-status-filter"
              options={CALL_STATUS_OPTIONS}
              value={
                CALL_STATUS_OPTIONS.find(
                  (option) => option.value === callStatus
                ) || null
              }
              variant="light"
              onChange={(option) => {
                setCallStatus(option?.value || "");
              }}
              className="w-full sm:w-44"
            />
          )}
          <DateRangeFilter
            value={dateFilter}
            onChange={setDateFilter}
            onApply={applyDateFilter}
            onClear={clearDateFilter}
            hasValue={Boolean(appliedDateFilter?.start || appliedDateFilter?.end)}
          />
          <button type="submit" className="admin-create-button" title="Search" aria-label="Search">
            <Search size={16} />
          </button>
        </form>
      </div>

      <div data-admin-list className="mt-4 overflow-visible rounded-lg border border-mist bg-white shadow-sm">

        <ListPanelHeader
          title={`${activeRole?.name || "Users"} Listing`}
          totalRecords={totalRecords}
          createLabel="Add User"
          onCreate={openCreate}
          onList={() => loadUsers(currentPage)}
          onSort={() => {
            const nextDirection = sortDirection === "asc" ? "desc" : "asc";
            setSortDirection(nextDirection);
            loadUsers(1, activeRoleId, nextDirection);
          }}
          sortDirection={sortDirection}
          loading={loading}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-24 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created Date</th>
                <th className="w-48 px-4 py-2.5 font-semibold">Name</th>
                <th className="w-56 px-4 py-2.5 font-semibold">Email</th>
                <th className="w-40 px-4 py-2.5 font-semibold">Mobile</th>
                <th className="w-40 px-4 py-2.5 font-semibold">Role</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                {isCustomerRole && (
                  <th className="w-36 px-4 py-2.5 font-semibold">Call Status</th>
                )}
                <th className="w-48 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={isCustomerRole ? 9 : 8} className="px-4 py-5">
                    <EmptyListState
                      loading={loading}
                      message="No users found for this role."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr key={user.id} className="text-sm transition hover:bg-parchment/55">
                    <td data-label="ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{user.id.toString().padStart(4, "0")}
                    </td>
                    <td data-label="Created Date" className="px-4 py-2.5 text-ink/60">
                      {formatAdminDate(user.created_at)}
                    </td>
                    <td data-label="Name" className="px-4 py-2.5">
                      <p className="font-medium text-ink">{user.name}</p>
                    </td>
                    <td data-label="Email" className="px-4 py-2.5 text-ink/65">
                      {user.email}
                    </td>
                    <td data-label="Mobile" className="px-4 py-2.5 text-ink/65">
                      {user.country_code} {user.mobile}
                    </td>
                    <td data-label="Role" className="px-4 py-2.5 text-ink/70">
                      {user.role_name}
                    </td>
                    <td data-label="Status" className="px-4 py-2.5">
                      <StatusBadge status={user.status === 1 ? "active" : "inactive"} />
                    </td>
                    {isCustomerRole && (
                      <td data-label="Call Status" className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${callStatusClass(
                            user.call_status
                          )}`}
                        >
                          {CUSTOMER_CALL_STATUS_LABELS[user.call_status] ||
                            user.call_status}
                        </span>
                      </td>
                    )}
                    <td data-label="Actions" className="px-4 py-2.5">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isCustomerRole && (
                          <>
                            <a
                              href={`tel:${user.country_code}${user.mobile}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-mist bg-white px-2.5 py-1.5 text-xs font-medium text-ink/70 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            >
                              <Phone size={14} />
                              Call
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                updateCallStatus(
                                  user,
                                  user.call_status === CUSTOMER_CALL_STATUS.CALLED
                                    ? CUSTOMER_CALL_STATUS.NOT_CALLED
                                    : CUSTOMER_CALL_STATUS.CALLED
                                )
                              }
                              className="rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                            >
                              {user.call_status === CUSTOMER_CALL_STATUS.CALLED
                                ? "Mark Not Called"
                                : "Mark Called"}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="Edit user"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(user)}
                          className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                          aria-label="Delete user"
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
        onPageChange={(page) => loadUsers(page)}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">User Details</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {draft.id ? "Edit User" : "Add User"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close user form"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-sm font-medium text-ink">
                  Role
                  <CustomSelect
                    className="mt-2"
                    instanceId="admin-user-role"
                    variant="light"
                    options={roleOptions}
                    value={selectedRoleOption}
                    onChange={(option) =>
                      updateDraftField("role_id", Number(option?.value || 0))
                    }
                    placeholder="Select role"
                  />
                  {formErrors.role_id && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.role_id}</p>
                  )}
                </div>

                <div className="text-sm font-medium text-ink">
                  Status
                  <CustomSelect
                    className="mt-2"
                    instanceId="admin-user-status"
                    variant="light"
                    options={statusOptions}
                    value={selectedStatusOption}
                    isSearchable={false}
                    onChange={(option) =>
                      updateDraftField("status", Number(option?.value || 1))
                    }
                  />
                  {formErrors.status && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.status}</p>
                  )}
                </div>

                <label className="text-sm font-medium text-ink">
                  Name
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      updateDraftField("name", event.target.value)
                    }
                    className={inputClass("name")}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                  )}
                </label>

                <label className="text-sm font-medium text-ink">
                  Email
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(event) =>
                      updateDraftField("email", event.target.value)
                    }
                    className={inputClass("email")}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                  )}
                </label>

                <label className="text-sm font-medium text-ink">
                  Mobile
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    value={draft.mobile}
                    onChange={(event) => {
                      const mobile = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

                      updateDraftField("mobile", mobile);
                    }}
                    placeholder="10 digit Indian number"
                    className={inputClass("mobile")}
                  />
                  {formErrors.mobile && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.mobile}</p>
                  )}
                </label>

                <label className="text-sm font-medium text-ink">
                  Password {draft.id ? "(leave blank to keep current)" : ""}
                  <input
                    type="password"
                    value={draft.password}
                    onChange={(event) =>
                      updateDraftField("password", event.target.value)
                    }
                    className={inputClass("password")}
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
                  )}
                </label>
              </div>
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
                onClick={saveUser}
                disabled={saving}
                className="admin-create-button"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
