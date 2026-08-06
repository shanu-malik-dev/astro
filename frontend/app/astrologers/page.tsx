"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  Phone,
  Star,
  User,
  Languages,
  BriefcaseBusiness,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { DisabledRouteRedirect } from "@/components/DisabledRouteRedirect";
import { FullPageLoader } from "@/components/ui/FullPageLoader";
import { PublicAssetImage } from "@/components/ui/PublicAssetImage";
import { SiteSnackbar } from "@/components/ui/SiteSnackbar";
import { ApiError, astrologerApi, type PublicAstrologerDto } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api-service";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useTenant } from "@/lib/tenant-context";
import { WEBSITE_MODULE_FLAGS } from "@/lib/visibility-flags";

const PAGE_SIZE = 10;
const SUPPORT_PHONE = "+919876543210";
const SHOW_ASTROLOGER_CALL_BUTTON = false;
const SHOW_ASTROLOGER_WHATSAPP_BUTTON = false;
const SHOW_ASTROLOGER_ACTIONS =
  SHOW_ASTROLOGER_CALL_BUTTON || SHOW_ASTROLOGER_WHATSAPP_BUTTON;

type AstrologerWithPhoto = PublicAstrologerDto & {
  photo?: string;
  image_url?: string;
  profile_image?: string;
};

function getApiAssetBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function resolveImageUrl(value?: string) {
  const image = value?.trim();
  if (!image) return "";
  if (/^(data:|blob:)/i.test(image)) return image;

  const uploadPathIndex = image.indexOf("/uploads/");
  if (uploadPathIndex >= 0) {
    return `${getApiAssetBaseUrl()}${image.slice(uploadPathIndex)}`;
  }

  if (/^https?:\/\//i.test(image)) return image;

  return `${getApiAssetBaseUrl()}${image.startsWith("/") ? "" : "/"}${image}`;
}

function getAstrologerPhoto(astrologer: PublicAstrologerDto) {
  const record = astrologer as AstrologerWithPhoto;
  return resolveImageUrl(
    record.image ||
    record.photo ||
    record.image_url ||
    record.profile_image ||
    ""
  );
}

function DummyAstrologerAvatar() {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-parchment shadow-[0_12px_28px_rgba(176,138,46,0.18)] ring-1 ring-gold/20">
      <User className="h-9 w-9 text-gold-dark/70" />
    </div>
  );
}

