'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Facebook, Instagram, Link as LinkIcon, Mail, Youtube } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { SiteSnackbar } from '@/components/ui/SiteSnackbar';
import { ApiError, siteContentApi, supportApi } from '@/lib/api';
import { openBookEnquiryModal } from '@/lib/book-enquiry-modal';
import { useTenant } from '@/lib/tenant-context';

const CONTACT = {
  email: 'contact@shreesamriddhiatro.com',
  facebookHref: 'https://facebook.com/',
  instagramHref: 'https://instagram.com/',
  youtubeHref: '',
};

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
} as const;

export default function ContactPage() {
  const { tenant } = useTenant();
  const { data: contentData } = useQuery({
    queryKey: ["site-content", tenant.id],
    queryFn: () => siteContentApi.public(tenant.id),
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    subject: "",
    message: "",
  });
  const content = contentData?.data || {};
  const contact = {
    email: content["contact.email"] || CONTACT.email,
    facebookHref: content["social.facebook"] || CONTACT.facebookHref,
    instagramHref: content["social.instagram"] || CONTACT.instagramHref,
    youtubeHref: content["social.youtube"] || CONTACT.youtubeHref,
  };
  const socialLinks = Object.entries({
    "social.facebook": contact.facebookHref,
    "social.instagram": contact.instagramHref,
    "social.youtube": contact.youtubeHref,
    ...Object.fromEntries(
      Object.entries(content).filter(([key]) => key.startsWith("social."))
    ),
  })
    .map(([key, href]) => {
      const label = key.replace(/^social\./, "");
      const Icon =
        SOCIAL_ICONS[label as keyof typeof SOCIAL_ICONS] || LinkIcon;

      return {
        href,
        label: label
          .split(/[-_.\s]+/)
          .filter(Boolean)
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(" "),
        Icon,
      };
    })
    .filter((link) => link.href);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  const submitSupportRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSnackbar("");
    setLoading(true);

    try {
      await supportApi.create(tenant.id, form);
      setSent(true);
      setForm({ full_name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setSnackbar(
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
      <Section tone="dark" className="!py-6 md:!py-8">
        <p className="eyebrow-on-dark">Contact</p>
        <h1 className="mt-3 max-w-xl text-3xl leading-tight md:text-4xl">Questions before booking? Ask directly.</h1>
      </Section>

      <Section className="!py-10 md:!py-14">
        <SiteSnackbar message={snackbar} onClose={() => setSnackbar("")} />
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-start gap-4 rounded-lg border border-mist bg-white p-4 shadow-sm">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gold/10 text-gold-dark">
                <Mail size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-ink">Email</p>
                <a href={`mailto:${contact.email}`} className="mt-1 block break-all text-sm text-ink/60 hover:text-wine">
                  {contact.email}
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-mist bg-white p-4 shadow-sm">
              <p className="font-medium text-ink">Follow Us</p>
              <div className="mt-3 flex gap-3">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-mist text-ink/60 transition hover:border-gold hover:text-wine"
                    aria-label={label}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-mist bg-white p-5 shadow-sm md:p-6">
            {sent ? (
              <div className="rounded-md border border-mist bg-parchment p-6 text-sm text-ink/70">
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
                    className="rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none transition focus:border-gold"
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
                    className="rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none transition focus:border-gold"
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
                  className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none transition focus:border-gold"
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
                  className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none transition focus:border-gold"
                />
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </Section>

      <Section tone="dim" className="!py-10 text-center md:!py-14">
        <SectionHeading align="center" eyebrow="Prefer to just book?" title="Skip the message and pick a slot directly" />
        <button type="button" onClick={() => openBookEnquiryModal()} className="btn-primary mt-8 inline-flex">Book a Consultation</button>
      </Section>
    </>
  );
}
