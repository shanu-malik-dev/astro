const STATS = [
  { value: '4.9/5', label: 'Average rating' },
  { value: '3 min', label: 'To book a slot' },
  { value: '20–90 min', label: 'Session lengths' },
  { value: 'US · IN', label: 'Regions served' },
];

export function TrustBar() {
  return (
    <div className="border-b border-mist bg-parchment">
      <div className="mx-auto grid max-w-container grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4 md:px-10">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-2xl text-ink">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink/50">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
