"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import CustomSelect, { SelectOption } from "../ui/CustomSelect";
import { useCountryCodes } from "@/lib/country-code-store";

const concerns: SelectOption[] = [
  { value: "love", label: "❤️ Love & Relationship" },
  { value: "career", label: "💼 Career" },
  { value: "marriage", label: "💍 Marriage" },
  { value: "finance", label: "💰 Finance" },
  { value: "family", label: "👨‍👩‍👧 Family" },
  { value: "health", label: "🩺 Health" },
  { value: "other", label: "✨ Other" },
];

export function Hero() {
  const { countryCodes } = useCountryCodes();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [countryCode, setCountryCode] = useState<SelectOption | null>(null);

  const [concern, setConcern] = useState<SelectOption | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryCode && countryCodes.length > 0) {
      setCountryCode(countryCodes[0]);
    }
  }, [countryCode, countryCodes]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!countryCode) {
      alert("Please select country code.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert("Please enter a valid 10 digit phone number.");
      return;
    }

    if (!concern) {
      alert("Please select your concern.");
      return;
    }

    setLoading(true);

    const formData = {
      name,
      phone: countryCode.value + phone,
      concern: concern.value,
    };

    console.log(formData);

    // ==========================
    // API CALL
    // ==========================
    // await fetch("/api/consultation", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(formData),
    // });

    setTimeout(() => {
      alert("Consultation Booked Successfully!");

      setName("");
      setPhone("");
      setConcern(null);
      setCountryCode(null);

      setLoading(false);
    }, 1000);
  };

  return (
    <section className="relative overflow-hidden bg-ink text-parchment">
      <div className="pointer-events-none absolute inset-0 bg-grain" />

      <Container className="relative grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-20">

        {/* LEFT */}
        <div>
          <p className="eyebrow-on-dark">
            A private reading, not a script
          </p>

          <h1 className="mt-6 text-4xl leading-tight sm:text-5xl lg:text-7xl lg:leading-[1.05]">
            Clarity on love,
            <br />
            career and the
            <br />
            decisions you're
            <span className="text-gold-light italic">
              {" "}
              circling.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-parchment/70 sm:text-lg sm:leading-8">
            Personal astrology consultations designed to help you move forward
            with confidence. Every reading is private, practical and focused on
            your real questions.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-parchment/70">
            <div>✓ 1000+ Consultations</div>
            <div>✓ Private & Confidential</div>
            <div>✓ Video Sessions</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="mx-auto w-full max-w-md">

          <div className="rounded-2xl border border-white/10 bg-[#151521]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">

            <h3 className="text-2xl font-serif">
              Book Your Consultation
            </h3>

            <p className="mt-2 text-sm text-parchment/60">
              Fill your details to schedule your private reading.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >

              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
              />

              <div className="flex flex-col gap-3 sm:flex-row">

                <div className="w-full sm:w-28">
                  <CustomSelect
                    options={countryCodes}
                    value={countryCode}
                    onChange={(option) => {
                      if (option) setCountryCode(option);
                    }}
                  />
                </div>

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  maxLength={10}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, ""))
                  }
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-parchment placeholder:text-parchment/40 outline-none focus:border-gold-light"
                />
              </div>

              <CustomSelect
                options={concerns}
                value={concern}
                placeholder="Select Your Concern"
                onChange={(option) => setConcern(option)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gold px-5 py-3 font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Booking..." : "Book Consultation"}
              </button>

            </form>

            <div className="mt-5 flex justify-between text-xs text-parchment/50">
              <span>🔒 Private</span>
              <span>★★★★★ Trusted</span>
              <span>Online</span>
            </div>

          </div>

        </div>

      </Container>
    </section>
  );
}
