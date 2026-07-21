"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import CustomSelect, { SelectOption } from "../ui/CustomSelect";
import { FullPageLoader } from "@/components/ui/FullPageLoader";
import { useCountryCodes } from "@/lib/country-code-store";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { ApiError, enquiryApi, problemApi, type ProblemDropdownOptionDto } from "@/lib/api";
import { getMobileMaxLength, validateMobileNumber } from "@/lib/mobile-validation";

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

export function Hero() {
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [problems, setProblems] = useState<ProblemDropdownOptionDto[]>([]);

  const [countryCode, setCountryCode] = useState<SelectOption | null>(null);

  const [problem, setProblem] = useState<SelectOption | null>(null);

  const [loading, setLoading] = useState(false);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<ToastState>(null);
  const problemOptions: SelectOption[] = problems.map((item) => ({
    value: String(item.value),
    label: language === "hi" ? item.hi_label : item.en_label,
  }));
  const selectedProblem = problem
    ? problemOptions.find((option) => option.value === problem.value) || null
    : null;
  const maxMobileLength = getMobileMaxLength(countryCode?.value || "");

  useEffect(() => {
    if (!countryCode && countryCodes.length > 0) {
      setCountryCode(countryCodes[0]);
    }
  }, [countryCode, countryCodes]);

  useEffect(() => {
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
  }, [tenant.id]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = t("common.validation.nameRequired");
    }

    if (!countryCode) {
      nextErrors.countryCode = t("common.validation.countryRequired");
    }

    if (!phone.trim()) {
      nextErrors.phone = t("common.validation.phoneInvalid");
    } else if (countryCode) {
      const validation = validateMobileNumber(countryCode.value, phone, language);
      if (!validation.valid) nextErrors.phone = validation.message;
    }

    if (!problem) {
      nextErrors.problem = t("common.validation.concernRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      setName("");
      setPhone("");
      setProblem(null);
      setCountryCode(null);
      setErrors({});
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
    <section className="relative overflow-hidden bg-ink text-parchment">
      {(countryCodesLoading || problemsLoading || loading) && (
        <FullPageLoader
          message={loading ? t("common.actions.booking") : t("common.actions.pleaseWait")}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-grain" />

      <Container className={user ? "relative py-12 sm:py-16 lg:py-20" : "relative grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-20"}>

        {/* LEFT */}
        <div className={user ? "max-w-3xl" : undefined}>
          <p className="eyebrow-on-dark">
            {t("home.hero.eyebrow")}
          </p>

          <h1 className="mt-6 text-4xl leading-tight sm:text-5xl lg:text-7xl lg:leading-[1.05]">
            {t("home.hero.titleLine1")}
            <br />
            {t("home.hero.titleLine2")}
            <br />
            {t("home.hero.titleLine3")}
            <span className="text-gold-light italic">
              {" "}
              {t("home.hero.titleAccent")}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-parchment/70 sm:text-lg sm:leading-8">
            {t("home.hero.description")}
          </p>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-parchment/70">
            <div>{t("home.hero.stats.consultations")}</div>
            <div>{t("home.hero.stats.private")}</div>
            <div>{t("home.hero.stats.video")}</div>
          </div>
        </div>

        {/* RIGHT */}
        {!user && (
        <div className="mx-auto w-full max-w-md">

          <div className="rounded-2xl border border-white/10 bg-[#151521]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">

            <h3 className="text-2xl font-serif">
              {t("home.hero.formTitle")}
            </h3>

            <p className="mt-2 text-sm text-parchment/60">
              {t("home.hero.formDescription")}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >

              <input
                type="text"
                placeholder={t("common.fields.name")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
              />
              {errors.name && (
                <p className="-mt-2 text-xs text-red-300">{errors.name}</p>
              )}

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
                  {errors.countryCode && (
                    <p className="mt-2 text-xs text-red-300">
                      {errors.countryCode}
                    </p>
                  )}
                </div>

                <input
                  type="tel"
                  placeholder={t("common.fields.phoneNumber")}
                  value={phone}
                  maxLength={maxMobileLength}
                  onChange={(e) => {
                    setPhone(
                      e.target.value.replace(/\D/g, "").slice(0, maxMobileLength)
                    );
                    setErrors((current) => ({ ...current, phone: undefined }));
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
                />
              </div>
              {errors.phone && (
                <p className="-mt-2 text-xs text-red-300">{errors.phone}</p>
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
              {errors.problem && (
                <p className="-mt-2 text-xs text-red-300">{errors.problem}</p>
              )}

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

            <div className="mt-5 flex justify-between text-xs text-parchment/50">
              <span>{t("home.hero.trust.private")}</span>
              <span>{t("home.hero.trust.trusted")}</span>
              <span>{t("home.hero.trust.online")}</span>
            </div>

          </div>

        </div>
        )}

      </Container>

      {toast && (
        <div className="fixed right-6 top-6 z-[100] max-w-sm rounded-lg border border-white/10 bg-[#151521] px-4 py-3 text-sm text-parchment shadow-2xl">
          <p
            className={
              toast.type === "success" ? "text-green-200" : "text-red-200"
            }
          >
            {toast.message}
          </p>
        </div>
      )}
    </section>
  );
}
