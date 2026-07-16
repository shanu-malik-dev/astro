'use client';

import { Section, SectionHeading } from '@/components/ui/Section';
import { ConstellationLine } from '@/components/ui/ConstellationLine';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <>
      <Section tone="dark" className="py-10 md:py-12">
        <p className="eyebrow-on-dark">{t("about.eyebrow")}</p>
        <h1 className="mt-3 max-w-2xl text-3xl leading-tight md:text-4xl">
          {t("about.title")}
        </h1>
        <ConstellationLine className="mt-6 h-auto w-full max-w-xs" variant="gold" />
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-2">
          <div className="space-y-5 text-[15px] leading-relaxed text-ink/70">
            <p>
              {t("about.paragraph1")}
            </p>
            <p>
              {t("about.paragraph2")}
            </p>
            <p>
              {t("about.paragraph3")}
            </p>
          </div>
          <div className="space-y-6 hairline pt-8 lg:border-t-0 lg:pt-0 lg:pl-10 lg:border-l lg:border-mist">
            <div>
              <p className="eyebrow">{t("about.whoTitle")}</p>
              <p className="mt-2 text-[15px] text-ink/70">
                {t("about.whoBody")}
              </p>
            </div>
            <div>
              <p className="eyebrow">{t("about.sessionsTitle")}</p>
              <p className="mt-2 text-[15px] text-ink/70">
                {t("about.sessionsBody")}
              </p>
            </div>
            <div>
              <p className="eyebrow">{t("about.whereTitle")}</p>
              <p className="mt-2 text-[15px] text-ink/70">
                {t("about.whereBody")}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="dim" className="text-center">
        <SectionHeading align="center" eyebrow={t("about.ctaEyebrow")} title={t("about.ctaTitle")} />
        <Link href="/services" className="btn-primary mt-8 inline-flex">
          {t("about.ctaButton")}
        </Link>
      </Section>
    </>
  );
}
