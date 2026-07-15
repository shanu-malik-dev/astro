import { Section, SectionHeading } from '@/components/ui/Section';

const STEPS = [
  { n: '01', title: 'Choose a reading', body: 'Pick a service by topic and length — love, career, business, or a full birth chart.' },
  { n: '02', title: 'Pick a time', body: 'Only real, open slots are shown, already converted to your timezone.' },
  { n: '03', title: 'Share your details', body: 'Birth date, time, and place — reviewed ahead of your session, not during it.' },
  { n: '04', title: 'Pay securely', body: 'Card, Apple Pay, or Google Pay via Stripe. Confirmation is instant.' },
  { n: '05', title: 'Meet on video', body: 'A Google Meet link is generated automatically and emailed to you.' },
];

export function HowItWorks() {
  return (
    <Section tone="dim">
      <SectionHeading eyebrow="The process" title="From question to consultation in five steps" align="center" />
      <div className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-5">
        {STEPS.map((step) => (
          <div key={step.n} className="relative">
            <p className="font-display text-4xl text-gold/50">{step.n}</p>
            <p className="mt-3 font-medium text-ink">{step.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
