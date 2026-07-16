"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Select, { StylesConfig } from "react-select";
import { Section } from "@/components/ui/Section";
import { useAuth, ApiError } from "@/lib/auth-context";
import { CountryCodeOption, useCountryCodes } from "@/lib/country-code-store";

const countrySelectStyles: StylesConfig<CountryCodeOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderColor: state.isFocused ? "#c59d5f" : "#d8d2c4",
    backgroundColor: "transparent",
    borderRadius: 6,
    boxShadow: "none",
    fontSize: 14,
    "&:hover": {
      borderColor: state.isFocused ? "#c59d5f" : "#d8d2c4",
    },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  menu: (base) => ({ ...base, zIndex: 20 }),
};

export default function RegisterPage() {
  const { register, verifyOtp } = useAuth();
  const { countryCodes } = useCountryCodes();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/account";

  const [form, setForm] = useState({
    fullName: "",
    countryCode: "",
    mobile: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.countryCode && countryCodes.length > 0) {
      setForm((currentForm) => ({
        ...currentForm,
        countryCode: countryCodes[0].value,
      }));
    }
  }, [form.countryCode, countryCodes]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.countryCode) {
      setError("Please select a country code.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (otpSent && !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      if (!otpSent) {
        const res = await register(form);
        if (res.statusCode !== 2) {
          setError(res.message || "Unable to send OTP. Please try again.");
          return;
        }

        setOtpSent(true);
        return;
      }

      await verifyOtp({
        countryCode: form.countryCode,
        mobile: form.mobile,
        otp,
      });
      router.push(redirectTo);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section className="pt-20">
      <div className="mx-auto max-w-sm">
        <p className="eyebrow">Get Started</p>

        <h1 className="mt-3 text-3xl font-semibold">
          Create your account
        </h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            required
            type="text"
            placeholder="Full Name"
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
              <Select<CountryCodeOption>
                instanceId="register-country-code"
                isDisabled={otpSent}
                isSearchable
                options={countryCodes}
                placeholder="Code"
                styles={countrySelectStyles}
                value={
                  countryCodes.find(
                    (option) => option.value === form.countryCode
                  ) || null
                }
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
              placeholder="Mobile Number"
              maxLength={10}
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
              placeholder="Enter OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
            />
          )}

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Continue"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/60">
          Already have an account?{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-wine underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </Section>
  );
}
