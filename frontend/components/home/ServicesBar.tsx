"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminServiceApi, type ServiceDto } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useTenant } from "@/lib/tenant-context";

const SERVICE_ICONS = ["❤️", "💼", "💍", "💰", "🩺"];

function getLocalizedService(service: ServiceDto, language: string) {
  const translation = service.all_names?.find(
    (item) => item.label.toLowerCase() === language
  );

  return {
    name:
      translation?.value ||
      (language === "hi" ? service.hi_label : service.en_label) ||
      service.name,
    description: translation?.description || service.description || "",
  };
}

export function ServicesBar() {
  const { language, t } = useLanguage();
  const { tenant } = useTenant();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-services-bar", tenant.id],
    queryFn: () => adminServiceApi.publicList(tenant.id),
  });
  const services = useMemo(() => (data?.data || []).slice(0, 5), [data?.data]);

  return (
    <section className="content-section border-b border-mist">
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
        {!isLoading && !isError && services.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {services.map((service, index) => {
            const localized = getLocalizedService(service, language);

            return (
            <div
              key={service.id}
              className="rounded-lg border border-mist bg-white p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">{SERVICE_ICONS[index] || "✨"}</div>

              <h3 className="mt-4 text-lg font-semibold text-ink">
                {localized.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                {localized.description}
              </p>
            </div>
            );
          })}
          </div>
        )}
      </div>
    </section>
  );
}
