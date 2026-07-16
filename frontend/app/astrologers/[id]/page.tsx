"use client";

import Image from "next/image";
import Link from "next/link";
import {
  User,
  Star,
  Phone,
  MessageCircle,
  Languages,
  BriefcaseBusiness,
  CheckCircle,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { useLanguage } from "@/lib/language-context";

const astrologer = {
  id: 1,
  key: "rahul",
  image: "",
  rating: 4.9,
  phone: "+919876543210",
  expertise: ["love", "marriage", "career", "finance", "family", "health"],
  services: ["birthChart", "love", "marriage", "career", "finance", "remedies"],
  reviews: [
    {
      name: "Rahul Verma",
      rating: 5,
      commentKey: "rahul",
    },
    {
      name: "Sneha Patel",
      rating: 5,
      commentKey: "sneha",
    },
  ],
};

export default function AstrologerProfilePage() {
  const { t } = useLanguage();

  return (
    <>
      <Section tone="dark" className="pt-20 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-8 lg:flex-row">
            {/* Avatar */}

            {astrologer.image ? (
              <Image
                src={astrologer.image}
                alt={t(`astrologersPage.experts.${astrologer.key}.name`)}
                width={180}
                height={180}
                className="h-44 w-44 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-amber-100">
                <User
                  size={70}
                  className="text-amber-700"
                />
              </div>
            )}

            {/* Details */}

            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-semibold">
                {t(`astrologersPage.experts.${astrologer.key}.name`)}
              </h1>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1">
                  <Star
                    size={15}
                    fill="currentColor"
                  />
                  {astrologer.rating}
                </span>

                <span>{t(`astrologersPage.experts.${astrologer.key}.experience`)}</span>

                <span>{t(`astrologersPage.experts.${astrologer.key}.consultations`)} {t("astrologerProfile.consultations")}</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                {astrologer.expertise.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm"
                  >
                    {t(`astrologerProfile.expertise.${item}`)}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a
                  href={`tel:${astrologer.phone}`}
                  className="btn-primary"
                >
                  <Phone size={18} />
                  {t("common.actions.callNow")}
                </a>

                <a
                  href={`https://wa.me/${astrologer.phone.replace("+", "")}`}
                  target="_blank"
                  className="rounded-lg border border-green-500 px-5 py-3 font-medium text-green-500 hover:bg-green-500 hover:text-white"
                >
                  <MessageCircle size={18} />
                  {t("common.actions.whatsApp")}
                </a>

                <Link
                  href="/book"
                  className="rounded-lg border border-gold px-5 py-3 hover:bg-gold hover:text-black"
                >
                  {t("astrologerProfile.bookConsultation")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          {/* Left */}

          <div>
            <div className="rounded-2xl border border-mist bg-white p-8">
              <h2 className="text-2xl font-semibold">
                {t("astrologerProfile.aboutTitle")}
              </h2>

              <p className="mt-5 leading-8 text-ink/70">
                {t("astrologerProfile.about")}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-mist bg-white p-8">
              <h2 className="text-2xl font-semibold">
                {t("astrologerProfile.includesTitle")}
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {astrologer.services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="text-green-600" size={18} />

                    <span>{t(`astrologerProfile.services.${service}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-mist bg-white p-8">
              <h2 className="text-2xl font-semibold">
                {t("astrologerProfile.reviewsTitle")}
              </h2>

              <div className="mt-6 space-y-6">
                {astrologer.reviews.map((review) => (
                  <div
                    key={review.name}
                    className="rounded-xl bg-parchment p-5"
                  >
                    <div className="flex items-center gap-2">
                      <Star
                        fill="currentColor"
                        size={16}
                        className="text-yellow-500"
                      />
                      {review.rating}
                    </div>

                    <p className="mt-3 text-ink/70">
                      "{t(`astrologerProfile.reviews.${review.commentKey}`)}"
                    </p>

                    <p className="mt-4 font-medium">
                      — {review.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}

          <div className="space-y-6">
            <div className="rounded-2xl border border-mist bg-white p-6">
              <h3 className="font-semibold">
                {t("astrologerProfile.experienceTitle")}
              </h3>

              <p className="mt-3 flex items-center gap-2">
                <BriefcaseBusiness size={18} />
                {t(`astrologersPage.experts.${astrologer.key}.experience`)}
              </p>

              <p className="mt-4 flex items-center gap-2">
                <Languages size={18} />
                {t(`astrologersPage.experts.${astrologer.key}.languages`)}
              </p>

              <p className="mt-4">
                ⭐ {astrologer.rating} {t("astrologerProfile.rating")}
              </p>

              <p className="mt-2">
                👥 {t(`astrologersPage.experts.${astrologer.key}.consultations`)}
              </p>
            </div>

            <div className="rounded-2xl border border-mist bg-white p-6">
              <h3 className="font-semibold">
                {t("astrologerProfile.guidanceTitle")}
              </h3>

              <p className="mt-3 text-sm text-ink/60">
                {t("astrologerProfile.guidanceBody")}
              </p>

              <div className="mt-6 space-y-3">
                <a
                  href={`tel:${astrologer.phone}`}
                  className="btn-primary w-full justify-center"
                >
                  {t("common.actions.callNow")}
                </a>

                <a
                  href={`https://wa.me/${astrologer.phone.replace("+", "")}`}
                  target="_blank"
                  className="flex w-full items-center justify-center rounded-lg border border-green-600 px-4 py-3 font-medium text-green-600"
                >
                  {t("common.actions.whatsApp")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
