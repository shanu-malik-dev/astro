'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { useTenant } from '@/lib/tenant-context';
import { testimonialsApi } from '@/lib/api';

export default function TestimonialsPage() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ customerName: '', message: '', rating: 5 });
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['testimonials-all', tenant.id],
    queryFn: () => testimonialsApi.listApproved(tenant.id),
  });

  const mutation = useMutation({
    mutationFn: () => testimonialsApi.submit(tenant.id, form),
    onSuccess: () => {
      setSubmitted(true);
      setForm({ customerName: '', message: '', rating: 5 });
      queryClient.invalidateQueries({ queryKey: ['testimonials-all', tenant.id] });
    },
  });

  return (
    <>
      <Section tone="dark" className="pb-14 pt-20">
        <p className="eyebrow-on-dark">Testimonials</p>
        <h1 className="mt-5 max-w-xl text-4xl leading-tight md:text-5xl">Sessions, in clients' own words.</h1>
      </Section>

      <Section>
        {isLoading && <p className="text-sm text-ink/50">Loading testimonials…</p>}
        {data && data.length > 0 && (
          <div className="grid gap-8 md:grid-cols-3">
            {data.map((t) => (
              <figure key={t.id} className="border border-mist p-7">
                <div className="flex gap-1 text-gold">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-ink/75">"{t.message}"</blockquote>
                <figcaption className="mt-5 text-xs uppercase tracking-[0.14em] text-ink/45">{t.customerName}</figcaption>
              </figure>
            ))}
          </div>
        )}
        {data && data.length === 0 && <p className="text-sm text-ink/50">No testimonials published yet.</p>}
      </Section>

      <Section tone="dim">
        <div className="mx-auto max-w-lg">
          <SectionHeading align="center" eyebrow="Had a session?" title="Share how it went" />
          {submitted ? (
            <p className="mt-8 text-center text-sm text-ink/70">
              Thank you — your testimonial has been submitted for review.
            </p>
          ) : (
            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <input
                required
                placeholder="Your name"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
              />
              <textarea
                required
                placeholder="Your experience with the consultation"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-ink/60">Rating</span>
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setForm({ ...form, rating: r })}
                    aria-label={`${r} stars`}
                  >
                    <Star size={18} className={r <= form.rating ? 'text-gold' : 'text-mist'} fill={r <= form.rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              {mutation.isError && <p className="text-sm text-wine">Something went wrong. Please try again.</p>}
              <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
                {mutation.isPending ? 'Submitting…' : 'Submit Testimonial'}
              </button>
            </form>
          )}
        </div>
      </Section>
    </>
  );
}
