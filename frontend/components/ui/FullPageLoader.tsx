import { LoaderCircle } from "lucide-react";

type FullPageLoaderProps = {
  message?: string;
};

export function FullPageLoader({ message = "Loading..." }: FullPageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="fixed inset-0 z-[120] flex min-h-screen items-center justify-center bg-ink/70 px-4 text-parchment backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg border border-white/10 bg-[#151521]/95 px-8 py-7 shadow-2xl">
        <LoaderCircle className="h-10 w-10 animate-spin text-gold-light" />
        <p className="text-sm font-medium text-parchment/80">{message}</p>
      </div>
    </div>
  );
}
