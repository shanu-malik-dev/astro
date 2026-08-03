import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { ApiError, siteContentApi, type SiteContentValues } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { useAdminSnackbar } from "../AdminSnackbar";
import { ModuleHeader } from "../shared";

const defaultValues: SiteContentValues = {
  "contact.email": "",
  "social.facebook": "",
  "social.instagram": "",
  "social.youtube": "",
  "legal.terms.updated": "",
  "legal.terms.content": "",
  "legal.privacy.updated": "",
  "legal.privacy.content": "",
};

const contactFields = [
  { key: "contact.email", label: "Email", placeholder: "contact@example.com" },
  { key: "social.facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "social.instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "social.youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
] as const;

const reservedKeys = new Set(Object.keys(defaultValues));
const keyPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

type ContentTab = "contact" | "legal";

export function ContentModule() {
  const { accessToken } = useAuth();
  const { tenant } = useTenant();
  const snackbar = useAdminSnackbar();
  const [activeTab, setActiveTab] = useState<ContentTab>("contact");
  const [values, setValues] = useState<SiteContentValues>(defaultValues);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const tabs = useMemo(
    () => [
      { key: "contact" as const, label: "Contact" },
      { key: "legal" as const, label: "T&C and Privacy Policy" },
    ],
    []
  );

  const loadContent = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    snackbar.setPageLoading(true);
    try {
      const response = await siteContentApi.admin(tenant.id, accessToken);
      setValues({ ...defaultValues, ...(response.data || {}) });
    } catch (error) {
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to load content."
      );
    } finally {
      setLoading(false);
      snackbar.setPageLoading(false);
    }
  }, [accessToken, snackbar, tenant.id]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const customContactKeys = useMemo(
    () =>
      Object.keys(values)
        .filter((key) => !reservedKeys.has(key))
        .sort((a, b) => a.localeCompare(b)),
    [values]
  );

  const addCustomKey = () => {
    const key = newKey.trim().toLowerCase();

    if (!keyPattern.test(key)) {
      snackbar.error("Use key format like social.linkedin or contact.phone.");
      return;
    }

    if (values[key] !== undefined) {
      snackbar.error("This key already exists.");
      return;
    }

    setValues((current) => ({ ...current, [key]: newValue.trim() }));
    setNewKey("");
    setNewValue("");
  };

  const removeCustomKey = (key: string) => {
    setValues((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const saveContent = async () => {
    if (!accessToken) return;

    setSaving(true);
    snackbar.setPageLoading(true);
    try {
      const response = await siteContentApi.save(tenant.id, accessToken, values);
      setValues({ ...defaultValues, ...(response.data || {}) });
      snackbar.success("Content saved successfully.");
    } catch (error) {
      snackbar.error(
        error instanceof ApiError ? error.message : "Unable to save content."
      );
    } finally {
      setSaving(false);
      snackbar.setPageLoading(false);
    }
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Admin"
        title="Content Module"
        createLabel="Save Content"
        onCreate={saveContent}
        onList={loadContent}
      />

      <div className="mt-4 rounded-lg border border-mist bg-white shadow-sm">
        <div className="border-b border-mist px-5 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
            Website Content
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Manage Contact and Legal Pages
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-mist bg-parchment px-4 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
                  : "rounded-md border border-mist bg-white px-4 py-2 text-sm font-medium text-ink/65 transition hover:border-gold hover:text-ink"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "contact" && (
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                {contactFields.map((field) => (
                  <label key={field.key} className="block text-sm font-medium text-ink">
                    {field.label}
                    <input
                      type={field.key === "contact.email" ? "email" : "url"}
                      value={values[field.key] || ""}
                      onChange={(event) => updateValue(field.key, event.target.value)}
                      className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                      placeholder={field.placeholder}
                    />
                  </label>
                ))}
              </div>

              <div className="rounded-lg border border-mist bg-parchment p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-[220px] flex-1 text-sm font-medium text-ink">
                    New Key
                    <input
                      type="text"
                      value={newKey}
                      onChange={(event) => setNewKey(event.target.value)}
                      className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                      placeholder="social.linkedin"
                    />
                  </label>
                  <label className="min-w-[260px] flex-[1.4] text-sm font-medium text-ink">
                    Value
                    <input
                      type="text"
                      value={newValue}
                      onChange={(event) => setNewValue(event.target.value)}
                      className="mt-2 w-full rounded-md border border-mist bg-white px-3 py-2 outline-none focus:border-gold"
                      placeholder="https://..."
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addCustomKey}
                    className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white"
                  >
                    <Plus size={16} />
                    Add Key
                  </button>
                </div>

                {customContactKeys.length > 0 && (
                  <div className="mt-4 grid gap-3">
                    {customContactKeys.map((key) => (
                      <div
                        key={key}
                        className="grid gap-3 rounded-md border border-mist bg-white p-3 md:grid-cols-[220px_1fr_auto]"
                      >
                        <input
                          type="text"
                          value={key}
                          readOnly
                          className="rounded-md border border-mist bg-parchment px-3 py-2 text-sm text-ink/70"
                        />
                        <input
                          type="text"
                          value={values[key] || ""}
                          onChange={(event) => updateValue(key, event.target.value)}
                          className="rounded-md border border-mist bg-parchment px-3 py-2 text-sm outline-none focus:border-gold"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomKey(key)}
                          className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-red-600 transition hover:bg-red-50"
                          aria-label={`Remove ${key}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "legal" && (
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-ink">
                  T&C Last Updated
                  <input
                    type="text"
                    value={values["legal.terms.updated"] || ""}
                    onChange={(event) =>
                      updateValue("legal.terms.updated", event.target.value)
                    }
                    className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                    placeholder="July 2026"
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Privacy Last Updated
                  <input
                    type="text"
                    value={values["legal.privacy.updated"] || ""}
                    onChange={(event) =>
                      updateValue("legal.privacy.updated", event.target.value)
                    }
                    className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                    placeholder="July 2026"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-ink">
                T&C Content
                <textarea
                  rows={10}
                  value={values["legal.terms.content"] || ""}
                  onChange={(event) =>
                    updateValue("legal.terms.content", event.target.value)
                  }
                  className="mt-2 w-full resize-y rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                  placeholder="Use ## Heading for section headings."
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Privacy Policy Content
                <textarea
                  rows={10}
                  value={values["legal.privacy.content"] || ""}
                  onChange={(event) =>
                    updateValue("legal.privacy.content", event.target.value)
                  }
                  className="mt-2 w-full resize-y rounded-md border border-mist bg-parchment px-3 py-2 outline-none focus:border-gold"
                  placeholder="Use ## Heading for section headings."
                />
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveContent}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save Content"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
