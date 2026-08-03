'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { BRAND, getBrandName } from '@/lib/brand';
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
      // { href: '/faq', labelKey: 'footer.links.faq' },
      { href: '/contact', labelKey: 'footer.links.contact' },
      // { href: '/account', labelKey: 'footer.links.myBookings' },
    ],
  },
  {
    titleKey: 'footer.columns.legal',
    links: [
      { href: '/privacy', labelKey: 'footer.links.privacy' },
      { href: '/terms', labelKey: 'footer.links.terms' },
      // { href: '/refund-policy', labelKey: 'footer.links.refund' },
    ],
  },
];

export function Footer() {
  const { language, t } = useLanguage();
  const brandName = getBrandName(language);

  return (
    <footer className="bg-ink text-parchment">
      <Container className="grid grid-cols-3 gap-x-4 gap-y-3 py-4 md:grid-cols-5 md:gap-6 md:py-10">
        <div className="col-span-3 md:col-span-2">
          <p className="flex items-center gap-2 font-display text-base font-semibold italic md:gap-2.5 md:text-2xl">
            {BRAND.logoPath && (
              <img
                src={BRAND.logoPath}
                alt={brandName}
                className="h-7 w-7 rounded-full object-contain md:h-10 md:w-10"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span>{brandName}</span>
          </p>
          <p className="mt-1.5 line-clamp-2 max-w-sm text-[11px] leading-4 text-parchment/60 md:mt-3 md:line-clamp-none md:max-w-xs md:text-sm md:leading-relaxed">
            {t("footer.description")}
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.titleKey}>
            <p className="eyebrow-on-dark">{t(col.titleKey)}</p>
            <ul className="mt-1.5 space-y-0.5 md:mt-3 md:space-y-1.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[11px] leading-5 text-parchment/70 hover:text-parchment md:text-sm">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="hairline-dark">
        <Container className="flex items-center justify-center py-1.5 text-center text-[10px] leading-4 text-parchment/40 md:justify-between md:py-3 md:text-xs">
          <p>© {new Date().getFullYear()} {brandName}. {t("footer.rights")}</p>
          <p className="hidden md:block">{t("footer.meta")}</p>
        </Container>
      </div>
    </footer>
  );
}
