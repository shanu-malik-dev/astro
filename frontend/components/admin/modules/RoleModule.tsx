import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Loader2, Save, Search, X } from "lucide-react";
import { ApiError, roleApi, type RoleDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { ALL_MODULES, PAGE_SIZE } from "../constants";
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

type RoleForm = {
  id?: number;
  name: string;
  status: number;
  modules: string[];
};

const emptyForm: RoleForm = {
  name: "",
  status: 1,
  modules: [],
};

const moduleLabels = new Map<string, string>(
  ALL_MODULES.map((module) => [module.key, module.label])
);

export function RoleModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>(
    ALL_MODULES.map((module) => module.key)
  );
  const [draft, setDraft] = useState<RoleForm | null>(null);
  const [search, setSearch] = useState("");
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

  const enabledModules = useMemo(
    () => ALL_MODULES.filter((module) => availableModules.includes(module.key)),
    [availableModules]
  );
  const loadRoles = useCallback(
    async (
      page: number,
      query = search,
      sortOrder = sortDirection,
      range = appliedDateFilter
    ) => {
      if (!accessToken) return;

      setLoading(true);
      snackbar.setPageLoading(true);
      try {
        const response = await roleApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          search: query.trim() || undefined,
          sort_order: sortOrder,
          date_from: range.start || undefined,
          date_to: range.end || undefined,
        });
        setRoles(response.data?.records || []);
        setAvailableModules(response.data?.available_modules || availableModules);
        setCurrentPage(response.data?.pagination?.page || page);
        setTotalPages(response.data?.pagination?.total_pages || 1);
        setTotalRecords(response.data?.pagination?.total || 0);
      } catch (error) {
        snackbar.error(
          error instanceof ApiError ? error.message : "Unable to load roles."
        );
      } finally {
        setLoading(false);
        snackbar.setPageLoading(false);
      }
    },
    [
      accessToken,
      appliedDateFilter,
      availableModules,
      search,
      snackbar,
      sortDirection,
      tenant.id,
    ]
  );

  useEffect(() => {
    if (!accessToken) return;

    const fetchKey = JSON.stringify({
      module: "roles",
      tenantId: tenant.id,
      accessToken,
      date: appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;

    lastFetchKeyRef.current = fetchKey;
    loadRoles(1, "");
  }, [accessToken, appliedDateFilter, loadRoles, tenant.id]);

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

  const openCreate = () => {
    setDraft({
      ...emptyForm,
      modules: enabledModules.map((module) => module.key),
    });
  };

  const openEdit = (role: RoleDto) => {
    setDraft({
      id: Number(role.id),
      name: role.name,
      status: role.status,
      modules: role.modules || [],
    });
  };

  const toggleModule = (moduleKey: string) => {
    setDraft((current) => {
      if (!current) return current;

      const hasModule = current.modules.includes(moduleKey);
      return {
        ...current,
        modules: hasModule
          ? current.modules.filter((item) => item !== moduleKey)
          : [...current.modules, moduleKey],
      };
    });
  };

  const saveRole = async () => {
    if (!accessToken || !draft) return;
    if (!draft.name.trim()) {
      snackbar.error("Role name is required.");
      return;
    }

    setSaving(true);
    snackbar.setPageLoading(true);
    const roleId = draft.id == null ? undefined : Number(draft.id);

    try {
      await roleApi.save(tenant.id, accessToken, {
        ...(roleId !== undefined ? { id: roleId } : {}),
        name: draft.name.trim(),
        status: Number(draft.status),
        modules: draft.modules,
      });
      snackbar.success("Role saved successfully.");
      setDraft(null);
      await loadRoles(currentPage);
    } catch (error) {
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to save role."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  return (
    <div>
      <ModuleHeader
        eyebrow="Admin"
        title="Roles Module"
        createLabel="Create Role"
        onCreate={openCreate}
        onList={() => loadRoles(currentPage)}
        onSort={() => {
          const nextDirection = sortDirection === "asc" ? "desc" : "asc";
          setSortDirection(nextDirection);
          loadRoles(1, search, nextDirection);
        }}
        sortDirection={sortDirection}
      />

      {draft && (
        <section className="mb-6 border border-mist bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {draft.id ? "Edit role" : "Create role"}
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Assign only the admin modules this role can use.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
            <label className="text-sm font-medium text-ink">
              Role name
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, name: event.target.value } : current
                  )
                }
                className="mt-2 h-11 w-full rounded-md border border-mist bg-parchment px-3 text-sm outline-none focus:border-gold"
                placeholder="Example: Support Admin"
              />
            </label>

            <label className="text-sm font-medium text-ink">
              Status
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, status: Number(event.target.value) }
                      : current
                  )
                }
                disabled={draft.id === 1}
                className="mt-2 h-11 w-full rounded-md border border-mist bg-parchment px-3 text-sm outline-none focus:border-gold"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {enabledModules.map((module) => {
              const checked = draft.modules.includes(module.key);

              return (
                <label
                  key={module.key}
                  className={`flex items-center gap-3 rounded-md border p-3 text-sm ${
                    checked
                      ? "border-gold bg-gold/10 text-ink"
                      : "border-mist bg-parchment text-ink/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleModule(module.key)}
                    className="h-4 w-4 accent-gold"
                  />
                  <span>{module.label}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={saveRole}
              disabled={saving}
              className="admin-create-button"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Role
            </button>
          </div>
        </section>
      )}

      <div className="admin-filter-panel mt-3">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const range = toAdminDateRange(dateFilter);
            setAppliedDateFilter(range);
            loadRoles(1, search, sortDirection, range);
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full rounded-md border border-mist bg-white px-3 text-sm outline-none focus:border-gold sm:w-64"
            placeholder="Search role"
          />
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

      <section data-admin-list className="admin-list-panel mt-4">
        <ListPanelHeader
          title="Role Listing"
          totalRecords={totalRecords}
          createLabel="Create Role"
          onCreate={openCreate}
          onList={() => loadRoles(currentPage)}
          onSort={() => {
            const nextDirection = sortDirection === "asc" ? "desc" : "asc";
            setSortDirection(nextDirection);
            loadRoles(1, search, nextDirection);
          }}
          sortDirection={sortDirection}
          loading={loading}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr>
                <th className="admin-th w-24">ID</th>
                <th className="admin-th w-44">Created Date</th>
                <th className="admin-th">Role</th>
                <th className="admin-th">Modules</th>
                <th className="admin-th w-32">Status</th>
                <th className="admin-th w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyListState
                      loading={loading}
                      message="No roles found."
                    />
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="admin-row">
                    <td data-label="ID" className="admin-td">#{String(role.id).padStart(3, "0")}</td>
                    <td data-label="Created Date" className="admin-td text-ink/60">
                      {formatAdminDate(role.created_at)}
                    </td>
                    <td data-label="Role" className="admin-td font-semibold text-ink">{role.name}</td>
                    <td data-label="Modules" className="admin-td">
                      <div className="flex flex-wrap gap-1.5">
                        {(role.modules || []).map((module) => (
                          <span
                            key={module}
                            className="rounded-full bg-ink/5 px-2 py-1 text-xs text-ink/65"
                          >
                            {moduleLabels.get(module) || module}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Status" className="admin-td">
                      <StatusBadge status={role.status === 1 ? "active" : "inactive"} />
                    </td>
                    <td data-label="Actions" className="admin-td text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(role)}
                        className="rounded-md border border-mist p-2 text-ink/60 hover:border-gold hover:text-ink"
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => loadRoles(page)}
      />
    </div>
  );
}
