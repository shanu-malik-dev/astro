"use client";

import { useEffect } from "react";

type SiteSnackbarProps = {
  message: string;
  title?: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
  duration?: number;
};

const TITLES = {
  success: "Guidance received",
  error: "Divine attention needed",
  info: "Sacred note",
};

function SpiritualIcon({ type }: { type: NonNullable<SiteSnackbarProps["type"]> }) {
  if (type === "error") {
    return (
      <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#f5d68a]/45 bg-[#c9932f]/15 font-display text-[2rem] leading-none text-[#f5d68a] shadow-[inset_0_0_16px_rgb(245_214_138_/_0.12),0_0_24px_rgb(201_147_47_/_0.22)]">
        ॐ
      </span>
    );
  }

  if (type === "info") {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="relative z-10 h-12 w-12 shrink-0 rounded-full border border-[#f5d68a]/45 bg-[#c9932f]/15 p-2 text-[#f5d68a] shadow-[inset_0_0_16px_rgb(245_214_138_/_0.12),0_0_24px_rgb(201_147_47_/_0.22)]"
      >
        <path
          d="M12 28h24c-1.2 7.5-5.8 12-12 12s-10.8-4.5-12-12Z"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          d="M10 28h28M17 28c.9-5.2 4-9.6 7-12.2 3 2.6 6.1 7 7 12.2M24 15c-3-4-1.5-8.2 1.5-11 4.5 4.7 5.2 9.6-1.5 11ZM11 40h26"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="relative z-10 h-12 w-12 shrink-0 rounded-full border border-[#f5d68a]/45 bg-[#c9932f]/15 p-2 text-[#f5d68a] shadow-[inset_0_0_16px_rgb(245_214_138_/_0.12),0_0_24px_rgb(201_147_47_/_0.22)]"
    >
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M24 6v36M6 24h36M11.3 11.3l25.4 25.4M36.7 11.3 11.3 36.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}

export function SiteSnackbar({
  message,
  title,
  type = "error",
  onClose,
  duration = 3500,
}: SiteSnackbarProps) {
  useEffect(() => {
    if (!message || !onClose || duration <= 0) return;
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[120] w-auto animate-site-snackbar-in overflow-hidden rounded-xl border border-[#c9932f]/80 bg-[#1a1330] text-sm shadow-[0_22px_70px_rgb(0_0_0_/_0.42),0_0_34px_rgb(201_147_47_/_0.12)] sm:left-auto sm:right-4 sm:top-24 sm:w-[calc(100vw-2rem)] sm:max-w-[28rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgb(245_214_138_/_0.16),transparent_8rem),linear-gradient(135deg,rgb(255_255_255_/_0.05),transparent_45%)]" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full border border-[#c9932f]/12" />
      <div className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full border border-[#f5d68a]/10" />
      <div className="relative h-[3px] bg-gradient-to-r from-transparent via-[#f5d68a] to-transparent shadow-[0_0_18px_rgb(245_214_138_/_0.7)]" />
      <div className="relative z-10 flex items-start gap-4 px-4.5 py-4 sm:px-5">
        <SpiritualIcon type={type} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-display text-[1.08rem] font-semibold leading-6 text-[#f5e9c8]">
            {title || TITLES[type]}
          </p>
          <p className="mt-1.5 text-[0.92rem] leading-6 text-[#cfc6b0]">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-lg leading-none text-[#cfc6b0]/75 transition hover:border-[#f5d68a]/30 hover:bg-[#c9932f]/10 hover:text-[#f5e9c8]"
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes site-snackbar-in {
          from {
            opacity: 0;
            transform: translate3d(0, -0.75rem, 0) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        .animate-site-snackbar-in {
          animation: site-snackbar-in 220ms ease-out both;
        }
      `}</style>
    </div>
  );
}
