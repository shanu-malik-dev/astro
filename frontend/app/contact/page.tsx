'use client';

import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { ApiError, supportApi } from '@/lib/api';
import { openBookEnquiryModal } from '@/lib/book-enquiry-modal';
import { useTenant } from '@/lib/tenant-context';

export default function ContactPage() {
  const { tenant } = useTenant();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    subject: "",
    message: "",
  });

  const submitSupportRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await supportApi.create(tenant.id, form);
      setSent(true);
      setForm({ full_name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to send support request."
      );
    } finally {
      setLoading(false);
    }
  };

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
                <p className="mt-1 text-sm text-ink/60">contact@shreesamriddhiatro.com</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="mt-1 text-gold" size={18} />
              <div>
                <p className="font-medium text-ink">Call</p>
                <p className="mt-1 text-sm text-ink/60">Available for confirmed bookings only</p>
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
                onSubmit={submitSupportRequest}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    value={form.full_name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        full_name: event.target.value,
                      }))
                    }
                    placeholder="Full name"
                    className="border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                  />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Email address"
                    className="border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <input
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  placeholder="Subject"
                  className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                />
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder="How can we help?"
                  className="w-full border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </Section>

      <Section tone="dim" className="text-center">
        <SectionHeading align="center" eyebrow="Prefer to just book?" title="Skip the message and pick a slot directly" />
        <button type="button" onClick={openBookEnquiryModal} className="btn-primary mt-8 inline-flex">Book a Consultation</button>
      </Section>
    </>
  );
}