export default function AstrologersPage() {
  const { language, t } = useLanguage();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [astrologers, setAstrologers] = useState<PublicAstrologerDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const loginHref = "/login?redirect=/astrologers";
  const signupHref = "/register?redirect=/astrologers";

  const loadAstrologers = useCallback(
    async (page: number) => {
      setLoading(true);
      setSnackbar("");

      try {
        const response = await astrologerApi.listPublic(tenant.id, {
          page,
          limit: PAGE_SIZE,
        });
        const records = response.data?.records || [];
        const pagination = response.data?.pagination;

        setAstrologers(records);
        setCurrentPage(pagination?.page || page);
        setTotalPages(pagination?.total_pages || 1);
      } catch (err) {
        setSnackbar(
          err instanceof ApiError
            ? err.message
            : "Unable to load astrologers."
        );
      } finally {
        setLoading(false);
      }
    },
    [tenant.id]
  );

  useEffect(() => {
    if (!WEBSITE_MODULE_FLAGS.astrologers) return;

    loadAstrologers(1);
  }, [loadAstrologers]);

  useEffect(() => {
    if (!snackbar) return;
    const timeout = window.setTimeout(() => setSnackbar(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  const requireAuth = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (user) return;

    event.preventDefault();
    setAuthModalOpen(true);
  };

  if (!WEBSITE_MODULE_FLAGS.astrologers) return <DisabledRouteRedirect />;

  return (
    <>
      {loading && <FullPageLoader message={t("common.actions.pleaseWait")} />}
      <SiteSnackbar message={snackbar} onClose={() => setSnackbar("")} />

      <Section tone="dark" className="!py-6 md:!py-8">
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

      <Section className="content-section">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {astrologers.map((astrologer) => {
            const name =
              language === "hi" ? astrologer.hi_name : astrologer.en_name;
            const description =
              language === "hi"
                ? astrologer.hi_description
                : astrologer.en_description;
            const expertise =
              language === "hi"
                ? astrologer.hi_expertise
                : astrologer.en_expertise;
            const photo = getAstrologerPhoto(astrologer);

            return (
              <div
                key={astrologer.id}
                className={`group relative flex flex-col overflow-hidden rounded-lg border border-gold/25 bg-white p-4 shadow-[0_14px_40px_rgba(20,19,31,0.08)] transition duration-300 hover:-translate-y-1 hover:border-gold/80 hover:shadow-[0_22px_54px_rgba(176,138,46,0.22)] ${
                  SHOW_ASTROLOGER_ACTIONS ? "min-h-[430px]" : ""
                }`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-wine via-gold to-indigo opacity-85" />
                <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full bg-gold/10 transition group-hover:bg-gold/20" />

                <div className="relative flex items-start gap-3">
                  {photo ? (
                    <PublicAssetImage
                      src={photo}
                      alt={name}
                      width={72}
                      height={72}
                      fallback={<DummyAstrologerAvatar />}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-[0_12px_28px_rgba(176,138,46,0.22)] ring-1 ring-gold/20"
                    />
                  ) : (
                    <DummyAstrologerAvatar />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex min-h-[48px] items-start gap-2">
                      <h2 className="line-clamp-2 text-base font-semibold leading-6 text-ink">
                        {name}
                      </h2>
                      {astrologer.live && (
                        <span
                          className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]"
                          title="Live now"
                          aria-label="Live now"
                        />
                      )}
                    </div>

                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-dark ring-1 ring-gold/20">
                      <Star size={13} fill="currentColor" />
                      {Number(astrologer.rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>

                <p className="relative mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-ink/65">
                  {description}
                </p>

                <div className="relative mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-md border border-mist/60 bg-parchment/80 px-3 py-2.5 shadow-sm">
                    <span className="flex items-center gap-2 text-ink/60">
                      <BriefcaseBusiness size={16} />
                      {t("astrologersPage.labels.experience")}
                    </span>
                    <span className="font-medium text-ink">
                      {astrologer.experience}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-md border border-mist/60 bg-parchment/80 px-3 py-2.5 shadow-sm">
                    <span className="flex items-center gap-2 text-ink/60">
                      <Languages size={16} />
                      {t("astrologersPage.labels.languages")}
                    </span>
                    <span className="truncate text-right font-medium text-ink">
                      {astrologer.languages}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-md border border-mist/60 bg-parchment/80 px-3 py-2.5 shadow-sm">
                    <span className="text-ink/60">
                      {t("astrologersPage.labels.consultations")}
                    </span>
                    <span className="font-medium text-ink">
                      {astrologer.consultations ? astrologer.consultations + "+":0}
                    </span>
                  </div>
                </div>

                <div className="relative mt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {expertise.split(",").map((value) => {
                      const item = value.trim();
                      if (!item) return null;

                      return (
                        <span
                          key={item}
                          className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-dark ring-1 ring-gold/20"
                        >
                          {item}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {SHOW_ASTROLOGER_ACTIONS && (
                  <div className="mt-auto grid gap-2 pt-5">
                    {SHOW_ASTROLOGER_CALL_BUTTON && (
                      <a
                        href={user ? `tel:${SUPPORT_PHONE}` : loginHref}
                        onClick={requireAuth}
                        className="flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                      >
                        <Phone size={16} />
                        {t("common.actions.callNow")}
                      </a>
                    )}

                    {SHOW_ASTROLOGER_WHATSAPP_BUTTON && (
                      <a
                        href={
                          user
                            ? `https://wa.me/${SUPPORT_PHONE.replace("+", "")}`
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && astrologers.length === 0 && (
          <div className="rounded-lg border border-mist bg-white px-4 py-8 text-center text-sm text-ink/60">
            No astrologers found.
          </div>
        )}

        {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => loadAstrologers(Math.max(1, currentPage - 1))}
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
                onClick={() => loadAstrologers(page)}
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
            onClick={() => loadAstrologers(Math.min(totalPages, currentPage + 1))}
            className="rounded-md border border-mist px-4 py-2 text-sm font-medium text-ink/70 transition hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("astrologersPage.labels.next")}
          </button>
        </div>
        )}
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
