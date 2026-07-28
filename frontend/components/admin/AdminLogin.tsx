"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, Phone } from "lucide-react";
import { FullPageLoader } from "@/components/ui/FullPageLoader";
import { ApiError, useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/brand";
import { useCountryCodes } from "@/lib/country-code-store";
import { ADMIN_LOGIN_METHOD_FLAGS } from "@/lib/feature-flags";
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

type LoginMode = "emailPassword" | "mobileOtp";
type ForgotStep = "email" | "reset";

export function AdminLogin() {
  const {
    login,
    adminEmailLogin,
    verifyOtp,
    resendOtp,
    sendForgotPasswordOtp,
    resetForgotPassword,
    logout,
  } = useAuth();
  const { loading: countryCodesLoading } = useCountryCodes();
  const enabledModes = useMemo(
    () =>
      ([
        ADMIN_LOGIN_METHOD_FLAGS.emailPassword ? "emailPassword" : null,
        ADMIN_LOGIN_METHOD_FLAGS.mobileOtp ? "mobileOtp" : null,
      ].filter(Boolean) as LoginMode[]),
    []
  );
  const [mode, setMode] = useState<LoginMode>(enabledModes[0] || "mobileOtp");
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [mobileForm, setMobileForm] = useState({
    countryCode: "+91",
    mobile: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setOtpSecondsLeft(getOtpSecondsLeft(otpExpiresAt));
    if (!otpExpiresAt) return;

    const intervalId = window.setInterval(() => {
      setOtpSecondsLeft(getOtpSecondsLeft(otpExpiresAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [otpExpiresAt]);

  const assertAdmin = async (user: { role_id?: string | number; admin_modules?: string[] }) => {
    if (Number(user.role_id) === 1 || (user.admin_modules?.length || 0) > 0) return;

    await logout();
    throw new ApiError(403, "Only admin users can access this dashboard.");
  };

  const submitEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!emailForm.email.trim() || !emailForm.password.trim()) {
      setMessage("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const user = await adminEmailLogin(emailForm);
      await assertAdmin(user);
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Unable to login as admin."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitMobileLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    const validation = validateMobileNumber(
      mobileForm.countryCode,
      mobileForm.mobile,
      "en"
    );
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    if (otpSent && !/^\d{6}$/.test(mobileForm.otp)) {
      setMessage("Valid OTP is required.");
      return;
    }

    setLoading(true);
    try {
      if (!otpSent) {
        const response = await login({
          countryCode: mobileForm.countryCode,
          mobile: mobileForm.mobile,
        });
        if (!isOtpSentResponse(response)) {
          setMessage(response.message || "Unable to send OTP.");
          return;
        }

        setOtpExpiresAt(getOtpExpiresAt(response));
        setOtpSent(true);
        setMessage("OTP sent successfully.");
        return;
      }

      const user = await verifyOtp({
        countryCode: mobileForm.countryCode,
        mobile: mobileForm.mobile,
        otp: mobileForm.otp,
      });
      await assertAdmin(user);
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Unable to login as admin."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setMessage("");
    setLoading(true);
    try {
      const response = await resendOtp({
        countryCode: mobileForm.countryCode,
        mobile: mobileForm.mobile,
      });
      if (!isOtpSentResponse(response)) {
        setMessage(response.message || "Unable to resend OTP.");
        return;
      }

      setMobileForm((current) => ({ ...current, otp: "" }));
      setOtpExpiresAt(getOtpExpiresAt(response));
      setMessage("OTP resent successfully.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Unable to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotOpen(true);
    setForgotStep("email");
    setMessage("");
    setForgotForm({
      email: emailForm.email,
      otp: "",
      password: "",
      confirmPassword: "",
    });
  };

  const closeForgotPassword = () => {
    setForgotOpen(false);
    setForgotStep("email");
    setMessage("");
  };

  const submitForgotEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!forgotForm.email.trim()) {
      setMessage("Email is required.");
      return;
    }

    setLoading(true);
    try {
      await sendForgotPasswordOtp({ email: forgotForm.email });
      setForgotStep("reset");
      setMessage("OTP sent to your email.");
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Unable to send password OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitForgotReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(forgotForm.otp)) {
      setMessage("Valid OTP is required.");
      return;
    }
    if (!forgotForm.password || forgotForm.password !== forgotForm.confirmPassword) {
      setMessage("Password and confirm password must match.");
      return;
    }

    setLoading(true);
    try {
      await resetForgotPassword({
        email: forgotForm.email,
        otp: forgotForm.otp,
        password: forgotForm.password,
        confirm_password: forgotForm.confirmPassword,
      });
      setEmailForm((current) => ({
        ...current,
        email: forgotForm.email,
        password: "",
      }));
      closeForgotPassword();
      setMode("emailPassword");
      setMessage("Password reset successfully. Please sign in.");
    } catch (err) {
      setMessage(
        err instanceof ApiError ? err.message : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  if (enabledModes.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-sm text-ink/60">Admin login is disabled.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-[#191919]">
      {(loading || countryCodesLoading) && <FullPageLoader message="Please wait..." />}

      <div className="flex items-center gap-2">
        {BRAND.logoPath && (
          <img
            src={BRAND.logoPath}
            alt={BRAND.name}
            className="h-9 w-9 rounded-md object-contain"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
        <span className="text-2xl font-bold leading-none text-[#0a66c2] md:text-3xl">
          {BRAND.name}
        </span>
      </div>

      <section className="mx-auto mt-8 w-full max-w-[466px] rounded-lg border border-[#dedede] bg-white px-8 py-8 shadow-sm md:mt-6">
        <h1 className="text-[32px] font-semibold leading-tight text-[#191919]">
          Sign in
        </h1>
        <p className="mt-3 text-sm text-[#404040]">
          Access your admin dashboard
        </p>

        {enabledModes.length > 1 && (
          <div className="mt-7 grid grid-cols-2 rounded-full border border-[#b8b8b8] bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setMode("emailPassword");
                setMessage("");
              }}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold ${
                mode === "emailPassword" ? "bg-[#eef3f8] text-[#0a66c2]" : "text-[#404040]"
              }`}
            >
              <Mail size={15} />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("mobileOtp");
                setMessage("");
              }}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold ${
                mode === "mobileOtp" ? "bg-[#eef3f8] text-[#0a66c2]" : "text-[#404040]"
              }`}
            >
              <Phone size={15} />
              Mobile
            </button>
          </div>
        )}

        {mode === "emailPassword" && ADMIN_LOGIN_METHOD_FLAGS.emailPassword && (
          <form onSubmit={submitEmailLogin} className="mt-7 space-y-4">
            <label className="block text-sm text-[#191919]">
              Email
              <input
                type="email"
                value={emailForm.email}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="mt-1.5 h-12 w-full rounded-sm border border-[#666] bg-white px-3 text-base outline-none transition focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
              />
            </label>

            <label className="block text-sm text-[#191919]">
              Password
              <span className="relative mt-1.5 block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={emailForm.password}
                  onChange={(event) =>
                    setEmailForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-sm border border-[#666] bg-white px-3 pr-12 text-base outline-none transition focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#404040] hover:bg-[#eef3f8]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            <button
              type="button"
              onClick={openForgotPassword}
              className="text-sm font-semibold text-[#0a66c2] hover:underline"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0a66c2] text-base font-semibold text-white transition hover:bg-[#004182] disabled:opacity-70"
              disabled={loading}
            >
              <KeyRound size={16} />
              Sign in
            </button>
          </form>
        )}

        {mode === "mobileOtp" && ADMIN_LOGIN_METHOD_FLAGS.mobileOtp && (
          <form onSubmit={submitMobileLogin} className="mt-7 space-y-4">
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
              <div className="flex h-12 cursor-default select-none items-center justify-center rounded-sm border border-[#666] bg-white px-3 text-base text-[#191919]">
                +91
              </div>
              <input
                type="tel"
                value={mobileForm.mobile}
                maxLength={getMobileMaxLength(mobileForm.countryCode)}
                disabled={otpSent}
                onChange={(event) =>
                  setMobileForm((current) => ({
                    ...current,
                    mobile: event.target.value.replace(/\D/g, ""),
                  }))
                }
                className="h-12 min-w-0 rounded-sm border border-[#666] bg-white px-3 text-base text-[#191919] outline-none transition placeholder:text-[#8c8c8c] focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] disabled:bg-[#f3f2ef] disabled:text-[#666] disabled:opacity-70"
                placeholder="Mobile number"
              />
            </div>

            {otpSent && (
              <input
                type="tel"
                value={mobileForm.otp}
                maxLength={6}
                onChange={(event) =>
                  setMobileForm((current) => ({
                    ...current,
                    otp: event.target.value.replace(/\D/g, ""),
                  }))
                }
                className="h-12 w-full rounded-sm border border-[#666] bg-white px-3 text-base outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                placeholder="Enter OTP"
              />
            )}

            {otpSent && otpSecondsLeft > 0 && (
              <p className="text-center text-sm text-ink/60">
                OTP expires in{" "}
                <span className="font-medium text-ink">
                  {formatOtpSeconds(otpSecondsLeft)}
                </span>
              </p>
            )}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#0a66c2] text-base font-semibold text-white transition hover:bg-[#004182] disabled:opacity-70"
              disabled={loading}
            >
              {otpSent ? "Verify OTP" : "Send OTP"}
            </button>

            {otpSent && otpSecondsLeft === 0 && (
              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full text-sm font-semibold text-[#0a66c2] underline underline-offset-4"
              >
                Resend OTP
              </button>
            )}
          </form>
        )}

        {message && (
          <p className="mt-4 rounded-md border border-[#d6d6d6] bg-[#f3f2ef] px-3 py-2 text-sm text-[#404040]">
            {message}
          </p>
        )}
      </section>

      {forgotOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4 py-6">
          <section className="w-full max-w-[430px] rounded-lg border border-[#dedede] bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#191919]">
                  Forgot password
                </h2>
                <p className="mt-2 text-sm text-[#666]">
                  {forgotStep === "email"
                    ? "Enter your email to receive an OTP."
                    : "Enter the OTP and set your new password."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotPassword}
                className="rounded-full px-2 py-1 text-xl leading-none text-[#666] hover:bg-[#eef3f8] hover:text-[#191919]"
                aria-label="Close forgot password"
              >
                ×
              </button>
            </div>

            {forgotStep === "email" ? (
              <form onSubmit={submitForgotEmail} className="mt-6 space-y-4">
                <label className="block text-sm text-[#191919]">
                  Email
                  <input
                    type="email"
                    value={forgotForm.email}
                    onChange={(event) =>
                      setForgotForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-12 w-full rounded-sm border border-[#666] bg-white px-3 text-base outline-none transition focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#0a66c2] text-base font-semibold text-white transition hover:bg-[#004182] disabled:opacity-70"
                >
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={submitForgotReset} className="mt-6 space-y-4">
                <label className="block text-sm text-[#191919]">
                  OTP
                  <input
                    type="tel"
                    maxLength={6}
                    value={forgotForm.otp}
                    onChange={(event) =>
                      setForgotForm((current) => ({
                        ...current,
                        otp: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="mt-1.5 h-12 w-full rounded-sm border border-[#666] bg-white px-3 text-base outline-none transition focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </label>
                <label className="block text-sm text-[#191919]">
                  New password
                  <input
                    type="password"
                    value={forgotForm.password}
                    onChange={(event) =>
                      setForgotForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-12 w-full rounded-sm border border-[#666] bg-white px-3 text-base outline-none transition focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </label>
                <label className="block text-sm text-[#191919]">
                  Confirm password
                  <input
                    type="password"
                    value={forgotForm.confirmPassword}
                    onChange={(event) =>
                      setForgotForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-12 w-full rounded-sm border border-[#666] bg-white px-3 text-base outline-none transition focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#0a66c2] text-base font-semibold text-white transition hover:bg-[#004182] disabled:opacity-70"
                >
                  Reset password
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 hidden w-full justify-center gap-4 bg-white px-4 py-4 text-xs text-[#666] lg:flex">
        <span>{BRAND.name} © 2026</span>
        <span>Admin</span>
        <span>Privacy Policy</span>
        <span>Terms</span>
      </footer>
    </main>
  );
}
