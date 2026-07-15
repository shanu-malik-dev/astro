import { LegalPage } from '@/components/legal/LegalPage';

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="July 2026">
      <p>
        We want every booking to feel low-risk. The policy below outlines when a refund is
        available.
      </p>
      <h2 className="pt-2 text-lg text-ink">Full refunds</h2>
      <p>Available if you cancel at least 24 hours before your scheduled consultation.</p>
      <h2 className="pt-2 text-lg text-ink">Partial refunds</h2>
      <p>
        Cancellations made between 12 and 24 hours before the session may be eligible for a
        50% refund, at our discretion.
      </p>
      <h2 className="pt-2 text-lg text-ink">No refunds</h2>
      <p>
        Cancellations within 12 hours of the session, or no-shows, are not eligible for a
        refund. Rescheduling is offered instead where possible.
      </p>
      <h2 className="pt-2 text-lg text-ink">How to request a refund</h2>
      <p>
        Refund requests are handled from your account under booking details, or by contacting
        hello@astronova.com with your booking reference.
      </p>
    </LegalPage>
  );
}
