"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { useAuth, ApiError } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/account";

  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      // Update login() according to your backend
      await login(mobile);

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
          <input
            type="tel"
            placeholder="Enter Mobile Number"
            value={mobile}
            maxLength={10}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, ""))
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