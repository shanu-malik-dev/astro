'use client';

import { useState } from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <Section tone="dark" className="pb-14 pt-20">
        <p className="eyebrow-on-dark">Contact</p>
        <h1 className="mt-5 max-w-xl text-4xl leading-tight md:text-5xl">Questions before booking? Ask directly.</h1>
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <div className="flex gap-4">
              <Mail className="mt-1 text-gold" size={18} />
              <div>
                <p className="font-medium text-ink">Email</p>
                <p className="mt-1 text-sm text-ink/60">hello@astronova.com</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="mt-1 text-gold" size={18} />
              <div>
                <p className="font-medium text-ink">Call</p>
                <p className="mt-1 text-sm text-ink/60">Available for confirmed bookings only</p>
              </div>
            </div>
            <div className="flex gap-4">
              <MessageCircle className="mt-1 text-gold" size={18} />
              <div>
                <p className="font-medium text-ink">Response time</p>
                <p className="mt-1 text-sm text-ink/60">Within one business day</p>
              </div>
            </div>
          </div>

          <div>
            {sent ? (
              <div className="border border-mist p-8 text-sm text-ink/70">
                Thanks for reaching out — we'll reply to your email shortly.
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required placeholder="Full name" className="border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold" />
                  <input required type="email" placeholder="Email address" className="border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold" />
                </div>
                <input placeholder="Subject" className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold" />
                <textarea required rows={5} placeholder="How can we help?" className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold" />
                <button type="submit" className="btn-primary w-full">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </Section>

      <Section tone="dim" className="text-center">
        <SectionHeading align="center" eyebrow="Prefer to just book?" title="Skip the message and pick a slot directly" />
        <a href="/book" className="btn-primary mt-8 inline-flex">Book a Consultation</a>
      </Section>
    </>
  );
}
