"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { useAuth, ApiError } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/account";

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      await register(form);

      router.push(redirectTo);

      // Agar OTP page hai to:
      // router.push(`/verify-otp?phone=${form.phone}`);
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

          <input
            required
            type="tel"
            placeholder="Mobile Number"
            maxLength={10}
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value.replace(/\D/g, ""),
              })
            }
            className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm outline-none focus:border-gold"
          />

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
            {loading ? "Please wait..." : "Continue"}
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