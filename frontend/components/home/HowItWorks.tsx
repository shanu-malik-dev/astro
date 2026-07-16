'use client';

import { Section, SectionHeading } from '@/components/ui/Section';
import { useLanguage } from '@/lib/language-context';

const STEPS = [
  { n: '01', key: 'choose' },
  { n: '02', key: 'time' },
  { n: '03', key: 'details' },
  { n: '04', key: 'pay' },
  { n: '05', key: 'meet' },
];

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <Section tone="dim">
      <SectionHeading eyebrow={t("home.howItWorks.eyebrow")} title={t("home.howItWorks.title")} align="center" />
      <div className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-5">
        {STEPS.map((step) => (
          <div key={step.n} className="relative">
            <p className="font-display text-4xl text-gold/50">{step.n}</p>
            <p className="mt-3 font-medium text-ink">{t(`home.howItWorks.steps.${step.key}.title`)}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{t(`home.howItWorks.steps.${step.key}.body`)}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
