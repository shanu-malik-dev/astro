'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, Menu, UserCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { Container } from '@/components/ui/Container';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import { BRAND, getBrandName } from '@/lib/brand';
import { ADMIN_MODULE_FLAGS } from '@/lib/feature-flags';
import { useAuth } from '@/lib/auth-context';
import { openBookEnquiryModal } from '@/lib/book-enquiry-modal';
import { AppLanguage, LANGUAGE_OPTIONS, useLanguage } from '@/lib/language-context';
import { WEBSITE_MODULE_FLAGS } from '@/lib/visibility-flags';

const NAV_LINKS = [
  { href: '/about', labelKey: 'header.nav.about', enabled: WEBSITE_MODULE_FLAGS.about },
  { href: '/services', labelKey: 'header.nav.services', enabled: WEBSITE_MODULE_FLAGS.services },
  { href: '/astrologers', labelKey: 'header.nav.astrologer', enabled: WEBSITE_MODULE_FLAGS.astrologers }
].filter((link) => link.enabled);

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const brandName = getBrandName(language);
  const selectedLanguage =
    LANGUAGE_OPTIONS.find((option) => option.value === language) || LANGUAGE_OPTIONS[0];
  const userName = user?.fullName || user?.name || user?.mobile || t('header.userFallback');

  const onLanguageChange = (option: SelectOption | null) => {
    if (option?.value === 'en' || option?.value === 'hi') {
      setLanguage(option.value as AppLanguage);
    }
  };

  const onLogout = async () => {
    await logout();
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-mist bg-parchment/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          {BRAND.logoPath && (
            <img
              src={BRAND.logoPath}
              alt={brandName}
              className="h-10 w-10 rounded-full object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span className="font-display text-xl font-semibold italic leading-tight md:text-2xl">
            {brandName}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'relative py-1 text-[13px] uppercase tracking-[0.12em] text-ink/70 transition-colors hover:text-ink',
                pathname === link.href && 'text-ink after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:bg-gold',
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <CustomSelect
            instanceId="desktop-language-select"
            options={LANGUAGE_OPTIONS}
            value={selectedLanguage}
            onChange={onLanguageChange}
            variant="light"
            className="w-36"
          />
          {user ? (
            <div className="flex items-center gap-3 text-[13px] uppercase tracking-[0.12em] text-ink/70">
              <span className="flex max-w-44 items-center gap-2 truncate" title={userName}>
                <UserCircle size={18} className="shrink-0 text-gold" />
                <span className="truncate">{userName}</span>
              </span>
              <button
                type="button"
                onClick={onLogout}
                aria-label={t('common.actions.logout')}
                className="rounded-full p-2 text-ink/65 transition hover:bg-gold/10 hover:text-wine"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : ADMIN_MODULE_FLAGS.login ? (
            <Link href="/login" className="flex items-center gap-2 text-[13px] uppercase tracking-[0.12em] text-ink/70 hover:text-ink">
              <LogIn size={18} className="text-gold" />
              <span>{t('common.actions.login')}</span>
            </Link>
          ) : null}
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-mist bg-parchment lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm uppercase tracking-wide text-ink/80 hairline first:border-t-0"
              >
                {t(link.labelKey)}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center justify-between py-2.5 text-sm uppercase tracking-wide text-ink/80 hairline">
                <span className="flex min-w-0 items-center gap-2">
                  <UserCircle size={18} className="shrink-0 text-gold" />
                  <span className="truncate">{userName}</span>
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label={t('common.actions.logout')}
                  className="rounded-full p-2 text-ink/65 transition hover:bg-gold/10 hover:text-wine"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : ADMIN_MODULE_FLAGS.login ? (
              <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2.5 text-sm uppercase tracking-wide text-ink/80 hairline">
                <LogIn size={18} className="text-gold" />
                <span>{t('common.actions.login')}</span>
              </Link>
            ) : null}
            <CustomSelect
              instanceId="mobile-language-select"
              options={LANGUAGE_OPTIONS}
              value={selectedLanguage}
              onChange={onLanguageChange}
              variant="light"
              className="mt-2"
            />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openBookEnquiryModal();
              }}
              className="btn-primary mt-3 w-full"
            >
              {t('header.nav.bookConsultation')}
            </button>
          </Container>
        </div>
      )}
    </header>
  );
}
