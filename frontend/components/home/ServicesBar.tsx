"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Gem,
  Heart,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { adminServiceApi, type ServiceDto } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useTenant } from "@/lib/tenant-context";

const serviceVisuals: {
  Icon: LucideIcon;
  wrap: string;
  icon: string;
  glow: string;
}[] = [
  {
    Icon: Heart,
    wrap: "from-rose-100 via-white to-gold/20",
    icon: "text-wine",
    glow: "bg-wine/10",
  },
  {
    Icon: BriefcaseBusiness,
    wrap: "from-sky-100 via-white to-gold/20",
    icon: "text-indigo",
    glow: "bg-indigo/10",
  },
  {
    Icon: Gem,
    wrap: "from-amber-100 via-white to-rose-100",
    icon: "text-gold-dark",
    glow: "bg-gold/15",
  },
  {
    Icon: BadgeIndianRupee,
    wrap: "from-emerald-100 via-white to-gold/20",
    icon: "text-emerald-700",
    glow: "bg-emerald-100",
  },
  {
    Icon: Stethoscope,
    wrap: "from-cyan-100 via-white to-parchment",
    icon: "text-cyan-700",
    glow: "bg-cyan-100",
  },
  {
    Icon: Sparkles,
    wrap: "from-parchment via-white to-gold/25",
    icon: "text-gold-dark",
    glow: "bg-gold/15",
  },
];

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
            className="inline-flex items-center gap-2 rounded-md border border-gold/40 px-3 py-2 text-sm font-semibold text-wine transition hover:border-gold hover:bg-gold/10"
          >
            {t("home.servicesBar.seeMore")}
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Services Grid */}
        {!isLoading && !isError && services.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {services.map((service, index) => {
              const localized = getLocalizedService(service, language);
              const visual = serviceVisuals[index % serviceVisuals.length];
              const Icon = visual.Icon;

              return (
                <div
                  key={service.id}
                  className="group relative min-h-[250px] overflow-hidden rounded-lg border border-gold/25 bg-white p-5 shadow-[0_12px_34px_rgba(20,19,31,0.08)] transition duration-300 hover:-translate-y-1 hover:border-gold/80 hover:shadow-[0_20px_46px_rgba(176,138,46,0.2)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-wine via-gold to-indigo opacity-80" />
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${visual.glow} transition group-hover:scale-110`}
                  />

                  <div
                    className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${visual.wrap} shadow-sm ring-1 ring-white/75`}
                  >
                    <Icon className={`h-7 w-7 ${visual.icon}`} />
                  </div>

                  <h3 className="relative mt-5 line-clamp-2 text-center text-lg font-semibold leading-6 text-ink">
                    {localized.name}
                  </h3>

                  <p className="relative mt-3 line-clamp-3 text-center text-sm leading-6 text-ink/60">
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
