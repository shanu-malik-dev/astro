'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { useLanguage } from '@/lib/language-context';

const COLUMNS = [
  {
    titleKey: 'footer.columns.explore',
    links: [
      { href: '/about', labelKey: 'footer.links.about' },
      { href: '/services', labelKey: 'footer.links.services' }
    ],
  },
  {
    titleKey: 'footer.columns.support',
    links: [
      { href: '/faq', labelKey: 'footer.links.faq' },
      { href: '/contact', labelKey: 'footer.links.contact' },
      { href: '/account', labelKey: 'footer.links.myBookings' },
    ],
  },
  {
    titleKey: 'footer.columns.legal',
    links: [
      { href: '/privacy', labelKey: 'footer.links.privacy' },
      { href: '/terms', labelKey: 'footer.links.terms' },
      { href: '/refund-policy', labelKey: 'footer.links.refund' },
    ],
  },
];

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-ink text-parchment">
      <Container className="grid grid-cols-2 gap-6 py-8 md:grid-cols-5 md:py-10">
        <div className="col-span-2">
          <p className="font-display text-2xl italic">
            AstroNova<span className="text-gold not-italic">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-parchment/60">
            {t("footer.description")}
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.titleKey}>
            <p className="eyebrow-on-dark">{t(col.titleKey)}</p>
            <ul className="mt-3 space-y-1.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-parchment/70 hover:text-parchment">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="hairline-dark">
        <Container className="flex flex-col items-center justify-between gap-2 py-3 text-xs text-parchment/40 md:flex-row">
          <p>© {new Date().getFullYear()} AstroNova. {t("footer.rights")}</p>
          <p>{t("footer.meta")}</p>
        </Container>
      </div>
    </footer>
  );
}
