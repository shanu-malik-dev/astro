"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";

const services = [
  {
    id: 1,
    category: "Love",
    name: "Love & Relationship Reading",
    description:
      "Get personalized guidance on relationships, compatibility, breakups, and emotional clarity.",
  },
  {
    id: 2,
    category: "Career",
    name: "Career Guidance",
    description:
      "Find the right career path, job opportunities, promotions, and professional growth.",
  },
  {
    id: 3,
    category: "Marriage",
    name: "Marriage Consultation",
    description:
      "Understand marriage timing, compatibility, and build a stronger future together.",
  },
  {
    id: 4,
    category: "Finance",
    name: "Finance & Business",
    description:
      "Receive astrological insights for financial stability, investments, and business success.",
  },
  {
    id: 5,
    category: "Health",
    name: "Health & Wellness",
    description:
      "Gain guidance for better health, peace of mind, and overall well-being.",
  },
  {
    id: 6,
    category: "Family",
    name: "Family & Personal Life",
    description:
      "Resolve family conflicts, improve harmony, and strengthen personal relationships.",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <Section tone="dark" className="pb-14 pt-20">
        <p className="eyebrow-on-dark">Our Services</p>

        <h1 className="mt-5 max-w-2xl text-4xl leading-tight md:text-5xl">
          Discover the right consultation for every stage of your life.
        </h1>

        <p className="mt-6 max-w-2xl text-parchment/70">
          Every consultation is completely private and tailored to your unique
          questions. Choose the service that best matches your current concern.
        </p>
      </Section>

      {/* Services */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex flex-col justify-between rounded-xl border border-mist bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <p className="eyebrow">{service.category}</p>

                <h2 className="mt-3 text-2xl text-ink">
                  {service.name}
                </h2>

                <p className="mt-4 text-sm leading-7 text-ink/60">
                  {service.description}
                </p>
              </div>

              <div className="mt-8 border-t border-mist pt-6">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 text-wine font-medium hover:underline"
                >
                  Book Consultation
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section tone="dim">
        <SectionHeading
          eyebrow="Need Help Choosing?"
          title="Let's Find the Right Consultation for You"
          description="If you're unsure which consultation suits your situation, book a general consultation and we'll help you identify the best path forward."
        />

        <Link
          href="/book"
          className="btn-primary mt-8 inline-flex"
        >
          Book Consultation
        </Link>
      </Section>
    </>
  );
}