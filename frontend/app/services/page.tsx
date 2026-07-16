"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { useLanguage } from "@/lib/language-context";

const PAGE_SIZE = 3;

const services = [
  { id: 1, key: "love" },
  { id: 2, key: "career" },
  { id: 3, key: "marriage" },
  { id: 4, key: "finance" },
  { id: 5, key: "health" },
  { id: 6, key: "family" },
];

export default function ServicesPage() {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(services.length / PAGE_SIZE);
  const paginatedServices = services.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <>
      {/* Hero */}
      <Section tone="dark" className="py-10 md:py-12">
        <p className="eyebrow-on-dark">{t("servicesPage.eyebrow")}</p>

        <h1 className="mt-3 max-w-2xl text-3xl leading-tight md:text-4xl">
          {t("servicesPage.title")}
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-parchment/70 md:text-base">
          {t("servicesPage.description")}
        </p>
      </Section>

      {/* Services */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col justify-between rounded-xl border border-mist bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <p className="eyebrow">{t(`servicesPage.items.${service.key}.category`)}</p>

                <h2 className="mt-3 text-2xl text-ink">
                  {t(`servicesPage.items.${service.key}.name`)}
                </h2>

                <p className="mt-4 text-sm leading-7 text-ink/60">
                  {t(`servicesPage.items.${service.key}.description`)}
                </p>
              </div>

              <div className="mt-8 border-t border-mist pt-6">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 text-wine font-medium hover:underline"
                >
                  {t("common.actions.bookConsultation")}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

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
      </Section>

      {/* CTA */}
      <Section tone="dim">
        <SectionHeading
          eyebrow={t("servicesPage.ctaEyebrow")}
          title={t("servicesPage.ctaTitle")}
          description={t("servicesPage.ctaDescription")}
        />

        <Link
          href="/book"
          className="btn-primary mt-8 inline-flex"
        >
          {t("common.actions.bookConsultation")}
        </Link>
      </Section>
    </>
  );
}
