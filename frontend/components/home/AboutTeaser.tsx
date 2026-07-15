import Link from 'next/link';
import { Section, SectionHeading } from '@/components/ui/Section';

export function AboutTeaser() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <SectionHeading
          eyebrow="Why AstroNova"
          title="One astrologer. Full attention. No app to download."
          description="Most astrology platforms optimize for volume — quick chats, rotating readers, upsells at every turn. AstroNova is built around a single, focused practice: you book a real slot, meet by video, and get a session shaped around your actual chart and questions."
        />
        <div className="hairline pt-8 lg:border-t-0 lg:pt-0">
          <ul className="space-y-6">
            {[
              ['Prepared, not improvised', 'Your birth details are reviewed before the session, so time isn\u2019t spent on setup.'],
              ['One continuous thread', 'Every consultation, note, and follow-up lives on your account — nothing repeated twice.'],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-4">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <div>
                  <p className="font-medium text-ink">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/about" className="mt-8 inline-block text-sm uppercase tracking-[0.14em] text-wine underline underline-offset-4">
            Read the full story
          </Link>
        </div>
      </div>
    </Section>
  );
}
