'use client';

import Link from 'next/link';
import { Section, SectionHeading } from '@/components/ui/Section';
import { useLanguage } from '@/lib/language-context';

const ITEMS = ['prepared', 'thread'];

export function AboutTeaser() {
  const { t } = useLanguage();

  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <SectionHeading
          eyebrow={t("home.aboutTeaser.eyebrow")}
          title={t("home.aboutTeaser.title")}
          description={t("home.aboutTeaser.description")}
        />
        <div className="hairline pt-8 lg:border-t-0 lg:pt-0">
          <ul className="space-y-6">
            {ITEMS.map((key) => (
              <li key={key} className="flex gap-4">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <div>
                  <p className="font-medium text-ink">{t(`home.aboutTeaser.items.${key}.title`)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">{t(`home.aboutTeaser.items.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/about" className="mt-8 inline-block text-sm uppercase tracking-[0.14em] text-wine underline underline-offset-4">
            {t("home.aboutTeaser.link")}
          </Link>
        </div>
      </div>
    </Section>
  );
}
