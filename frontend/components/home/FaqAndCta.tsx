import Link from 'next/link';
import { Section, SectionHeading } from '@/components/ui/Section';

const FAQS = [
  ['How accurate is a video consultation compared to in-person?', 'Every reading is done live with your full chart pulled up on screen, so you see exactly what\u2019s being interpreted in real time.'],
  ['What if I don\u2019t know my exact birth time?', 'You can still book — we\u2019ll ask what you do know and adjust the reading approach accordingly during the session.'],
  ['Can I reschedule after paying?', 'Yes, from your account up to 12 hours before your slot, subject to availability.'],
];

export function FaqTeaser() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="Common questions" title="Before you book" />
        <div>
          {FAQS.map(([q, a]) => (
            <details key={q} className="group hairline py-5 first:border-t-0">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-ink">
                {q}
                <span className="ml-4 text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/60">{a}</p>
            </details>
          ))}
          <Link href="/faq" className="mt-6 inline-block text-sm uppercase tracking-[0.14em] text-wine underline underline-offset-4">
            All questions
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function CtaBand() {
  return (
    <Section tone="dark" className="text-center">
      <p className="eyebrow-on-dark">Ready when you are</p>
      <h2 className="mx-auto mt-5 max-w-xl text-3xl md:text-4xl">
        The chart doesn't change. The right moment to read it does.
      </h2>
      <Link href="/book" className="btn-gold mt-9 inline-flex">
        Book Your Consultation
      </Link>
    </Section>
  );
}
