import { useCallback, useEffect, useState } from "react";
import { Edit3, Eye, Loader2, Power, Save, Trash2, X } from "lucide-react";
import { ApiError, problemApi, type ProblemDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { PAGE_SIZE } from "../constants";
import { createEmptyTranslations, syncTranslations } from "../helpers";
import { ModuleHeader, Pagination, StatusBadge } from "../shared";
import type { Problem, Translation } from "../types";

type ProblemFormErrors = {
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

function mapProblemDto(problem: ProblemDto): Problem {
  const translations =
    problem.all_names?.map((item) => ({
      lang: labelToLangCode(item.label),
      label: labelToName(item.label),
      name: item.value || "",
    })) || [];

  return syncTranslations({
    id: Number(problem.id),
    displayOrder: Number(problem.display_order || 1),
    status: Number(problem.status) === 1 ? "active" : "inactive",
    translations,
  });
}

function toTranslationPayload(translations: Translation[]) {
  return translations
    .filter((translation) => translation.name.trim())
    .map((translation) => ({
      lang_code: translation.lang,
      name: translation.name.trim(),
    }));
}

export function ProblemModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [draft, setDraft] = useState<Problem | null>(null);
  const [viewingProblem, setViewingProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<ProblemFormErrors>({});

  const loadProblems = useCallback(
    async (page: number) => {
      if (!accessToken) return;

      setLoading(true);
      snackbar.setPageLoading(true);

      try {
        const response = await problemApi.list(tenant.id, accessToken, {
          page,
          limit: PAGE_SIZE,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setProblems(records.map(mapProblemDto));
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
        setTotalRecords(pagination?.total || records.length);
      } catch (err) {
        snackbar.error(
          err instanceof ApiError
            ? err.message
            : "Unable to load problem list."
        );
      } finally {
        setLoading(false);
        snackbar.setPageLoading(false);
      }
    },
    [accessToken, snackbar, tenant.id]
  );

  useEffect(() => {
    loadProblems(1);
  }, [loadProblems]);

  const startCreate = () => {
    setFormErrors({});
    setDraft({
      id: 0,
      displayOrder: totalRecords + 1,
      status: "active",
      translations: createEmptyTranslations(),
    });
  };

  const startEdit = (problem: Problem) => {
    setFormErrors({});
    setDraft(syncTranslations(problem));
  };

  const validateDraft = (currentDraft: Problem) => {
    const errors: ProblemFormErrors = {};
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
          current[translation.lang] = `${translation.label} name is required.`;
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
        await problemApi.update(tenant.id, accessToken, {
          id: draft.id,
          display_order: draft.displayOrder,
          translations,
        });
        snackbar.success("Problem updated successfully.");
      } else {
        await problemApi.create(tenant.id, accessToken, {
          display_order: draft.displayOrder,
          translations,
        });
        snackbar.success("Problem created successfully.");
      }

      setDraft(null);
      await loadProblems(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to save problem."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  const deleteProblem = async (problemId: number) => {
    if (!accessToken) return;
    const confirmed = await snackbar.confirm({
      title: "Delete Problem",
      message: "Are you sure you want to delete this problem?",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    snackbar.setPageLoading(true);
    try {
      await problemApi.remove(tenant.id, accessToken, { id: problemId });
      snackbar.success("Problem deleted successfully.");
      await loadProblems(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete problem."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  const toggleStatus = async (problem: Problem) => {
    if (!accessToken) return;

    snackbar.setPageLoading(true);
    try {
      await problemApi.updateStatus(tenant.id, accessToken, {
        id: problem.id,
        status: problem.status === "active" ? 0 : 1,
      });
      snackbar.success("Problem status updated successfully.");
      await loadProblems(currentPage);
    } catch (err) {
      snackbar.error(
        err instanceof ApiError
          ? err.message
          : "Unable to update problem status."
      );
    } finally {
      snackbar.setPageLoading(false);
    }
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Problem Module"
        onCreate={startCreate}
        createLabel="Create Problem"
      />

      <div className="mt-5 overflow-hidden rounded-lg border border-mist bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-mist bg-white px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Problem Listing</h2>
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
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-parchment">
              <tr className="border-b border-mist text-[11px] uppercase tracking-wide text-ink/55">
                <th className="w-20 px-4 py-2.5 font-semibold">ID</th>
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="w-32 px-4 py-2.5 font-semibold">Status</th>
                <th className="w-44 px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-mist">
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-5 text-sm text-ink/50">
                    {loading ? "Loading problems..." : "No problems yet. Create the first problem."}
                  </td>
                </tr>
              ) : (
                problems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="text-sm transition hover:bg-parchment/55"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink/45">
                      #{problem.id.toString().padStart(3, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-ink">
                        {problem.translations.find((item) => item.lang === "en")?.name ||
                          "Untitled problem"}
                      </p>
                      <p className="text-[11px] text-ink/45">
                        Order {problem.displayOrder}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={problem.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingProblem(syncTranslations(problem))}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="View problem names"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(problem)}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="Edit problem"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(problem)}
                          className="rounded-md border border-mist bg-white p-1.5 text-ink/65 transition hover:border-gold hover:bg-gold/10 hover:text-ink"
                          aria-label="Toggle problem status"
                        >
                          <Power size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProblem(problem.id)}
                          className="rounded-md border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"
                          aria-label="Delete problem"
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
        onPageChange={(page) => loadProblems(page)}
      />

      {draft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Problem Details</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {draft.id ? "Edit Problem" : "Create Problem"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close problem form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-76px)] overflow-y-auto">
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
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-ink">Problem Names</h3>
                        <p className="mt-1 text-sm leading-6 text-ink/55">
                          Add language-wise names. Currently English and Hindi are enabled.
                        </p>
                      </div>
                      <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-dark">
                        {draft.translations.length} Languages
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {draft.translations.map((translation, index) => (
                        <label
                          key={translation.lang}
                          className="rounded-lg border border-mist bg-parchment p-4 text-sm font-medium text-ink"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>
                              Name {translation.label}
                              {translation.lang === "en" && (
                                <span className="text-red-500"> *</span>
                              )}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase text-ink/45">
                              {translation.lang}
                            </span>
                          </span>
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
                            placeholder={`Enter ${translation.label} name`}
                            className="mt-3 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                          />
                          {formErrors.names?.[translation.lang] && (
                            <p className="mt-2 text-xs text-red-600">
                              {formErrors.names[translation.lang]}
                            </p>
                          )}
                        </label>
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
                  {saving ? "Saving..." : "Save Problem"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingProblem && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-mist bg-parchment px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">Problem Names</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  {viewingProblem.translations.find((item) => item.lang === "en")?.name || "Untitled problem"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingProblem(null)}
                className="rounded-md border border-mist p-2 text-ink/60 hover:text-ink"
                aria-label="Close problem names"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {viewingProblem.translations.map((translation) => (
                <div
                  key={translation.lang}
                  className="rounded-md border border-mist bg-parchment p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      Name {translation.label}
                    </p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase text-ink/45">
                      {translation.lang}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">
                    {translation.name || "Not added"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
