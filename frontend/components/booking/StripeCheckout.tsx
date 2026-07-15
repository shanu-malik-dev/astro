'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      onSuccess();
    } else {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-sm text-wine">{error}</p>}
      <button type="submit" disabled={!stripe || submitting} className="btn-gold w-full">
        {submitting ? 'Processing…' : 'Confirm & Pay'}
      </button>
    </form>
  );
}

export function StripeCheckout({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-ink/50">
        Stripe publishable key is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your
        environment to enable payments.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#7A3B4A',
            colorBackground: '#F6F1E9',
            colorText: '#14131F',
            fontFamily: 'var(--font-inter)',
            borderRadius: '2px',
          },
        },
      }}
    >
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  );
}
