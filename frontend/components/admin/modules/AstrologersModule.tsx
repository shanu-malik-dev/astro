import { useCallback, useEffect, useRef, useState } from "react";
import { Edit3, Loader2, Power, Save, Trash2, X } from "lucide-react";
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
import { ModuleHeader, Pagination, StatusBadge } from "../shared";
import type { AstrologerRow, AstrologerTranslation } from "../types";

type AstrologerFormErrors = {
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
  const [formErrors, setFormErrors] = useState<AstrologerFormErrors>({});
  const lastFetchKeyRef = useRef("");

  const loadAstrologers = useCallback(
    async (page: number) => {
      if (!accessToken) return;

      setLoading(true);
      snackbar.setPageLoading(true);

      try {
        const response = await adminAstrologerApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
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
    [accessToken, snackbar, tenant.id]
  );

  useEffect(() => {
    const fetchKey = `astrologers:1:${tenant.id}:${accessToken || ""}`;
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;
    loadAstrologers(1);
  }, [accessToken, loadAstrologers, tenant.id]);

  const startCreate = () => {
    setFormErrors({});
    setDraft({
      id: 0,
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

    if (!currentDraft.consultations.trim()) {
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
      experience: draft.experience.trim(),
      languages: cleanCommaValue(draft.languages),
      rating: draft.rating,
      consultations: draft.consultations.trim(),
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

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Astrologers Module"
        createLabel="Create Astrologer"
        onCreate={startCreate}
      />

      <div className="mt-5 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-mist bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Astrologer Listing
            </h2>
            <p className="text-[11px] text-ink/50">
              {totalRecords} total records
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-ink/50">
              <Loader2 size={14} className="animate-spin" />
              Loading
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-20 px-4 py-2.5 font-semibold">ID</th>
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
                  <td colSpan={9} className="px-4 py-5 text-sm text-ink/50">
                    {loading
                      ? "Loading astrologers..."
                      : "No astrologers yet. Create the first astrologer."}
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
                      <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                        #{astrologer.id.toString().padStart(3, "0")}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-ink">
                        {english?.name || "Untitled astrologer"}
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        {astrologer.experience}
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        <span className="line-clamp-1">
                          {english?.expertise || "No expertise"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        <span className="line-clamp-1">
                          {astrologer.languages}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        {astrologer.rating}
                      </td>
                      <td className="px-4 py-2.5 text-ink/60">
                        {astrologer.consultations}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={astrologer.status} />
                      </td>
                      <td className="px-4 py-2.5">
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
