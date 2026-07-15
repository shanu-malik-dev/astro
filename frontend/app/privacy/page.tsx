import { LegalPage } from '@/components/legal/LegalPage';

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <p>
        AstroNova collects the information necessary to schedule and deliver your consultation:
        your name, email, phone number, and the birth details required for an astrological
        reading (date, time, and place of birth).
      </p>
      <h2 className="pt-2 text-lg text-ink">How we use your information</h2>
      <p>
        Your details are used to create your account, process payments through Stripe, generate
        your Google Meet session, and send booking-related emails. Birth details are used solely
        to prepare and conduct your consultation.
      </p>
      <h2 className="pt-2 text-lg text-ink">Data sharing</h2>
      <p>
        We do not sell personal data. Limited data is shared with payment (Stripe) and
        scheduling (Google Calendar) providers strictly to complete your booking.
      </p>
      <h2 className="pt-2 text-lg text-ink">Data retention</h2>
      <p>
        Account and booking history is retained to maintain your consultation timeline. You may
        request deletion of your account by contacting us directly.
      </p>
      <h2 className="pt-2 text-lg text-ink">Contact</h2>
      <p>Questions about this policy can be sent to hello@astronova.com.</p>
    </LegalPage>
  );
}
