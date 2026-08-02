"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
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
          {paginatedServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col justify-between rounded-lg border border-mist bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <p className="eyebrow">Service</p>

                <h2 className="mt-3 text-2xl text-ink">
                  {getLocalizedService(service, language).name}
                </h2>

                <p className="mt-4 text-sm leading-7 text-ink/60">
                  {getLocalizedService(service, language).description}
                </p>
              </div>

              <div className="mt-8 border-t border-mist pt-6">
                <button
                  type="button"
                  onClick={() =>
                    openBookEnquiryModal({
                      concern: {
                        value: service.id,
                        label: getLocalizedService(service, language).name,
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 text-wine font-medium hover:underline"
                >
                  {t("common.actions.bookConsultation")}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
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
