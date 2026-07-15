import Link from "next/link";

const SERVICES = [
  {
    title: "Love & Relationship",
    description:
      "Gain clarity in your relationships, compatibility, and emotional decisions.",
    icon: "❤️",
  },
  {
    title: "Career Guidance",
    description:
      "Discover the right career path, job opportunities, and professional growth.",
    icon: "💼",
  },
  {
    title: "Marriage Consultation",
    description:
      "Get guidance on marriage timing, compatibility, and long-term happiness.",
    icon: "💍",
  },
  {
    title: "Finance & Business",
    description:
      "Understand financial opportunities, investments, and business success.",
    icon: "💰",
  },
  {
    title: "Health & Wellness",
    description:
      "Receive astrological insights for better health, balance, and well-being.",
    icon: "🩺",
  },
];

export function ServicesBar() {
  return (
    <section className="border-b border-mist bg-parchment">
      <div className="mx-auto max-w-container px-6 py-12 md:px-10">
        {/* Heading */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="eyebrow">Our Services</p>
            <h2 className="mt-2 font-display text-3xl text-ink">
              Astrology Services
            </h2>
          </div>

          <Link
            href="/services"
            className="text-sm font-medium text-wine transition hover:underline"
          >
            See More →
          </Link>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="rounded-xl border border-mist bg-white p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">{service.icon}</div>

              <h3 className="mt-4 text-lg font-semibold text-ink">
                {service.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}