"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import CustomSelect, { SelectOption } from "../ui/CustomSelect";
import { useCountryCodes } from "@/lib/country-code-store";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";

const concernKeys = [
  "love",
  "career",
  "marriage",
  "finance",
  "family",
  "health",
  "other",
];

export function Hero() {
  const { countryCodes } = useCountryCodes();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [countryCode, setCountryCode] = useState<SelectOption | null>(null);

  const [concern, setConcern] = useState<SelectOption | null>(null);

  const [loading, setLoading] = useState(false);
  const concerns: SelectOption[] = concernKeys.map((key) => ({
    value: key,
    label: t(`home.hero.concerns.${key}`),
  }));
  const selectedConcern = concern
    ? concerns.find((option) => option.value === concern.value) || null
    : null;

  useEffect(() => {
    if (!countryCode && countryCodes.length > 0) {
      setCountryCode(countryCodes[0]);
    }
  }, [countryCode, countryCodes]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert(t("common.validation.nameRequired"));
      return;
    }

    if (!countryCode) {
      alert(t("common.validation.countryRequired"));
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert(t("common.validation.phoneInvalid"));
      return;
    }

    if (!concern) {
      alert(t("common.validation.concernRequired"));
      return;
    }

    setLoading(true);

    const formData = {
      name,
      phone: countryCode.value + phone,
      concern: concern.value,
    };

    console.log(formData);

    // ==========================
    // API CALL
    // ==========================
    // await fetch("/api/consultation", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(formData),
    // });

    setTimeout(() => {
      alert(t("home.hero.success"));

      setName("");
      setPhone("");
      setConcern(null);
      setCountryCode(null);

      setLoading(false);
    }, 1000);
  };

  return (
    <section className="relative overflow-hidden bg-ink text-parchment">
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
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
              />

              <div className="flex flex-col gap-3 sm:flex-row">

                <div className="w-full sm:w-28">
                  <CustomSelect
                    options={countryCodes}
                    value={countryCode}
                    onChange={(option) => {
                      if (option) setCountryCode(option);
                    }}
                  />
                </div>

                <input
                  type="tel"
                  placeholder={t("common.fields.phoneNumber")}
                  value={phone}
                  maxLength={10}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, ""))
                  }
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
                />
              </div>

              <CustomSelect
                options={concerns}
                value={selectedConcern}
                placeholder={t("home.hero.concernPlaceholder")}
                onChange={(option) => setConcern(option)}
              />

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
    </section>
  );
}
