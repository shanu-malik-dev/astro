"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Section } from "@/components/ui/Section";
import CustomSelect from "@/components/ui/CustomSelect";
import { FullPageLoader } from "@/components/ui/FullPageLoader";
import { useAuth, ApiError } from "@/lib/auth-context";
import { useCountryCodes } from "@/lib/country-code-store";
import { useLanguage } from "@/lib/language-context";
import {
  getMobileMaxLength,
  validateMobileNumber,
} from "@/lib/mobile-validation";
import {
  formatOtpSeconds,
  getOtpExpiresAt,
  getOtpSecondsLeft,
  isOtpSentResponse,
} from "@/lib/otp-expiry";

type MessageKey =
  | "nameRequired"
  | "countryRequired"
  | "mobileInvalid"
  | "otpRequired"
  | "otpSent"
  | "otpResent"
  | "sendFailed"
  | "registerFailed";

type PageMessage = {
  type: "error" | "success";
  key?: MessageKey;
  text?: string;
};

const messageKeys: Record<MessageKey, string> = {
  nameRequired: "register.validation.nameRequired",
  countryRequired: "common.validation.countryRequired",
  mobileInvalid: "common.validation.mobileInvalid",
  otpRequired: "common.validation.otpRequired",
  otpSent: "common.validation.otpSent",
  otpResent: "common.validation.otpResent",
  sendFailed: "common.validation.sendFailed",
  registerFailed: "register.registerFailed",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes();
  const { language, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/astrologers";

  const [form, setForm] = useState({
    fullName: "",
    countryCode: "",
    mobile: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState<PageMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);

  const messageText =
    message?.key === "mobileInvalid"
      ? validateMobileNumber(form.countryCode, form.mobile, language).message
      : message?.key
        ? t(messageKeys[message.key])
        : message?.text || "";

  useEffect(() => {
    if (!form.countryCode && countryCodes.length > 0) {
      setForm((currentForm) => ({
        ...currentForm,
        countryCode: countryCodes[0].value,
      }));
    }
  }, [form.countryCode, countryCodes]);

  useEffect(() => {
    setOtpSecondsLeft(getOtpSecondsLeft(otpExpiresAt));

    if (!otpExpiresAt) return;

    const intervalId = window.setInterval(() => {
      setOtpSecondsLeft(getOtpSecondsLeft(otpExpiresAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [otpExpiresAt]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage(null);

    if (!form.fullName.trim()) {
      setMessage({ type: "error", key: "nameRequired" });
      return;
    }

    if (!form.countryCode) {
      setMessage({ type: "error", key: "countryRequired" });
      return;
    }

    const mobileValidation = validateMobileNumber(
      form.countryCode,
      form.mobile,
      language
    );
    if (!mobileValidation.valid) {
      setMessage({ type: "error", key: "mobileInvalid" });
      return;
    }

    if (otpSent && !/^\d{6}$/.test(otp)) {
      setMessage({ type: "error", key: "otpRequired" });
      return;
    }

    setLoading(true);

    try {
      if (!otpSent) {
        const res = await register(form);
        if (!isOtpSentResponse(res)) {
          setMessage({
            type: "error",
            text: res.message || t("common.validation.sendFailed"),
          });
          return;
        }

        setOtpExpiresAt(getOtpExpiresAt(res));
        setOtpSent(true);
        setMessage({ type: "success", key: "otpSent" });
        return;
      }

      const user = await verifyOtp({
        countryCode: form.countryCode,
        mobile: form.mobile,
        otp,
      });
      router.push(Number(user.role_id) === 1 ? "/admin" : redirectTo);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : t("register.registerFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    setMessage(null);
    setResending(true);

    try {
      const res = await resendOtp({
        countryCode: form.countryCode,
        mobile: form.mobile,
      });
      if (!isOtpSentResponse(res)) {
        setMessage({
          type: "error",
          text: res.message || t("common.validation.sendFailed"),
        });
        return;
      }

      setOtp("");
      setOtpExpiresAt(getOtpExpiresAt(res));
      setMessage({ type: "success", key: "otpResent" });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : t("common.validation.sendFailed"),
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Section className="pt-20">
      {(countryCodesLoading || loading || resending) && (
        <FullPageLoader
          message={
            loading || resending
              ? t("common.actions.pleaseWait")
              : t("common.actions.pleaseWait")
          }
        />
      )}

      <div className="mx-auto max-w-sm">
        <p className="eyebrow">{t("register.eyebrow")}</p>

        <h1 className="mt-3 text-3xl font-semibold">
          {t("register.title")}
        </h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            required
            type="text"
            placeholder={t("register.fields.fullName")}
            value={form.fullName}
            onChange={(e) =>
              setForm({
                ...form,
                fullName: e.target.value,
              })
            }
            className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
          />

          <div className="flex gap-3">
            <div className="w-32">
              <CustomSelect
                instanceId="register-country-code"
                isDisabled={otpSent}
                isSearchable
                options={countryCodes}
                placeholder={t("common.fields.countryCode")}
                value={
                  countryCodes.find(
                    (option) => option.value === form.countryCode
                  ) || null
                }
                variant="light"
                onChange={(option) =>
                  setForm({
                    ...form,
                    countryCode: option?.value || "",
                  })
                }
              />
            </div>

            <input
              required
              type="tel"
              placeholder={t("common.fields.mobileNumber")}
              maxLength={getMobileMaxLength(form.countryCode)}
              disabled={otpSent}
              value={form.mobile}
              onChange={(e) =>
                setForm({
                  ...form,
                  mobile: e.target.value.replace(/\D/g, ""),
                })
              }
              className="min-w-0 flex-1 rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold disabled:opacity-70"
            />
          </div>

          {otpSent && (
            <input
              required
              type="tel"
              placeholder={t("common.fields.enterOtp")}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
            />
          )}

          {messageText && (
            <p
              className={
                message?.type === "success"
                  ? "text-sm text-green-700"
                  : "text-sm text-red-600"
              }
            >
              {messageText}
            </p>
          )}

          {otpSent && otpSecondsLeft > 0 && (
            <p className="text-center text-sm text-ink/60">
              {t("common.validation.otpExpiresIn")}{" "}
              <span className="font-medium text-ink">
                {formatOtpSeconds(otpSecondsLeft)}
              </span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading
              ? t("common.actions.pleaseWait")
              : otpSent
                ? t("common.actions.verifyOtp")
                : t("common.actions.continue")}
          </button>

          {otpSent && otpSecondsLeft === 0 && (
            <button
              type="button"
              disabled={resending || loading}
              onClick={onResendOtp}
              className="w-full text-sm font-medium text-wine underline underline-offset-4 disabled:opacity-60"
            >
              {resending
                ? t("common.actions.resending")
                : t("common.actions.resendOtp")}
            </button>
          )}
        </form>

        <p className="mt-6 text-sm text-ink/60">
          {t("register.loginPrompt")}{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-wine underline underline-offset-4"
          >
            {t("register.loginLink")}
          </Link>
        </p>
      </div>
    </Section>
  );
}
