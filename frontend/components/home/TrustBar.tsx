'use client';

import { useLanguage } from '@/lib/language-context';

const STATS = [
  { value: '4.9/5', labelKey: 'averageRating' },
  { value: '3 min', labelKey: 'bookingTime' },
  { value: '20–90 min', labelKey: 'sessionLengths' },
  { value: 'US · IN', labelKey: 'regionsServed' },
];

export function TrustBar() {
  const { t } = useLanguage();

  return (
    <div className="border-b border-mist bg-parchment">
      <div className="mx-auto grid max-w-container grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4 md:px-10">
        {STATS.map((stat) => (
          <div key={stat.labelKey}>
            <p className="font-display text-2xl text-ink">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink/50">{t(`home.trustBar.${stat.labelKey}`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
