"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Phone,
  Star,
  User,
  MessageCircle,
  Languages,
  BriefcaseBusiness,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

const PAGE_SIZE = 8;

const astrologers = [
  {
    id: 1,
    key: "rahul",
    image: "",
    rating: 4.9,
    phone: "+919876543210",
  },
  {
    id: 2,
    key: "anil",
    image: "",
    rating: 4.8,
    phone: "+919876543211",
  },
  {
    id: 3,
    key: "neha",
    image: "",
    rating: 5,
    phone: "+919876543212",
  },
  {
    id: 4,
    key: "meera",
    image: "",
    rating: 4.9,
    phone: "+919876543213",
  },
  {
    id: 5,
    key: "vikram",
    image: "",
    rating: 4.8,
    phone: "+919876543214",
  },
  {
    id: 6,
    key: "kavita",
    image: "",
    rating: 4.7,
    phone: "+919876543215",
  },
  {
    id: 7,
    key: "suresh",
    image: "",
    rating: 4.9,
    phone: "+919876543216",
  },
  {
    id: 8,
    key: "pooja",
    image: "",
    rating: 4.8,
    phone: "+919876543217",
  },
  {
    id: 9,
    key: "devendra",
    image: "",
    rating: 5,
    phone: "+919876543218",
  },
  {
    id: 10,
    key: "isha",
    image: "",
    rating: 4.7,
    phone: "+919876543219",
  },
];

export default function AstrologersPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const loginHref = "/login?redirect=/astrologers";
  const signupHref = "/register?redirect=/astrologers";
  const totalPages = Math.ceil(astrologers.length / PAGE_SIZE);
  const paginatedAstrologers = astrologers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const requireAuth = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (user) return;

    event.preventDefault();
    setAuthModalOpen(true);
  };

  return (
    <>
      <Section tone="dark" className="py-10 md:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow-on-dark">{t("astrologersPage.eyebrow")}</p>

          <h1 className="mt-3 text-3xl md:text-4xl">
            {t("astrologersPage.title")}
          </h1>

          <p className="mt-4 text-sm leading-6 text-parchment/70 md:text-base">
            {t("astrologersPage.description")}
          </p>
        </div>
      </Section>

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paginatedAstrologers.map((astrologer) => (
            <div
              key={astrologer.id}
              className="flex min-h-[430px] flex-col rounded-lg border border-mist bg-white p-4 shadow-sm transition hover:border-gold/70 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                {astrologer.image ? (
                  <Image
                    src={astrologer.image}
                    alt={t(`astrologersPage.experts.${astrologer.key}.name`)}
                    width={72}
                    height={72}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                    <User className="h-8 w-8 text-amber-700" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 min-h-[48px] text-base font-semibold leading-6 text-ink">
                    {t(`astrologersPage.experts.${astrologer.key}.name`)}
                  </h2>

                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                    <Star size={13} fill="currentColor" />
                    {astrologer.rating}
                  </span>
                </div>
              </div>

              <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-ink/65">
                {t(`astrologersPage.experts.${astrologer.key}.about`)}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-md bg-parchment px-3 py-2">
                  <span className="flex items-center gap-2 text-ink/60">
                    <BriefcaseBusiness size={16} />
                    {t("astrologersPage.labels.experience")}
                  </span>
                  <span className="font-medium text-ink">
                    {t(`astrologersPage.experts.${astrologer.key}.experience`)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-md bg-parchment px-3 py-2">
                  <span className="flex items-center gap-2 text-ink/60">
                    <Languages size={16} />
                    {t("astrologersPage.labels.languages")}
                  </span>
                  <span className="truncate text-right font-medium text-ink">
                    {t(`astrologersPage.experts.${astrologer.key}.languages`)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-md bg-parchment px-3 py-2">
                  <span className="text-ink/60">
                    {t("astrologersPage.labels.consultations")}
                  </span>
                  <span className="font-medium text-ink">
                    {t(`astrologersPage.experts.${astrologer.key}.consultations`)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap gap-1.5">
                  {t(`astrologersPage.experts.${astrologer.key}.expertise`).split(", ").map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto grid gap-2 pt-5">
                <a
                  href={user ? `tel:${astrologer.phone}` : loginHref}
                  onClick={requireAuth}
                  className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  <Phone size={16} />
                  {t("common.actions.callNow")}
                </a>

                <a
                  href={
                    user
                      ? `https://wa.me/${astrologer.phone.replace("+", "")}`
                      : loginHref
                  }
                  onClick={requireAuth}
                  target={user ? "_blank" : undefined}
                  rel={user ? "noreferrer" : undefined}
                  className="flex items-center justify-center gap-2 rounded-md border border-green-600 px-3 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50"
                >
                  <MessageCircle size={16} />
                  {t("common.actions.whatsApp")}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="rounded-md border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("astrologersPage.labels.previous")}
          </button>

          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1;

            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={
                  page === currentPage
                    ? "rounded-md border border-gold bg-gold px-4 py-2 text-sm font-medium text-black"
                    : "rounded-md border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink"
                }
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="rounded-md border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("astrologersPage.labels.next")}
          </button>
        </div>
      </Section>

      {authModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/55 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-required-title"
            className="w-full max-w-sm rounded-lg border border-mist bg-parchment p-6 shadow-2xl"
          >
            <h2 id="auth-required-title" className="text-xl font-semibold text-ink">
              {t("astrologersPage.loginRequiredTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              {t("astrologersPage.loginRequired")}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href={loginHref} className="btn-primary justify-center">
                {t("common.actions.login")}
              </Link>
              <Link
                href={signupHref}
                className="inline-flex items-center justify-center rounded-md border border-gold px-4 py-3 text-sm font-medium text-ink transition hover:bg-gold hover:text-black"
              >
                {t("astrologersPage.signup")}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="mt-4 w-full text-sm font-medium text-ink/60 underline underline-offset-4 hover:text-ink"
            >
              {t("astrologersPage.loginRequiredCancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
