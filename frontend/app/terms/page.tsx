import { DynamicLegalContent } from "@/components/legal/DynamicLegalContent";

const fallbackTerms = `By booking a consultation through Shree Samriddhi Astro, you agree to the terms below. Please read them before completing payment.

## Nature of consultations
Astrology consultations are provided for entertainment, reflection, and personal guidance purposes. They are not a substitute for professional medical, legal, or financial advice.

## Booking & scheduling
Bookings require full payment at the time of scheduling. Slots are held only once payment is confirmed. Rescheduling is available up to 12 hours before your session, subject to availability.

## Conduct
Sessions are conducted respectfully on both sides. Shree Samriddhi Astro reserves the right to end a session early in the event of abusive conduct, without refund.

## Changes to these terms
These terms may be updated periodically; continued use of the service constitutes acceptance of the current version.`;

export default function TermsPage() {
  return (
    <DynamicLegalContent
      title="Terms of Service"
      updatedKey="legal.terms.updated"
      contentKey="legal.terms.content"
      fallbackUpdated="July 2026"
      fallback={fallbackTerms}
    />
  );
}
