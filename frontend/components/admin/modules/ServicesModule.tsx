import { useCallback, useEffect, useRef, useState } from "react";
import { Edit3, Loader2, Power, Save, Trash2, X } from "lucide-react";
import { adminServiceApi, ApiError, type AdminServiceDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import {
  createEmptyServiceTranslations,
  getEnglishTranslation,
  syncServiceTranslations,
} from "../helpers";
import { ModuleHeader, Pagination, StatusBadge } from "../shared";
import type { ServiceRow, ServiceTranslation } from "../types";

type ServiceFormErrors = {
  displayOrder?: string;
  names?: Record<string, string>;
};

function labelToLangCode(label: string) {
  const normalized = label.toLowerCase();
  if (normalized === "hi" || normalized === "hindi") return "hi";
  return "en";
}

function labelToName(label: string) {
  const normalized = label.toLowerCase();
  if (normalized === "hi" || normalized === "hindi") return "Hindi";
  return "English";
}

function mapServiceDto(service: AdminServiceDto): ServiceRow {
  const translations =
    service.all_names?.map((item) => ({
      lang: labelToLangCode(item.label),
      label: labelToName(item.label),
      name: item.value || "",
      description: item.description || "",
    })) || [];

  return syncServiceTranslations({
    id: Number(service.id),
    displayOrder: Number(service.display_order || 1),
    status: Number(service.status) === 1 ? "active" : "inactive",
    translations,
  });
}

function toTranslationPayload(translations: ServiceTranslation[]) {
  return translations
    .filter((translation) => translation.name.trim())
    .map((translation) => ({
      lang_code: translation.lang,
      name: translation.name.trim(),
      description: translation.description.trim(),
    }));
}

export function ServicesModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [draft, setDraft] = useState<ServiceRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});
  const lastFetchKeyRef = useRef("");

  const loadServices = useCallback(
    async (page: number) => {
      if (!accessToken) return;

      setLoading(true);
      snackbar.setPageLoading(true);

      try {
        const response = await adminServiceApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setServices(records.map(mapServiceDto));
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
      } catch (err) {
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load service list."
        );
      } finally {
        setLoading(false);
        snackbar.setPageLoading(false);
      }
    },
    [accessToken, snackbar, tenant.id]
  );

  useEffect(() => {
    const fetchKey = `services:1:${tenant.id}:${accessToken || ""}`;
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadServices(1);
  }, [accessToken, loadServices, tenant.id]);

  const startCreate = () => {
    setFormErrors({});
    setDraft({
      id: 0,
      displayOrder: totalRecords + 1,
      status: "active",
      translations: createEmptyServiceTranslations(),
    });
  };

  const validateDraft = (currentDraft: ServiceRow) => {
    const errors: ServiceFormErrors = {};
    const maxDisplayOrder = currentDraft.id ? totalRecords : totalRecords + 1;

    if (!currentDraft.displayOrder || currentDraft.displayOrder < 1) {
      errors.displayOrder = "Display order is required.";
    } else if (!currentDraft.id && currentDraft.displayOrder !== maxDisplayOrder) {
      errors.displayOrder = `Display order must be ${maxDisplayOrder}.`;
    } else if (currentDraft.id && currentDraft.displayOrder > maxDisplayOrder) {
      errors.displayOrder = `Display order must be between 1 and ${maxDisplayOrder}.`;
    }

    const nameErrors = currentDraft.translations.reduce<Record<string, string>>(
      (current, translation) => {
        if (!translation.name.trim()) {
          current[translation.lang] = `${translation.label} service name is required.`;
        }
        return current;
      },
      {}
    );

    if (Object.keys(nameErrors).length) errors.names = nameErrors;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveDraft = async () => {
    if (!draft || !accessToken) return;

    if (!validateDraft(draft)) return;

    const translations = toTranslationPayload(draft.translations);

    setSaving(true);
    snackbar.setPageLoading(true);

    try {
      if (draft.id) {
        await adminServiceApi.update(tenant.id, accessToken, {
          id: draft.id,
          display_order: draft.displayOrder,
          translations,
        });
        snackbar.success("Service updated successfully.");
      } else {
        await adminServiceApi.create(tenant.id, accessToken, {
          display_order: draft.displayOrder,
          translations,
        });
        snackbar.success("Service created successfully.");
      }

      setDraft(null);
      await loadServices(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to save service."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  const deleteService = async (serviceId: number) => {
    if (!accessToken) return;
    const confirmed = await snackbar.confirm({
      title: "Delete Service",
      message: "Are you sure you want to delete this service?",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    snackbar.setPageLoading(true);
    try {
      await adminServiceApi.remove(tenant.id, accessToken, { id: serviceId });
      snackbar.success("Service deleted successfully.");
      await loadServices(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete service."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const toggleStatus = async (service: ServiceRow) => {
    if (!accessToken) return;

    snackbar.setPageLoading(true);
    try {
      await adminServiceApi.updateStatus(tenant.id, accessToken, {
        id: service.id,
        status: service.status === "active" ? 0 : 1,
      });
      snackbar.success("Service status updated successfully.");
      await loadServices(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to update service status."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Services Module"
        createLabel="Create Service"
        onCreate={startCreate}
      />

      <div className="mt-5 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-mist bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Service Listing</h2>
            <p className="text-[11px] text-ink/50">{totalRecords} total records</p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-ink/50">
              <Loader2 size={14} className="animate-spin" />
              Loading
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-20 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-56 px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold">Description</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-40 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-sm text-ink/50">
                    {loading ? "Loading services..." : "No services yet. Create the first service."}
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const english = getEnglishTranslation(
                    syncServiceTranslations(service).translations
                  );

                  return (
                    <tr key={service.id} className="text-sm transition hover:bg-parchment/55">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                        #{service.id.toString().padStart(3, "0")}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-ink">
                        {english?.name || "Untitled service"}
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        <span className="line-clamp-1">
                          {english?.description || "No description"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={service.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormErrors({});
                              setDraft(syncServiceTranslations(service));
                            }}
                            className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            aria-label="Edit service"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(service)}
                            className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            aria-label="Toggle service status"
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteService(service.id)}
                            className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                            aria-label="Delete service"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => loadServices(page)}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Service Details</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {draft.id ? "Edit Service" : "Create Service"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close service form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-start">
                {(() => {
                  const maxDisplayOrder = draft.id ? totalRecords : totalRecords + 1;

                  return (
                <label className="block rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink">
                  Display order <span className="text-red-500">*</span>
                  <input
                    type="number"
                    min={draft.id ? 1 : maxDisplayOrder}
                    max={maxDisplayOrder}
                    value={draft.displayOrder}
                    onChange={(event) =>
                      {
                        setFormErrors((current) => ({
                          ...current,
                          displayOrder: undefined,
                        }));
                        setDraft({
                          ...draft,
                          displayOrder: Number(event.target.value),
                        });
                      }
                    }
                    className="mt-2 h-10 w-24 rounded-md border border-mist bg-white px-3 outline-none focus:border-gold"
                  />
                  <p className="mt-2 text-xs text-ink/45">
                    {draft.id ? `Allowed 1-${maxDisplayOrder}` : `Required ${maxDisplayOrder}`}
                  </p>
                  {formErrors.displayOrder && (
                    <p className="mt-2 text-xs text-red-600">
                      {formErrors.displayOrder}
                    </p>
                  )}
                </label>
                  );
                })()}

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">Service Content</h3>
                      <p className="mt-1 text-xs text-ink/55">
                        Add language-wise name and description.
                      </p>
                    </div>
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-dark">
                      {draft.translations.length} Languages
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {draft.translations.map((translation, index) => (
                      <div
                        key={translation.lang}
                        className="rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{translation.label}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase text-ink/45">
                            {translation.lang}
                          </span>
                        </div>

                        <label className="mt-4 block">
                          Name
                          <span className="text-red-500"> *</span>
                          <input
                            type="text"
                            value={translation.name}
                            onChange={(event) => {
                              const translations = [...draft.translations];
                              translations[index] = {
                                ...translation,
                                name: event.target.value,
                              };
                              if (translation.lang === "en") {
                                setFormErrors((current) => ({
                                  ...current,
                                  names: {
                                    ...current.names,
                                    [translation.lang]: "",
                                  },
                                }));
                              }
                              setDraft({ ...draft, translations });
                            }}
                            className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                            placeholder={`Enter ${translation.label} name`}
                          />
                          {formErrors.names?.[translation.lang] && (
                            <p className="mt-2 text-xs text-red-600">
                              {formErrors.names[translation.lang]}
                            </p>
                          )}
                        </label>

                        <label className="mt-4 block">
                          Description
                          <textarea
                            value={translation.description}
                            onChange={(event) => {
                              const translations = [...draft.translations];
                              translations[index] = {
                                ...translation,
                                description: event.target.value,
                              };
                              setDraft({ ...draft, translations });
                            }}
                            rows={3}
                            className="mt-2 w-full resize-none rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                            placeholder={`Enter ${translation.label} description`}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-mist bg-parchment px-5 py-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
