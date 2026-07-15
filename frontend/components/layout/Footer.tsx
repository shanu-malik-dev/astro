import Link from 'next/link';
import { Container } from '@/components/ui/Container';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { href: '/about', label: 'About' },
      { href: '/services', label: 'Services' }
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/contact', label: 'Contact' },
      { href: '/account', label: 'My Bookings' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/refund-policy', label: 'Refund Policy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-parchment">
      <Container className="grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
        <div className="col-span-2">
          <p className="font-display text-2xl italic">
            AstroNova<span className="text-gold not-italic">.</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-parchment/60">
            Considered astrology consultations for the questions that matter — love, career,
            business, and the paths between them.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow-on-dark">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-parchment/70 hover:text-parchment">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="hairline-dark">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-parchment/40 md:flex-row">
          <p>© {new Date().getFullYear()} AstroNova. All rights reserved.</p>
          <p>Consultations conducted via Google Meet · Payments secured by Stripe</p>
        </Container>
      </div>
    </footer>
  );
}
