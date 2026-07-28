"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import CustomSelect, { type SelectOption } from "@/components/ui/CustomSelect";
import { FullPageLoader } from "@/components/ui/FullPageLoader";
import { ApiError, enquiryApi, problemApi, type ProblemDropdownOptionDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BOOK_ENQUIRY_EVENT } from "@/lib/book-enquiry-modal";
import { useCountryCodes } from "@/lib/country-code-store";
import { useLanguage } from "@/lib/language-context";
import { getMobileMaxLength, validateMobileNumber } from "@/lib/mobile-validation";
import { useTenant } from "@/lib/tenant-context";

type FormErrors = {
  name?: string;
  countryCode?: string;
  phone?: string;
  problem?: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export function BookEnquiryModal() {
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState<SelectOption | null>(null);
  const [problem, setProblem] = useState<SelectOption | null>(null);
  const [problems, setProblems] = useState<ProblemDropdownOptionDto[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<ToastState>(null);

  const problemOptions = useMemo<SelectOption[]>(
    () =>
      problems.map((item) => ({
        value: String(item.value),
        label: language === "hi" ? item.hi_label : item.en_label,
      })),
    [language, problems]
  );
  const selectedProblem = problem
    ? problemOptions.find((option) => option.value === problem.value) || null
    : null;
  const maxMobileLength = getMobileMaxLength(countryCode?.value || "");

  useEffect(() => {
    const openModal = () => setOpen(true);
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const url = new URL(anchor.href);
      if (url.origin === window.location.origin && url.pathname === "/book") {
        event.preventDefault();
        event.stopPropagation();
        openModal();
      }
    };

    window.addEventListener(BOOK_ENQUIRY_EVENT, openModal);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener(BOOK_ENQUIRY_EVENT, openModal);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    if (!open || problems.length > 0) return;

    let active = true;
    async function loadProblems() {
      setProblemsLoading(true);
      try {
        const response = await problemApi.dropdown(tenant.id);
        if (active) setProblems(response.data || []);
      } catch (err) {
        if (!active) return;
        setToast({
          type: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Unable to load problem list.",
        });
      } finally {
        if (active) setProblemsLoading(false);
      }
    }

    loadProblems();
    return () => {
      active = false;
    };
  }, [open, problems.length, tenant.id]);

  useEffect(() => {
    if (!countryCode && countryCodes.length > 0) {
      setCountryCode(countryCodes[0]);
    }
  }, [countryCode, countryCodes]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) nextErrors.name = t("common.validation.nameRequired");
    if (!countryCode) nextErrors.countryCode = t("common.validation.countryRequired");

    if (!phone.trim()) {
      nextErrors.phone = t("common.validation.phoneInvalid");
    } else if (countryCode) {
      const validation = validateMobileNumber(countryCode.value, phone, language);
      if (!validation.valid) nextErrors.phone = validation.message;
    }

    if (!problem) nextErrors.problem = t("common.validation.concernRequired");

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setProblem(null);
    setErrors({});
  };

  const submitEnquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm() || !countryCode || !problem) return;

    setLoading(true);
    try {
      const customerId = Number(user?.id);
      const response = await enquiryApi.create(tenant.id, {
        ...(Number.isFinite(customerId) && customerId > 0
          ? { customer_id: customerId }
          : {}),
        customer_name: name.trim(),
        country_code: countryCode.value,
        mobile: phone,
        problem_id: Number(problem.value),
        problem_name: selectedProblem?.label || problem.label,
      });

      setToast({
        type: "success",
        message: response.message || t("home.hero.success"),
      });
      resetForm();
      setOpen(false);
    } catch (err) {
      setToast({
        type: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Unable to book consultation.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/60 px-4 py-6 backdrop-blur-sm">
          {(countryCodesLoading || problemsLoading || loading) && (
            <FullPageLoader
              message={loading ? t("common.actions.booking") : t("common.actions.pleaseWait")}
            />
          )}

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#151521] text-parchment shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-2xl font-serif">{t("home.hero.formTitle")}</h2>
                <p className="mt-1 text-sm text-parchment/60">
                  {t("home.hero.formDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 p-2 text-parchment/60 hover:text-parchment"
                aria-label="Close enquiry form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitEnquiry} className="space-y-4 p-5">
              <input
                type="text"
                placeholder={t("common.fields.name")}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
              />
              {errors.name && <p className="-mt-2 text-xs text-red-300">{errors.name}</p>}

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="w-full sm:w-28">
                  <CustomSelect
                    options={countryCodes}
                    value={countryCode}
                    onChange={(option) => {
                      if (option) setCountryCode(option);
                      setPhone("");
                      setErrors((current) => ({
                        ...current,
                        countryCode: undefined,
                        phone: undefined,
                      }));
                    }}
                  />
                </div>
                <input
                  type="tel"
                  placeholder={t("common.fields.phoneNumber")}
                  value={phone}
                  maxLength={maxMobileLength}
                  onChange={(event) => {
                    setPhone(
                      event.target.value.replace(/\D/g, "").slice(0, maxMobileLength)
                    );
                    setErrors((current) => ({ ...current, phone: undefined }));
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
                />
              </div>
              {(errors.countryCode || errors.phone) && (
                <p className="-mt-2 text-xs text-red-300">
                  {errors.countryCode || errors.phone}
                </p>
              )}

              <CustomSelect
                options={problemOptions}
                value={selectedProblem}
                placeholder={t("home.hero.concernPlaceholder")}
                onChange={(option) => {
                  setProblem(option);
                  setErrors((current) => ({ ...current, problem: undefined }));
                }}
              />
              {errors.problem && <p className="-mt-2 text-xs text-red-300">{errors.problem}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gold px-5 py-3 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? t("common.actions.booking")
                  : t("common.actions.bookConsultation")}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-6 top-6 z-[120] max-w-sm rounded-lg border border-white/10 bg-[#151521] px-4 py-3 text-sm text-parchment shadow-2xl">
          <p className={toast.type === "success" ? "text-green-200" : "text-red-200"}>
            {toast.message}
          </p>
        </div>
      )}
    </>
  );
}
