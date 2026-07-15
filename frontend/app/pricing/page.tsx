'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { useTenant } from '@/lib/tenant-context';
import { servicesApi } from '@/lib/api';

const INCLUDED = [
  'Chart reviewed before your session',
  'Live video consultation via Google Meet',
  'Written summary added to your account',
  'One free reschedule up to 12 hours ahead',
];

export default function PricingPage() {
  const { tenant, formatMoney } = useTenant();
  const { data, isLoading } = useQuery({
    queryKey: ['services', tenant.id],
    queryFn: () => servicesApi.listPublic(tenant.id),
  });

  return (
    <>
      <Section tone="dark" className="pb-14 pt-20 text-center">
        <p className="eyebrow-on-dark">Pricing</p>
        <h1 className="mx-auto mt-5 max-w-xl text-4xl leading-tight md:text-5xl">
          Priced by depth, not disguised with tiers.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-parchment/60">
          Shown in {tenant.currency} for {tenant.country}. Switch regions from the header to see local pricing.
        </p>
      </Section>

      <Section>
        {isLoading && <p className="text-sm text-ink/50">Loading pricing…</p>}
        {data && data.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {data.map((service, i) => (
              <div
                key={service.id}
                className={`flex flex-col justify-between border p-8 ${i === 1 ? 'border-gold' : 'border-mist'}`}
              >
                <div>
                  {i === 1 && <p className="eyebrow mb-3">Most booked</p>}
                  <h2 className="text-xl text-ink">{service.name}</h2>
                  <p className="mt-2 font-display text-3xl text-ink">{formatMoney(service.price)}</p>
                  <p className="text-xs uppercase tracking-wide text-ink/40">{service.durationMinutes} minutes</p>
                  {service.description && <p className="mt-4 text-sm leading-relaxed text-ink/60">{service.description}</p>}
                </div>
                <Link href={`/book?service=${service.id}`} className={`mt-8 ${i === 1 ? 'btn-gold' : 'btn-secondary'}`}>
                  Book This
                </Link>
              </div>
            ))}
          </div>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-ink/50">Pricing will be published here shortly.</p>
        )}
      </Section>

      <Section tone="dim">
        <SectionHeading eyebrow="Every booking includes" title="What's built into each session" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-ink/70">
              <Check size={16} className="text-gold" /> {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section className="text-center">
        <SectionHeading
          align="center"
          eyebrow="Ongoing guidance"
          title="Looking for a multi-session package?"
          description="Relationship and business packages spanning multiple sessions are arranged directly — reach out and we'll put one together."
        />
        <Link href="/contact" className="btn-primary mt-8 inline-flex">
          Contact Us
        </Link>
      </Section>
    </>
  );
}
