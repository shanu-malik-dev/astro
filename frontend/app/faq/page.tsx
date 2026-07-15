import { Section, SectionHeading } from '@/components/ui/Section';

const GROUPS = [
  {
    title: 'Booking',
    items: [
      ['How far in advance can I book?', 'Up to 90 days ahead, with a minimum of 12 hours notice for any slot.'],
      ['Can I book on behalf of someone else?', 'Sessions are personal and require the birth details of the person receiving the reading.'],
      ['What happens if I miss my slot?', 'Missed sessions without a reschedule request are marked no-show and are not automatically refunded.'],
    ],
  },
  {
    title: 'Payments',
    items: [
      ['What payment methods are accepted?', 'Visa, Mastercard, American Express, Apple Pay, and Google Pay, processed securely through Stripe.'],
      ['Is my payment refundable?', 'Refunds are available up to 24 hours before your session. See our Refund Policy for details.'],
      ['Will I receive an invoice?', 'Yes, an invoice is generated automatically and emailed after payment.'],
    ],
  },
  {
    title: 'During the Session',
    items: [
      ['How do I join the video call?', 'A Google Meet link is emailed to you after booking and again as a reminder before your session.'],
      ['What should I have ready?', 'Just yourself — your birth details are already on file from booking.'],
      ['Can I record the session?', 'Session recording is not currently offered, but a written summary is added to your account afterward.'],
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <Section tone="dark" className="pb-14 pt-20">
        <p className="eyebrow-on-dark">FAQ</p>
        <h1 className="mt-5 max-w-xl text-4xl leading-tight md:text-5xl">Answers before you book.</h1>
      </Section>

      <Section>
        <div className="grid gap-14 md:grid-cols-3">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <SectionHeading title={group.title} />
              <div className="mt-6">
                {group.items.map(([q, a]) => (
                  <details key={q} className="group hairline py-4 first:border-t-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
                      {q}
                      <span className="ml-3 text-gold transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
