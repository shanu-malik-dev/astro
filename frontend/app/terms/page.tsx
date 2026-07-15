import { LegalPage } from '@/components/legal/LegalPage';

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 2026">
      <p>
        By booking a consultation through AstroNova, you agree to the terms below. Please read
        them before completing payment.
      </p>
      <h2 className="pt-2 text-lg text-ink">Nature of consultations</h2>
      <p>
        Astrology consultations are provided for entertainment, reflection, and personal
        guidance purposes. They are not a substitute for professional medical, legal, or
        financial advice.
      </p>
      <h2 className="pt-2 text-lg text-ink">Booking &amp; scheduling</h2>
      <p>
        Bookings require full payment at the time of scheduling. Slots are held only once
        payment is confirmed. Rescheduling is available up to 12 hours before your session,
        subject to availability.
      </p>
      <h2 className="pt-2 text-lg text-ink">Conduct</h2>
      <p>
        Sessions are conducted respectfully on both sides. AstroNova reserves the right to end a
        session early in the event of abusive conduct, without refund.
      </p>
      <h2 className="pt-2 text-lg text-ink">Changes to these terms</h2>
      <p>These terms may be updated periodically; continued use of the service constitutes acceptance of the current version.</p>
    </LegalPage>
  );
}
