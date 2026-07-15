'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { Container } from '@/components/ui/Container';
import { useTenant } from '@/lib/tenant-context';
import { useAuth } from '@/lib/auth-context';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/astrologers', label: 'Astrologer' }
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { tenant, setTenantId } = useTenant();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-mist bg-parchment/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="font-display text-2xl italic text-ink">
          AstroNova<span className="text-gold not-italic">.</span>
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
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href={user ? '/account' : '/login'} className="text-[13px] uppercase tracking-[0.12em] text-ink/70 hover:text-ink">
            {user ? 'My Account' : 'Log In'}
          </Link>
          {/* <Link href="/book" className="btn-primary">
            Book Consultation
          </Link> */}
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
                {link.label}
              </Link>
            ))}
            <Link href={user ? '/account' : '/login'} onClick={() => setOpen(false)} className="py-2.5 text-sm uppercase tracking-wide text-ink/80 hairline">
              {user ? 'My Account' : 'Log In'}
            </Link>
            <Link href="/book" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">
              Book Consultation
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}
