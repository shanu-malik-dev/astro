"use client";

type SiteSnackbarProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
};

export function SiteSnackbar({
  message,
  type = "error",
  onClose,
}: SiteSnackbarProps) {
  if (!message) return null;

  return (
    <div className="fixed right-4 top-24 z-[120] w-[calc(100vw-2rem)] max-w-sm rounded-lg border border-white/10 bg-[#151521] px-4 py-3 text-sm text-parchment shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <p className={type === "success" ? "text-green-200" : "text-red-200"}>
          {message}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-parchment/50 hover:text-parchment"
            aria-label="Close notification"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}
