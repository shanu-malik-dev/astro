'use client';

import Link from 'next/link';
import { Section, SectionHeading } from '@/components/ui/Section';
import { useLanguage } from '@/lib/language-context';

const FAQS = [
  'accurate',
  'birthTime',
  'reschedule',
];

export function FaqTeaser() {
  const { t } = useLanguage();

  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow={t("home.faq.eyebrow")} title={t("home.faq.title")} />
        <div>
          {FAQS.map((key) => (
            <details key={key} className="group hairline py-5 first:border-t-0">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-ink">
                {t(`home.faq.items.${key}.question`)}
                <span className="ml-4 text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/60">{t(`home.faq.items.${key}.answer`)}</p>
            </details>
          ))}
          <Link href="/faq" className="mt-6 inline-block text-sm uppercase tracking-[0.14em] text-wine underline underline-offset-4">
            {t("home.faq.allQuestions")}
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function CtaBand() {
  const { t } = useLanguage();

  return (
    <Section tone="dark" className="text-center">
      <p className="eyebrow-on-dark">{t("home.cta.eyebrow")}</p>
      <h2 className="mx-auto mt-5 max-w-xl text-3xl md:text-4xl">
        {t("home.cta.title")}
      </h2>
      <Link href="/book" className="btn-gold mt-9 inline-flex">
        {t("home.cta.button")}
      </Link>
    </Section>
  );
}
