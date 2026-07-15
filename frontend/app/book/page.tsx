import { Suspense } from 'react';
import { Section } from '@/components/ui/Section';
import { BookingFlow } from '@/components/booking/BookingFlow';

export default function BookPage() {
  return (
    <Section className="pt-16">
      <Suspense fallback={<p className="text-center text-sm text-ink/50">Loading…</p>}>
        <BookingFlow />
      </Suspense>
    </Section>
  );
}
