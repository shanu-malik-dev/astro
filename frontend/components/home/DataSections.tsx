'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  ArrowRight,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Gem,
  Heart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { FullPageLoader } from '@/components/ui/FullPageLoader';
import { SiteSnackbar } from '@/components/ui/SiteSnackbar';
import { openBookEnquiryModal } from '@/lib/book-enquiry-modal';
import { useTenant } from '@/lib/tenant-context';
import { servicesApi, testimonialsApi, blogApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

function EmptyState({ message }: { message: string }) {
  return <p className="mt-10 text-sm text-ink/50">{message}</p>;
}

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
    Icon: Sparkles,
    wrap: "from-parchment via-white to-gold/25",
    icon: "text-gold-dark",
    glow: "bg-gold/15",
  },
];

export function ServicesGrid({ limit }: { limit?: number }) {
  const { tenant, formatMoney } = useTenant();
  const { t } = useLanguage();
  const [snackbar, setSnackbar] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ['services', tenant.id],
    queryFn: () => servicesApi.listPublic(tenant.id),
  });

  const services = limit ? data?.slice(0, limit) : data;

  useEffect(() => {
    if (!isError) return;
    setSnackbar(t("home.dataSections.services.error"));
  }, [isError, t]);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  return (
    <Section className="content-section">
      <SectionHeading
        eyebrow={t("home.dataSections.services.eyebrow")}
        title={t("home.dataSections.services.title")}
        description={t("home.dataSections.services.description")}
      />

      {isLoading && <FullPageLoader message={t("home.dataSections.services.loading")} />}
      <SiteSnackbar message={snackbar} onClose={() => setSnackbar("")} />

      {services && services.length > 0 && (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map((service, index) => {
            const visual = serviceVisuals[index % serviceVisuals.length];
            const Icon = visual.Icon;

            return (
              <div
                key={service.id}
                className="group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-lg border border-gold/25 bg-white p-6 shadow-[0_14px_40px_rgba(20,19,31,0.08)] transition duration-300 hover:-translate-y-1 hover:border-gold/80 hover:shadow-[0_22px_54px_rgba(176,138,46,0.2)]"
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

                  {service.category && (
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
                      {service.category}
                    </p>
                  )}

                  <h3 className="mt-3 line-clamp-2 text-xl leading-tight text-ink">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/60">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="relative mt-8 flex items-end justify-between gap-4 border-t border-mist/80 pt-5">
                  {(service.price !== undefined || service.durationMinutes !== undefined) && (
                    <div>
                      {service.price !== undefined && (
                        <p className="font-display text-2xl text-ink">{formatMoney(service.price)}</p>
                      )}
                      {service.durationMinutes !== undefined && (
                        <p className="text-xs uppercase tracking-wide text-ink/40">{service.durationMinutes} {t("home.dataSections.services.minutes")}</p>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      openBookEnquiryModal({
                        concern: {
                          value: service.id,
                          label: service.name,
                        },
                      })
                    }
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-wine px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-wine-light"
                  >
                    {t("common.actions.book")} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.length === 0 && <EmptyState message={t("home.dataSections.services.empty")} />}
    </Section>
  );
}

export function TestimonialsCarousel() {
  const { tenant } = useTenant();
  const { t } = useLanguage();
  const [snackbar, setSnackbar] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ['testimonials', tenant.id],
    queryFn: () => testimonialsApi.listApproved(tenant.id),
  });

  useEffect(() => {
    if (!isError) return;
    setSnackbar(t("home.dataSections.testimonials.error"));
  }, [isError, t]);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  return (
    <Section tone="dark">
      <SectionHeading tone="dark" eyebrow={t("home.dataSections.testimonials.eyebrow")} title={t("home.dataSections.testimonials.title")} align="center" />

      {isLoading && <FullPageLoader message={t("home.dataSections.testimonials.loading")} />}
      <SiteSnackbar message={snackbar} onClose={() => setSnackbar("")} />

      {data && data.length > 0 && (
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {data.slice(0, 3).map((t) => (
            <figure key={t.id} className="border border-white/10 p-7">
              <div className="flex gap-1 text-gold">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-parchment/80">"{t.message}"</blockquote>
              <figcaption className="mt-5 text-xs uppercase tracking-[0.14em] text-parchment/50">{t.customerName}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
}

export function BlogTeaser() {
  const { tenant } = useTenant();
  const { t } = useLanguage();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog-latest', tenant.id],
    queryFn: () => blogApi.listPublished(tenant.id),
  });

  if (isLoading) return <FullPageLoader message={t("common.actions.pleaseWait")} />;
  if (isError || !data || data.length === 0) return null;

  return (
    <Section className="content-section">
      <div className="flex items-end justify-between">
        <SectionHeading eyebrow={t("home.dataSections.blog.eyebrow")} title={t("home.dataSections.blog.title")} />
        <Link href="/blog" className="hidden text-sm uppercase tracking-[0.12em] text-wine md:block">
          {t("home.dataSections.blog.viewAll")}
        </Link>
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {data.slice(0, 3).map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group">
            {post.category && <p className="eyebrow">{post.category}</p>}
            <h3 className="mt-3 text-lg leading-snug text-ink group-hover:text-wine">{post.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </Section>
  );
}
