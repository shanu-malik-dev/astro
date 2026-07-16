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

export default function LoginPage() {
  const { login, verifyOtp } = useAuth();
  const { countryCodes } = useCountryCodes();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/account";

  const [countryCode, setCountryCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!countryCode && countryCodes.length > 0) {
      setCountryCode(countryCodes[0].value);
    }
  }, [countryCode, countryCodes]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!countryCode) {
      setError("Please select a country code.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
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
        const res = await login({ countryCode, mobile });
        if (res.statusCode !== 2) {
          setError(res.message || "Unable to send OTP. Please try again.");
          return;
        }

        setOtpSent(true);
        return;
      }

      await verifyOtp({ countryCode, mobile, otp });
      router.push(redirectTo);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section className="pt-20">
      <div className="mx-auto max-w-sm">

        <p className="eyebrow">Welcome Back</p>

        <h1 className="mt-3 text-3xl font-semibold">
          Login with Mobile
        </h1>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4"
        >
          <div className="flex gap-3">
            <div className="w-32">
              <Select<CountryCodeOption>
                instanceId="login-country-code"
                isDisabled={otpSent}
                isSearchable
                options={countryCodes}
                placeholder="Code"
                styles={countrySelectStyles}
                value={
                  countryCodes.find(
                    (option) => option.value === countryCode
                  ) || null
                }
                onChange={(option) =>
                  setCountryCode(option?.value || "")
                }
              />
            </div>

            <input
              type="tel"
              placeholder="Enter Mobile Number"
              value={mobile}
              maxLength={10}
              disabled={otpSent}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, ""))
              }
              className="min-w-0 flex-1 rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold disabled:opacity-70"
            />
          </div>

          {otpSent && (
            <input
              type="tel"
              placeholder="Enter OTP"
              value={otp}
              maxLength={6}
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

        <p className="mt-6 text-center text-sm text-ink/60">
          Don't have an account?{" "}
          <Link
            href={`/register?redirect=${encodeURIComponent(
              redirectTo
            )}`}
            className="text-wine underline underline-offset-4"
          >
            Register
          </Link>
        </p>

      </div>
    </Section>
  );
}
