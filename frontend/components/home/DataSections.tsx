'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Star, ArrowRight } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { FullPageLoader } from '@/components/ui/FullPageLoader';
import { useTenant } from '@/lib/tenant-context';
import { servicesApi, testimonialsApi, blogApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

function EmptyState({ message }: { message: string }) {
  return <p className="mt-10 text-sm text-ink/50">{message}</p>;
}

export function ServicesGrid({ limit }: { limit?: number }) {
  const { tenant, formatMoney } = useTenant();
  const { t } = useLanguage();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['services', tenant.id],
    queryFn: () => servicesApi.listPublic(tenant.id),
  });

  const services = limit ? data?.slice(0, limit) : data;

  return (
    <Section>
      <SectionHeading
        eyebrow={t("home.dataSections.services.eyebrow")}
        title={t("home.dataSections.services.title")}
        description={t("home.dataSections.services.description")}
      />

      {isLoading && <FullPageLoader message={t("home.dataSections.services.loading")} />}
      {isError && <EmptyState message={t("home.dataSections.services.error")} />}

      {services && services.length > 0 && (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="group flex flex-col justify-between border border-mist bg-parchment p-7 transition-colors hover:border-gold">
              <div>
                {service.category && <p className="eyebrow">{service.category}</p>}
                <h3 className="mt-3 text-xl text-ink">{service.name}</h3>
                {service.description && <p className="mt-2 text-sm leading-relaxed text-ink/60">{service.description}</p>}
              </div>
              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="font-display text-2xl text-ink">{formatMoney(service.price)}</p>
                  <p className="text-xs uppercase tracking-wide text-ink/40">{service.durationMinutes} {t("home.dataSections.services.minutes")}</p>
                </div>
                <Link
                  href={`/book?service=${service.id}`}
                  className="flex items-center gap-1 text-sm text-wine opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {t("common.actions.book")} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.length === 0 && <EmptyState message={t("home.dataSections.services.empty")} />}
    </Section>
  );
}

export function TestimonialsCarousel() {
  const { tenant } = useTenant();
  const { t } = useLanguage();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['testimonials', tenant.id],
    queryFn: () => testimonialsApi.listApproved(tenant.id),
  });

  return (
    <Section tone="dark">
      <SectionHeading tone="dark" eyebrow={t("home.dataSections.testimonials.eyebrow")} title={t("home.dataSections.testimonials.title")} align="center" />

      {isLoading && <FullPageLoader message={t("home.dataSections.testimonials.loading")} />}
      {isError && <p className="mt-10 text-center text-sm text-parchment/50">{t("home.dataSections.testimonials.error")}</p>}

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
    <Section tone="dim">
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
