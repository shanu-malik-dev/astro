"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Star,
  User,
  MessageCircle,
  Languages,
  BriefcaseBusiness,
} from "lucide-react";
import { Section } from "@/components/ui/Section";


const astrologers = [
  {
    id: 1,
    name: "Acharya Rahul Sharma",
    image: "",
    experience: "12+ Years",
    expertise: ["Love", "Marriage", "Career"],
    languages: "Hindi, English",
    rating: 4.9,
    consultations: "8,500+",
    about:
      "Specialist in Vedic Astrology with over 12 years of experience helping people with love, marriage, career and family guidance.",
    phone: "+919876543210",
  },
  {
    id: 2,
    name: "Pandit Anil Joshi",
    image: "",
    experience: "18+ Years",
    expertise: ["Finance", "Business", "Vastu"],
    languages: "Hindi",
    rating: 4.8,
    consultations: "12,000+",
    about:
      "Expert in Finance, Business Astrology and Vastu consultations with thousands of satisfied clients.",
    phone: "+919876543211",
  },
  {
    id: 3,
    name: "Dr. Neha Verma",
    image: "",
    experience: "10+ Years",
    expertise: ["Tarot", "Relationship", "Health"],
    languages: "Hindi, English",
    rating: 5,
    consultations: "6,000+",
    about:
      "Professional Tarot Reader and Astrology Consultant helping people find clarity and confidence.",
    phone: "+919876543212",
  },
];

export default function AstrologersPage() {
  return (
    <>
      <Section tone="dark" className="pt-20 pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow-on-dark">Our Experts</p>

          <h1 className="mt-5 text-4xl md:text-5xl">
            Consult India's Trusted Astrologers
          </h1>

          <p className="mt-5 text-parchment/70">
            Choose an experienced astrologer for personalized guidance on love,
            career, marriage, finance, health and life decisions.
          </p>
        </div>
      </Section>

      <Section>
        <div className="space-y-8">
          {astrologers.map((astrologer) => (
            <div
              key={astrologer.id}
              className="rounded-2xl border border-mist bg-white p-4 md:p-6 shadow-sm transition md:hover:-translate-y-1 md:hover:shadow-xl"
            >
              <div className="flex flex-col md:flex-row gap-5">
                {/* Avatar */}
                <div className="flex justify-center">
                  {astrologer.image ? (
                    <Image
                      src={astrologer.image}
                      alt={astrologer.name}
                      width={140}
                      height={140}
                      className="h-24 w-24 md:h-36 md:w-36 rounded-2xl object-cover"
                    />
                  ) : (
                   <div className="flex h-24 w-24 md:h-36 md:w-36 items-center justify-center rounded-2xl bg-amber-100">
                    <User className="h-10 w-10 md:h-16 md:w-16 text-amber-700" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                   <h2 className="text-xl md:text-2xl font-semibold text-ink">
                      {astrologer.name}
                    </h2>

                    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                      <Star size={14} fill="currentColor" />
                      {astrologer.rating}
                    </span>
                  </div>

                  <p className="mt-3 text-sm md:text-base leading-6 text-ink/70">
                    {astrologer.about}
                  </p>

                  <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                   <div className="rounded-xl bg-parchment p-3 md:p-4 col-span-2 md:col-span-1">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness size={18} />
                        <span className="text-sm font-medium">
                          Experience
                        </span>
                      </div>

                      <p className="mt-2 font-semibold">
                        {astrologer.experience}
                      </p>
                    </div>

                    <div className="rounded-xl bg-parchment p-3 md:p-4">
                      <div className="flex items-center gap-2">
                        <Languages size={18} />
                        <span className="text-sm font-medium">
                          Languages
                        </span>
                      </div>

                      <p className="mt-2 font-semibold">
                        {astrologer.languages}
                      </p>
                    </div>

                    <div className="rounded-xl bg-parchment p-3 md:p-4">
                      <div className="flex items-center gap-2">
                        ⭐
                        <span className="text-sm font-medium">
                          Consultations
                        </span>
                      </div>

                      <p className="mt-2 font-semibold">
                        {astrologer.consultations}
                      </p>
                    </div>
                  </div>

                  {/* Expertise */}
                  <div className="mt-6">
                    <p className="mb-3 font-semibold text-ink">
                      Expertise
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {astrologer.expertise.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-amber-100 px-3 py-1.5 text-xs md:text-sm md:px-4 md:py-2 font-medium text-amber-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3 w-full md:w-52">
                  <a
                    href={`tel:${astrologer.phone}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700"
                  >
                    <Phone size={18} />
                    Call Now
                  </a>

                  <a
                    href={`https://wa.me/${astrologer.phone.replace(
                      "+",
                      ""
                    )}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 rounded-xl border border-green-600 px-5 py-3 font-medium text-green-700 transition hover:bg-green-50"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>

                  {/* <Link
                    href={`/astrologers/${astrologer.id}`}
                    className="rounded-xl border border-gold px-5 py-3 text-center font-medium text-gold transition hover:bg-gold hover:text-black"
                  >
                    View Profile
                  </Link> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}