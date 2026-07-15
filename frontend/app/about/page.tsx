import { Section, SectionHeading } from '@/components/ui/Section';
import { ConstellationLine } from '@/components/ui/ConstellationLine';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <Section tone="dark" className="pb-16 pt-20">
        <p className="eyebrow-on-dark">About AstroNova</p>
        <h1 className="mt-5 max-w-2xl text-4xl leading-tight md:text-5xl">
          Astrology, treated like a serious consultation — not a party trick.
        </h1>
        <ConstellationLine className="mt-10 h-auto w-full max-w-sm" variant="gold" />
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-2">
          <div className="space-y-5 text-[15px] leading-relaxed text-ink/70">
            <p>
              AstroNova began with a simple frustration: most online astrology felt either
              impersonal — a rotating cast of readers on a chat app — or theatrical, heavy on
              performance and light on anything you could use afterward.
            </p>
            <p>
              We built something narrower on purpose. One practicing astrologer. A booking
              system that respects your time zone and your calendar. A video session where the
              chart is on screen and the conversation is about your actual questions —
              a relationship, a career decision, a business bet.
            </p>
            <p>
              Every consultation is logged to your account: what was discussed, what was
              recommended, and what to revisit later. No starting over at the next session.
            </p>
          </div>
          <div className="space-y-6 hairline pt-8 lg:border-t-0 lg:pt-0 lg:pl-10 lg:border-l lg:border-mist">
            <div>
              <p className="eyebrow">Who it's for</p>
              <p className="mt-2 text-[15px] text-ink/70">
                Adults navigating a specific decision — love, marriage, career, business, or
                family — who want a grounded second read on the timing.
              </p>
            </div>
            <div>
              <p className="eyebrow">How sessions run</p>
              <p className="mt-2 text-[15px] text-ink/70">
                20 to 90 minutes, over Google Meet, with your birth chart reviewed in advance.
              </p>
            </div>
            <div>
              <p className="eyebrow">Where we operate</p>
              <p className="mt-2 text-[15px] text-ink/70">
                Currently serving the United States and India, with pricing and scheduling
                adapted to each region.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="dim" className="text-center">
        <SectionHeading align="center" eyebrow="Start here" title="See which reading fits your question" />
        <Link href="/services" className="btn-primary mt-8 inline-flex">
          Browse Services
        </Link>
      </Section>
    </>
  );
}
