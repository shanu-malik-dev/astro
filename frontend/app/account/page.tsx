'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Section, SectionHeading } from '@/components/ui/Section';
import { useAuth } from '@/lib/auth-context';
import { useTenant } from '@/lib/tenant-context';
import { bookingApi } from '@/lib/api';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

export default function AccountPage() {
  const { user, accessToken, loading: authLoading, logout } = useAuth();
  const { tenant, formatMoney } = useTenant();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/account');
  }, [authLoading, user, router]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', tenant.id],
    queryFn: () => bookingApi.mine(tenant.id, accessToken!),
    enabled: !!accessToken,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingApi.cancel(tenant.id, accessToken!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings', tenant.id] }),
  });

  if (!user) return null;

  return (
    <Section className="pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="My Account" title={`Welcome back, ${user.fullName.split(' ')[0]}`} />
        <button onClick={() => logout().then(() => router.push('/'))} className="btn-secondary">
          Log Out
        </button>
      </div>

      <div className="mt-12">
        {isLoading && <p className="text-sm text-ink/50">Loading your bookings…</p>}

        {bookings && bookings.length === 0 && (
          <div className="border border-mist p-10 text-center">
            <p className="text-sm text-ink/60">You don't have any bookings yet.</p>
            <Link href="/book" className="btn-primary mt-6 inline-flex">Book a Consultation</Link>
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 border border-mist p-6">
                <div>
                  <p className="font-medium text-ink">{b.service?.name || 'Consultation'}</p>
                  <p className="mt-1 text-sm text-ink/60">
                    {new Date(b.scheduledAt).toLocaleString(tenant.locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wide text-gold-dark">
                    {STATUS_LABEL[b.status] || b.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg text-ink">{formatMoney(b.amountPaid)}</p>
                  {b.googleMeetLink && b.status === 'confirmed' && (
                    <a href={b.googleMeetLink} target="_blank" rel="noreferrer" className="btn-secondary">
                      Join Meet
                    </a>
                  )}
                  {b.status === 'pending_payment' && (
                    <Link href={`/book/success?bookingId=${b.id}`} className="btn-primary">
                      Pay Now
                    </Link>
                  )}
                  {(b.status === 'confirmed' || b.status === 'pending_payment') && (
                    <button
                      onClick={() => cancelMutation.mutate(b.id)}
                      className="text-sm text-ink/40 underline underline-offset-4 hover:text-wine"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
