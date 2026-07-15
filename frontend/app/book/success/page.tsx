'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { useTenant } from '@/lib/tenant-context';
import { useAuth } from '@/lib/auth-context';
import { bookingApi } from '@/lib/api';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { tenant, formatMoney } = useTenant();
  const { accessToken } = useAuth();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.get(tenant.id, accessToken!, bookingId!),
    enabled: !!bookingId && !!accessToken,
    refetchInterval: (query) => (query.state.data?.status === 'pending_payment' ? 3000 : false),
  });

  if (!bookingId) {
    return <p className="text-center text-sm text-ink/50">No booking reference found.</p>;
  }

  return (
    <div className="mx-auto max-w-md text-center">
      {isLoading && <p className="text-sm text-ink/50">Loading your confirmation…</p>}

      {booking && booking.status === 'confirmed' && (
        <>
          <CheckCircle2 className="mx-auto text-gold" size={40} />
          <h1 className="mt-5 text-2xl text-ink">You're booked</h1>
          <p className="mt-2 text-sm text-ink/60">
            {new Date(booking.scheduledAt).toLocaleString(tenant.locale, { dateStyle: 'full', timeStyle: 'short' })}
          </p>
          <p className="mt-1 font-display text-xl text-ink">{formatMoney(booking.amountPaid)}</p>
          {booking.googleMeetLink && (
            <a href={booking.googleMeetLink} target="_blank" rel="noreferrer" className="btn-gold mt-6 inline-flex">
              Open Meeting Link
            </a>
          )}
          <p className="mt-4 text-xs text-ink/40">A confirmation email is on its way to you.</p>
          <Link href="/account" className="mt-8 inline-block text-sm text-wine underline underline-offset-4">
            View all bookings
          </Link>
        </>
      )}

      {booking && booking.status === 'pending_payment' && (
        <>
          <Clock className="mx-auto animate-pulse text-gold" size={40} />
          <h1 className="mt-5 text-2xl text-ink">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-ink/60">This usually takes just a few seconds.</p>
        </>
      )}
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Section className="pt-20">
      <Suspense fallback={<p className="text-center text-sm text-ink/50">Loading…</p>}>
        <SuccessContent />
      </Suspense>
    </Section>
  );
}
