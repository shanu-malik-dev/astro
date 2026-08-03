"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Section, SectionHeading } from "@/components/ui/Section";
import { FullPageLoader } from "@/components/ui/FullPageLoader";
import { SiteSnackbar } from "@/components/ui/SiteSnackbar";
import { openBookEnquiryModal } from "@/lib/book-enquiry-modal";
import { useLanguage } from "@/lib/language-context";
import { useTenant } from "@/lib/tenant-context";
import { adminServiceApi, ApiError, type ServiceDto } from "@/lib/api";
import { WEBSITE_MODULE_FLAGS } from "@/lib/visibility-flags";
import { DisabledRouteRedirect } from "@/components/DisabledRouteRedirect";

const PAGE_SIZE = 10;

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

export default function ServicesPage() {
  const { language, t } = useLanguage();
  const { tenant } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbar, setSnackbar] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-services", tenant.id],
    queryFn: () => adminServiceApi.publicList(tenant.id),
  });
  const services = useMemo(() => data?.data || [], [data?.data]);
  const totalPages = Math.max(1, Math.ceil(services.length / PAGE_SIZE));
  const paginatedServices = services.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (!isError) return;
    setSnackbar(
      error instanceof ApiError ? error.message : "Unable to load services."
    );
  }, [error, isError]);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  if (!WEBSITE_MODULE_FLAGS.services) return <DisabledRouteRedirect />;

  return (
    <>
      {/* Hero */}
      <Section tone="dark" className="!py-6 md:!py-8">
        <p className="eyebrow-on-dark">{t("servicesPage.eyebrow")}</p>

        <h1 className="mt-3 max-w-2xl text-3xl leading-tight md:text-4xl">
          {t("servicesPage.title")}
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-parchment/70 md:text-base">
          {t("servicesPage.description")}
        </p>
      </Section>

      {/* Services */}
      <Section className="content-section">
        {isLoading && <FullPageLoader message={t("common.actions.pleaseWait")} />}
        <SiteSnackbar message={snackbar} onClose={() => setSnackbar("")} />
        {!isLoading && !isError && services.length === 0 && (
          <p className="text-sm text-ink/50">No services available.</p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedServices.map((service, index) => {
            const localized = getLocalizedService(service, language);
            const visual = serviceVisuals[index % serviceVisuals.length];
            const Icon = visual.Icon;

            return (
              <div
                key={service.id}
                className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-lg border border-gold/25 bg-white p-6 shadow-[0_14px_40px_rgba(20,19,31,0.08)] transition duration-300 hover:-translate-y-1 hover:border-gold/80 hover:shadow-[0_22px_54px_rgba(176,138,46,0.2)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-wine via-gold to-indigo opacity-85" />
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${visual.glow} transition group-hover:scale-110`}
                />

                <div className="relative">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${visual.wrap} shadow-sm ring-1 ring-white/75`}
                  >
                    <Icon className={`h-7 w-7 ${visual.icon}`} />
                  </div>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
                    Service
                  </p>

                  <h2 className="mt-2 line-clamp-2 text-2xl leading-tight text-ink">
                    {localized.name}
                  </h2>

                  <p className="mt-4 line-clamp-4 text-sm leading-7 text-ink/60">
                    {localized.description}
                  </p>
                </div>

                <div className="relative mt-8 border-t border-mist/80 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      openBookEnquiryModal({
                        concern: {
                          value: service.id,
                          label: localized.name,
                        },
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-md bg-wine px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-wine-light"
                  >
                    {t("common.actions.bookConsultation")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {services.length > PAGE_SIZE && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="rounded-md border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("servicesPage.pagination.previous")}
          </button>

          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={
                  page === currentPage
                    ? "rounded-md border border-gold bg-gold px-4 py-2 text-sm font-medium text-black"
                    : "rounded-md border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink"
                }
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="rounded-md border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("servicesPage.pagination.next")}
          </button>
        </div>
        )}
      </Section>

      {/* CTA */}
      <Section className="content-section">
        <SectionHeading
          eyebrow={t("servicesPage.ctaEyebrow")}
          title={t("servicesPage.ctaTitle")}
          description={t("servicesPage.ctaDescription")}
        />

        <button
          type="button"
          onClick={() => openBookEnquiryModal()}
          className="btn-primary mt-8 inline-flex"
        >
          {t("common.actions.bookConsultation")}
        </button>
      </Section>
    </>
  );
}
