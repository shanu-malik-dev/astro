"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

const SERVICES = [
  {
    key: "love",
    icon: "❤️",
  },
  {
    key: "career",
    icon: "💼",
  },
  {
    key: "marriage",
    icon: "💍",
  },
  {
    key: "finance",
    icon: "💰",
  },
  {
    key: "health",
    icon: "🩺",
  },
];

export function ServicesBar() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-mist bg-parchment">
      <div className="mx-auto max-w-container px-6 py-12 md:px-10">
        {/* Heading */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="eyebrow">{t("home.servicesBar.eyebrow")}</p>
            <h2 className="mt-2 font-display text-3xl text-ink">
              {t("home.servicesBar.title")}
            </h2>
          </div>

          <Link
            href="/services"
            className="text-sm font-medium text-wine transition hover:underline"
          >
            {t("home.servicesBar.seeMore")}
          </Link>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {SERVICES.map((service) => (
            <div
              key={service.key}
              className="rounded-xl border border-mist bg-white p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">{service.icon}</div>

              <h3 className="mt-4 text-lg font-semibold text-ink">
                {t(`home.servicesBar.items.${service.key}.title`)}
              </h3>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                {t(`home.servicesBar.items.${service.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
