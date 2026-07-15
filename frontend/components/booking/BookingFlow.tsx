'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, ChevronLeft } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { useAuth, ApiError } from '@/lib/auth-context';
import { servicesApi, bookingApi, paymentApi, ServiceDto } from '@/lib/api';
import { generateCandidateSlots } from '@/lib/generateSlots';
import { StripeCheckout } from './StripeCheckout';

const STEPS = ['Service', 'Date & Time', 'Your Details', 'Payment'] as const;

export function BookingFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tenant, formatMoney } = useTenant();
  const { user, accessToken, login, register } = useAuth();

  const [step, setStep] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(searchParams.get('service'));
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const { data: services } = useQuery({
    queryKey: ['services', tenant.id],
    queryFn: () => servicesApi.listPublic(tenant.id),
  });

  const selectedService = useMemo<ServiceDto | undefined>(
    () => services?.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId],
  );

  const dayGroups = useMemo(
    () => generateCandidateSlots(selectedService?.durationMinutes || 30, tenant.locale),
    [selectedService, tenant.locale],
  );
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const booking = await bookingApi.create(tenant.id, accessToken!, {
        serviceId: selectedService!.id,
        scheduledAt: selectedTime!.toISOString(),
        customerNotes: notes || undefined,
      });
      const intent = await paymentApi.createIntent(tenant.id, accessToken!, booking.id);
      return { booking, intent };
    },
    onSuccess: ({ booking, intent }) => {
      setBookingId(booking.id);
      setClientSecret(intent.clientSecret);
      setStep(3);
    },
    onError: (err) => {
      setFlowError(err instanceof ApiError ? err.message : 'This slot may no longer be available. Please choose another time.');
    },
  });

  const goToDetailsStep = () => {
    setFlowError(null);
    setStep(2);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(authForm.email, authForm.password);
      } else {
        await register(authForm);
      }
    } catch (err) {
      setFlowError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleConfirmDetails = () => {
    setFlowError(null);
    createBookingMutation.mutate();
  };

  if (step === 3 && clientSecret && bookingId) {
    return (
      <div className="mx-auto max-w-md">
        <p className="eyebrow">Step 4 of 4</p>
        <h1 className="mt-3 text-2xl text-ink">Confirm your payment</h1>
        <div className="mt-6 border border-mist p-6">
          <p className="text-sm text-ink/60">{selectedService?.name}</p>
          <p className="mt-1 font-display text-xl text-ink">{formatMoney(selectedService?.price || 0)}</p>
          <p className="mt-1 text-sm text-ink/50">
            {selectedTime?.toLocaleString(tenant.locale, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="mt-8">
          <StripeCheckout clientSecret={clientSecret} onSuccess={() => router.push(`/book/success?bookingId=${bookingId}`)} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs ${
                i <= step ? 'bg-wine text-parchment' : 'bg-mist text-ink/40'
              }`}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-wine' : 'bg-mist'}`} />}
          </div>
        ))}
      </div>

      {step > 0 && (
        <button onClick={() => setStep(step - 1)} className="mb-6 inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
          <ChevronLeft size={14} /> Back
        </button>
      )}

      {flowError && <p className="mb-6 border border-wine/30 bg-wine/5 p-4 text-sm text-wine">{flowError}</p>}

      {step === 0 && (
        <div>
          <h1 className="text-2xl text-ink">Choose a service</h1>
          <div className="mt-6 space-y-3">
            {services?.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedServiceId(service.id);
                  setStep(1);
                }}
                className={`flex w-full items-center justify-between border p-5 text-left transition-colors ${
                  selectedServiceId === service.id ? 'border-gold' : 'border-mist hover:border-ink/30'
                }`}
              >
                <div>
                  <p className="font-medium text-ink">{service.name}</p>
                  <p className="text-xs uppercase tracking-wide text-ink/40">{service.durationMinutes} minutes</p>
                </div>
                <p className="font-display text-lg text-ink">{formatMoney(service.price)}</p>
              </button>
            ))}
            {!services && <p className="text-sm text-ink/50">Loading services…</p>}
          </div>
        </div>
      )}

      {step === 1 && selectedService && (
        <div>
          <h1 className="text-2xl text-ink">Pick a date &amp; time</h1>
          <p className="mt-1 text-sm text-ink/50">Times shown in your local timezone.</p>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {dayGroups.map((day, i) => (
              <button
                key={day.label}
                onClick={() => setActiveDayIdx(i)}
                className={`shrink-0 border px-4 py-2 text-sm ${
                  i === activeDayIdx ? 'border-gold bg-gold/10' : 'border-mist text-ink/60'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {dayGroups[activeDayIdx]?.times.map((time) => (
              <button
                key={time.toISOString()}
                onClick={() => setSelectedTime(time)}
                className={`border py-2.5 text-sm ${
                  selectedTime?.getTime() === time.getTime() ? 'border-gold bg-gold/10' : 'border-mist hover:border-ink/30'
                }`}
              >
                {time.toLocaleTimeString(tenant.locale, { hour: 'numeric', minute: '2-digit' })}
              </button>
            ))}
          </div>

          <button disabled={!selectedTime} onClick={goToDetailsStep} className="btn-primary mt-8 w-full disabled:opacity-40">
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-2xl text-ink">Your details</h1>

          {!user ? (
            <div className="mt-6">
              <div className="mb-6 flex gap-6 border-b border-mist">
                {(['register', 'login'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAuthMode(mode)}
                    className={`pb-3 text-sm uppercase tracking-wide ${
                      authMode === mode ? 'border-b-2 border-gold text-ink' : 'text-ink/40'
                    }`}
                  >
                    {mode === 'register' ? 'Create Account' : 'Log In'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <input
                    required
                    placeholder="Full name"
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                    className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                  />
                )}
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                />
                {authMode === 'register' && (
                  <input
                    placeholder="Phone (optional)"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                    className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                  />
                )}
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                />
                <button type="submit" disabled={authSubmitting} className="btn-primary w-full">
                  {authSubmitting ? 'Please wait…' : authMode === 'register' ? 'Create Account & Continue' : 'Log In & Continue'}
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="border border-mist p-5">
                <p className="text-sm text-ink/50">Booking as</p>
                <p className="mt-1 font-medium text-ink">{user.fullName} · {user.email}</p>
              </div>
              <textarea
                rows={4}
                placeholder="Anything specific you'd like to focus on? (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
              />

              <div className="border border-mist p-5">
                <p className="text-sm text-ink/50">{selectedService?.name}</p>
                <p className="mt-1 text-sm text-ink/50">
                  {selectedTime?.toLocaleString(tenant.locale, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="mt-2 font-display text-xl text-ink">{formatMoney(selectedService?.price || 0)}</p>
              </div>

              <button onClick={handleConfirmDetails} disabled={createBookingMutation.isPending} className="btn-primary w-full">
                {createBookingMutation.isPending ? 'Preparing payment…' : 'Continue to Payment'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
