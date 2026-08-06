import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, Edit3, Loader2, Power, Save, Search, Trash2, X } from "lucide-react";
import {
  adminAstrologerApi,
  ApiError,
  type AdminAstrologerDto,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import {
  createEmptyServiceTranslations,
  getEnglishTranslation,
  syncAstrologerTranslations,
} from "../helpers";
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
import { FileUpload } from "@/components/ui/FileUpload";
import { API_BASE_URL } from "@/lib/api-service";
import type { AstrologerRow, AstrologerTranslation } from "../types";

type AstrologerFormErrors = {
  image?: string;
  experience?: string;
  languages?: string;
  rating?: string;
  consultations?: string;
  names?: Record<string, string>;
  expertise?: Record<string, string>;
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

function mapAstrologerDto(astrologer: AdminAstrologerDto): AstrologerRow {
  const translations =
    astrologer.all_names?.map((item) => ({
      lang: labelToLangCode(item.label),
      label: labelToName(item.label),
      name: item.value || "",
      expertise: item.expertise || "",
      description: item.description || "",
    })) || [];

  return syncAstrologerTranslations({
    id: Number(astrologer.id),
    createdAt: astrologer.created_at,
    image: astrologer.image || "",
    experience: astrologer.experience || "",
    languages: astrologer.languages || "",
    rating: Number(astrologer.rating || 0),
    consultations: astrologer.consultations || "0",
    status: Number(astrologer.status) === 1 ? "active" : "inactive",
    translations,
  });
}

function toTranslationPayload(translations: AstrologerTranslation[]) {
  return translations
    .filter((translation) => translation.name.trim())
    .map((translation) => ({
      lang_code: translation.lang,
      name: translation.name.trim(),
      expertise: cleanCommaValue(translation.expertise),
      description: translation.description.trim(),
    }));
}

function cleanCommaValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function toText(value: unknown) {
  return String(value ?? "");
}

function getApiAssetBaseUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function resolveAssetUrl(value?: string) {
  const path = value?.trim();
  if (!path) return "";
  if (/^(data:|blob:)/i.test(path)) return path;

  const uploadPathIndex = path.indexOf("/uploads/");
  if (uploadPathIndex >= 0) {
    return `${getApiAssetBaseUrl()}${path.slice(uploadPathIndex)}`;
  }

  if (/^https?:\/\//i.test(path)) return path;

  return `${getApiAssetBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

function toStoredImagePath(value?: string) {
  const image = value?.trim();
  if (!image) return "";

  const uploadPathIndex = image.indexOf("/uploads/");
  if (uploadPathIndex >= 0) return image.slice(uploadPathIndex);

  return image;
}

function AstrologerListImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  if (!resolvedSrc || failed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-mist bg-parchment text-xs font-semibold text-ink/45">
        NA
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-10 w-10 rounded-md border border-mist bg-parchment object-cover"
    />
  );
}

export function AstrologersModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [astrologers, setAstrologers] = useState<AstrologerRow[]>([]);
  const [draft, setDraft] = useState<AstrologerRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [liveStartTime, setLiveStartTime] = useState("");
  const [liveEndTime, setLiveEndTime] = useState("");
  const [formErrors, setFormErrors] = useState<AstrologerFormErrors>({});
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

  const loadAstrologers = useCallback(
    async (page: number, sortOrder = sortDirection) => {
      if (!accessToken) return;

      setLoading(true);
      snackbar.setPageLoading(true);

      try {
        const response = await adminAstrologerApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
          sort_order: sortOrder,
          date_from: appliedDateFilter.start || undefined,
          date_to: appliedDateFilter.end || undefined,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setAstrologers(records.map(mapAstrologerDto));
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
      } catch (err) {
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load astrologer list."
        );
      } finally {
        setLoading(false);
        snackbar.setPageLoading(false);
      }
    },
    [accessToken, appliedDateFilter, snackbar, sortDirection, tenant.id]
  );

  useEffect(() => {
    const fetchKey = JSON.stringify({
      module: "astrologers",
      tenantId: tenant.id,
      accessToken: accessToken || "",
      date: appliedDateFilter,
    });
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadAstrologers(1);
  }, [accessToken, appliedDateFilter, loadAstrologers, tenant.id]);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;
    adminAstrologerApi
      .statusDetails(tenant.id, accessToken)
      .then((response) => {
        if (!active) return;
        setLiveStartTime(response.data?.start_time?.slice(0, 5) || "");
        setLiveEndTime(response.data?.end_time?.slice(0, 5) || "");
      })
      .catch((err) => {
        if (!active) return;
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load astrologer live timing."
        );
      });

    return () => {
      active = false;
    };
  }, [accessToken, snackbar, tenant.id]);

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

  const saveLiveTiming = async () => {
    if (!accessToken || statusSaving) return;

    if (!liveStartTime || !liveEndTime) {
      snackbar.error("Start time and end time are required.");
      return;
    }

    setStatusSaving(true);
    snackbar.setPageLoading(true);
    try {
      await adminAstrologerApi.saveStatus(tenant.id, accessToken, {
        start_time: liveStartTime,
        end_time: liveEndTime,
      });
      snackbar.success("Astrologer live timing saved successfully.");
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to save astrologer live timing."
      );
    } finally {
      setStatusSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  const startCreate = () => {
    setFormErrors({});
    setDraft({
      id: 0,
      image: "",
      experience: "",
      languages: "",
      rating: 0,
      consultations: "0",
      status: "active",
      translations: createEmptyServiceTranslations().map((translation) => ({
        ...translation,
        expertise: "",
      })),
    });
  };

  const validateDraft = (currentDraft: AstrologerRow) => {
    const errors: AstrologerFormErrors = {};

    if (!currentDraft.experience.trim()) {
      errors.experience = "Experience is required.";
    }

    if (!cleanCommaValue(currentDraft.languages)) {
      errors.languages = "Languages are required.";
    }

    if (currentDraft.rating < 0) {
      errors.rating = "Rating cannot be negative.";
    }

    if (currentDraft.image.trim().startsWith("data:")) {
      errors.image = "Please upload image file instead of base64.";
    }

    if (!toText(currentDraft.consultations).trim()) {
      errors.consultations = "Consultations are required.";
    }

    const nameErrors = currentDraft.translations.reduce<Record<string, string>>(
      (current, translation) => {
        if (!translation.name.trim()) {
          current[translation.lang] = `${translation.label} astrologer name is required.`;
        }
        return current;
      },
      {}
    );

    if (Object.keys(nameErrors).length) errors.names = nameErrors;

    const expertiseErrors = currentDraft.translations.reduce<
      Record<string, string>
    >((current, translation) => {
      if (!cleanCommaValue(translation.expertise)) {
        current[translation.lang] = `${translation.label} expertise is required.`;
      }
      return current;
    }, {});

    if (Object.keys(expertiseErrors).length) {
      errors.expertise = expertiseErrors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveDraft = async () => {
    if (!draft || !accessToken) return;
    if (!validateDraft(draft)) return;

    const payload = {
      image: toStoredImagePath(draft.image),
      experience: draft.experience.trim(),
      languages: cleanCommaValue(draft.languages),
      rating: draft.rating,
      consultations: toText(draft.consultations).trim(),
      translations: toTranslationPayload(draft.translations),
    };

    setSaving(true);
    snackbar.setPageLoading(true);

    try {
      if (draft.id) {
        await adminAstrologerApi.update(tenant.id, accessToken, {
          id: draft.id,
          ...payload,
        });
        snackbar.success("Astrologer updated successfully.");
      } else {
        await adminAstrologerApi.create(tenant.id, accessToken, payload);
        snackbar.success("Astrologer created successfully.");
      }

      setDraft(null);
      await loadAstrologers(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to save astrologer."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  const deleteAstrologer = async (astrologerId: number) => {
    if (!accessToken) return;
    const confirmed = await snackbar.confirm({
      title: "Delete Astrologer",
      message: "Are you sure you want to delete this astrologer?",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    snackbar.setPageLoading(true);
    try {
      await adminAstrologerApi.remove(tenant.id, accessToken, {
        id: astrologerId,
      });
      snackbar.success("Astrologer deleted successfully.");
      await loadAstrologers(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete astrologer."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const toggleStatus = async (astrologer: AstrologerRow) => {
    if (!accessToken) return;

    snackbar.setPageLoading(true);
    try {
      await adminAstrologerApi.updateStatus(tenant.id, accessToken, {
        id: astrologer.id,
        status: astrologer.status === "active" ? 0 : 1,
      });
      snackbar.success("Astrologer status updated successfully.");
      await loadAstrologers(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to update astrologer status."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const uploadAstrologerImage = async (file: File | undefined) => {
    if (!draft || !file || !accessToken) return;

    if (!file.type.startsWith("image/")) {
      setFormErrors((current) => ({
        ...current,
        image: "Please upload a valid image file.",
      }));
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setFormErrors((current) => ({
        ...current,
        image: "Image size must be 1.5 MB or less.",
      }));
      return;
    }

    snackbar.setPageLoading(true);

    try {
      const response = await adminAstrologerApi.uploadImage(
        tenant.id,
        accessToken,
        file
      );
      const imagePath = response.data?.path || toStoredImagePath(response.data?.url);

      if (!imagePath) throw new Error("Image upload failed.");

      setFormErrors((current) => ({ ...current, image: undefined }));
      setDraft((currentDraft) =>
        currentDraft ? { ...currentDraft, image: imagePath } : currentDraft
      );
    } catch (err) {
      setFormErrors((current) => ({
        ...current,
        image:
          err instanceof ApiError
            ? err.message
            : "Unable to upload astrologer image.",
      }));
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Astrologers Module"
        createLabel="Create Astrologer"
        onCreate={startCreate}
        onList={() => loadAstrologers(currentPage)}
        onSort={() => {
          const nextDirection = sortDirection === "asc" ? "desc" : "asc";
          setSortDirection(nextDirection);
          loadAstrologers(1, nextDirection);
        }}
        sortDirection={sortDirection}
      />

      <div className="admin-filter-panel mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-10 items-center gap-2 rounded-md border border-mist bg-white px-3 text-xs font-semibold text-ink/65">
            <Clock3 size={14} />
            Live Time
          </span>
          <input
            type="time"
            value={liveStartTime}
            onChange={(event) => setLiveStartTime(event.target.value)}
            className="h-10 rounded-md border border-mist bg-white px-3 text-sm text-ink outline-none transition focus:border-gold"
            aria-label="Astrologer live start time"
          />
          <input
            type="time"
            value={liveEndTime}
            onChange={(event) => setLiveEndTime(event.target.value)}
            className="h-10 rounded-md border border-mist bg-white px-3 text-sm text-ink outline-none transition focus:border-gold"
            aria-label="Astrologer live end time"
          />
          <button
            type="button"
            onClick={saveLiveTiming}
            disabled={statusSaving}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-mist bg-white text-ink/60 transition hover:border-gold hover:bg-gold/10 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            title="Save live timing"
            aria-label="Save live timing"
          >
            {statusSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
          </button>
        </div>
        <DateRangeFilter
          value={dateFilter}
          onChange={setDateFilter}
          onApply={applyDateFilter}
          onClear={clearDateFilter}
          hasValue={Boolean(appliedDateFilter.start || appliedDateFilter.end)}
        />
        <button
          type="button"
          onClick={() => applyDateFilter()}
          className="admin-create-button"
          title="Search"
          aria-label="Search"
        >
          <Search size={14} />
        </button>
      </div>

      <div data-admin-list className="mt-4 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <ListPanelHeader
          title="Astrologer Listing"
          totalRecords={totalRecords}
          createLabel="Create Astrologer"
          onCreate={startCreate}
          onList={() => loadAstrologers(currentPage)}
          onSort={() => {
            const nextDirection = sortDirection === "asc" ? "desc" : "asc";
            setSortDirection(nextDirection);
            loadAstrologers(1, nextDirection);
          }}
          sortDirection={sortDirection}
          loading={loading}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-20 px-4 py-2.5 font-semibold">ID</th>
                <th className="w-24 px-4 py-2.5 font-semibold">Image</th>
                <th className="w-44 px-4 py-2.5 font-semibold">Created Date</th>
                <th className="w-52 px-4 py-2.5 font-semibold">Name</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Experience</th>
                <th className="px-4 py-2.5 font-semibold">Expertise</th>
                <th className="px-4 py-2.5 font-semibold">Languages</th>
                <th className="w-28 px-4 py-2.5 font-semibold">Rating</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Consultations</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-40 px-4 py-2.5 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {astrologers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-5">
                    <EmptyListState
                      loading={loading}
                      message="No astrologers yet. Create the first astrologer."
                    />
                  </td>
                </tr>
              ) : (
                astrologers.map((astrologer) => {
                  const english = getEnglishTranslation(
                    syncAstrologerTranslations(astrologer).translations
                  );

                  return (
                    <tr
                      key={astrologer.id}
                      className="text-sm transition hover:bg-parchment/55"
                    >
                      <td data-label="ID" className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                        #{astrologer.id.toString().padStart(3, "0")}
                      </td>
                      <td data-label="Image" className="px-4 py-2.5">
                        <AstrologerListImage
                          src={astrologer.image}
                          alt={english?.name || "Astrologer"}
                        />
                      </td>
                      <td data-label="Created Date" className="px-4 py-2.5 text-ink/60">
                        {formatAdminDate(astrologer.createdAt)}
                      </td>
                      <td data-label="Name" className="px-4 py-2.5 font-medium text-ink">
                        {english?.name || "Untitled astrologer"}
                      </td>
                      <td data-label="Experience" className="px-4 py-2.5 text-ink/60">
                        {astrologer.experience}
                      </td>
                      <td data-label="Expertise" className="px-4 py-2.5 text-ink/60">
                        <span className="line-clamp-1">
                          {english?.expertise || "No expertise"}
                        </span>
                      </td>
                      <td data-label="Languages" className="px-4 py-2.5 text-ink/60">
                        <span className="line-clamp-1">
                          {astrologer.languages}
                        </span>
                      </td>
                      <td data-label="Rating" className="px-4 py-2.5 text-ink/60">
                        {astrologer.rating}
                      </td>
                      <td data-label="Consultations" className="px-4 py-2.5 text-ink/60">
                        {astrologer.consultations}
                      </td>
                      <td data-label="Status" className="px-4 py-2.5">
                        <StatusBadge status={astrologer.status} />
                      </td>
                      <td data-label="Actions" className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormErrors({});
                              setDraft(syncAstrologerTranslations(astrologer));
                            }}
                            className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            aria-label="Edit astrologer"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(astrologer)}
                            className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                            aria-label="Toggle astrologer status"
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAstrologer(astrologer.id)}
                            className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                            aria-label="Delete astrologer"
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
        onPageChange={(page) => loadAstrologers(page)}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
                  Astrologer Details
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {draft.id ? "Edit Astrologer" : "Create Astrologer"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close astrologer form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-136px)] overflow-y-auto p-5">
              <div className="mb-5 rounded-lg border border-mist bg-parchment p-4">
                <FileUpload
                  value={resolveAssetUrl(draft.image)}
                  accept="image/*"
                  title="Choose a file or drag & drop it here"
                  helperText="JPEG, PNG, WEBP, and GIF formats, up to 1.5MB"
                  buttonLabel="Browse File"
                  previewAlt="Astrologer preview"
                  onFileSelect={uploadAstrologerImage}
                  onClear={() => {
                    setFormErrors((current) => ({
                      ...current,
                      image: undefined,
                    }));
                    setDraft({ ...draft, image: "" });
                  }}
                />
                {formErrors.image && (
                  <p className="mt-2 text-xs text-red-600">
                    {formErrors.image}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <label className="block text-sm font-medium text-ink">
                  Experience <span className="text-red-500">*</span>
                  <input
                    type="text"
                    value={draft.experience}
                    onChange={(event) => {
                      setFormErrors((current) => ({
                        ...current,
                        experience: undefined,
                      }));
                      setDraft({ ...draft, experience: event.target.value });
                    }}
                    className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                    placeholder="8 years"
                  />
                  {formErrors.experience && (
                    <p className="mt-2 text-xs text-red-600">
                      {formErrors.experience}
                    </p>
                  )}
                </label>

                <label className="block text-sm font-medium text-ink">
                  Languages <span className="text-red-500">*</span>
                  <input
                    type="text"
                    value={draft.languages}
                    onChange={(event) => {
                      setFormErrors((current) => ({
                        ...current,
                        languages: undefined,
                      }));
                      setDraft({ ...draft, languages: event.target.value });
                    }}
                    className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                    placeholder="Hindi, English"
                  />
                  {formErrors.languages && (
                    <p className="mt-2 text-xs text-red-600">
                      {formErrors.languages}
                    </p>
                  )}
                </label>

                <label className="block text-sm font-medium text-ink">
                  Rating
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={draft.rating}
                    onChange={(event) => {
                      setFormErrors((current) => ({
                        ...current,
                        rating: undefined,
                      }));
                      setDraft({
                        ...draft,
                        rating: Number(event.target.value),
                      });
                    }}
                    className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                    placeholder="4.9"
                  />
                  {formErrors.rating && (
                    <p className="mt-2 text-xs text-red-600">
                      {formErrors.rating}
                    </p>
                  )}
                </label>

                <label className="block text-sm font-medium text-ink">
                  Consultations <span className="text-red-500">*</span>
                  <input
                    type="text"
                    value={draft.consultations}
                    onChange={(event) => {
                      setFormErrors((current) => ({
                        ...current,
                        consultations: undefined,
                      }));
                      setDraft({
                        ...draft,
                        consultations: event.target.value,
                      });
                    }}
                    className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                    placeholder="1000+"
                  />
                  {formErrors.consultations && (
                    <p className="mt-2 text-xs text-red-600">
                      {formErrors.consultations}
                    </p>
                  )}
                </label>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Language Content
                  </h3>
                  <p className="mt-1 text-xs text-ink/55">
                    Add language-wise name, expertise, and description.
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
                      Name <span className="text-red-500">*</span>
                      <input
                        type="text"
                        value={translation.name}
                        onChange={(event) => {
                          const translations = [...draft.translations];
                          translations[index] = {
                            ...translation,
                            name: event.target.value,
                          };
                          setFormErrors((current) => ({
                            ...current,
                            names: {
                              ...current.names,
                              [translation.lang]: "",
                            },
                          }));
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
                      Expertise <span className="text-red-500">*</span>
                      <input
                        type="text"
                        value={translation.expertise}
                        onChange={(event) => {
                          const translations = [...draft.translations];
                          translations[index] = {
                            ...translation,
                            expertise: event.target.value,
                          };
                          setFormErrors((current) => ({
                            ...current,
                            expertise: {
                              ...current.expertise,
                              [translation.lang]: "",
                            },
                          }));
                          setDraft({ ...draft, translations });
                        }}
                        className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                        placeholder="Vedic, Tarot, Numerology"
                      />
                      {formErrors.expertise?.[translation.lang] && (
                        <p className="mt-2 text-xs text-red-600">
                          {formErrors.expertise[translation.lang]}
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
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : "Save Astrologer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
