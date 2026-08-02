"use client";

import { LoaderIconCycler } from "./LoaderIconCycler";

type FullPageLoaderProps = {
  message?: string;
};

export function FullPageLoader({ message = "Loading..." }: FullPageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="fixed inset-0 z-[120] grid min-h-screen place-items-center overflow-hidden bg-ink/75 px-4 text-parchment backdrop-blur-sm"
    >
      <div className="relative z-10 flex min-h-44 w-56 flex-col items-center justify-center gap-4 rounded-lg border border-white/10 bg-[#151521]/95 px-7 py-6 text-center shadow-2xl">
        <LoaderIconCycler />
        <p className="text-sm font-medium text-parchment/80">{message}</p>
      </div>
    </div>
  );
}
