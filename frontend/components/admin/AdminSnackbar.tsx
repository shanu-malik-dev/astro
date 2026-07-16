"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type SnackbarType = "success" | "error";

type SnackbarState = {
  id: number;
  type: SnackbarType;
  message: string;
} | null;

type SnackbarContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  clear: () => void;
  setPageLoading: (loading: boolean) => void;
  confirm: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }) => Promise<boolean>;
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (confirmed: boolean) => void;
} | null;

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function AdminSnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const show = useCallback((type: SnackbarType, message: string) => {
    setSnackbar({
      id: Date.now(),
      type,
      message,
    });
  }, []);

  const clear = useCallback(() => setSnackbar(null), []);

  const confirm = useCallback(
    ({
      title,
      message,
      confirmLabel = "Delete",
      cancelLabel = "Cancel",
    }: {
      title: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
    }) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({
          title,
          message,
          confirmLabel,
          cancelLabel,
          resolve,
        });
      }),
    []
  );

  const closeConfirm = (confirmed: boolean) => {
    confirmState?.resolve(confirmed);
    setConfirmState(null);
  };

  useEffect(() => {
    if (!snackbar) return;

    const timeout = window.setTimeout(() => {
      setSnackbar(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  const value = useMemo(
    () => ({
      success: (message: string) => show("success", message),
      error: (message: string) => show("error", message),
      clear,
      setPageLoading,
      confirm,
    }),
    [clear, confirm, show]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}

      {pageLoading && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-white/65 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border border-mist bg-white px-5 py-4 text-sm font-medium text-ink shadow-2xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            Please wait...
          </div>
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-mist bg-white shadow-2xl">
            <div className="border-b border-mist bg-parchment px-5 py-4">
              <h2 className="text-lg font-semibold text-ink">
                {confirmState.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                {confirmState.message}
              </p>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-md border border-mist bg-white px-4 py-2.5 text-sm font-medium text-ink/65 hover:text-ink"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar && (
        <div className="fixed right-4 top-20 z-[120] w-[calc(100%-2rem)] max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-2xl ${
              snackbar.type === "success"
                ? "border-green-200 text-green-800"
                : "border-red-200 text-red-700"
            }`}
          >
            {snackbar.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
            ) : (
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
            )}
            <p className="min-w-0 flex-1 leading-5">{snackbar.message}</p>
            <button
              type="button"
              onClick={clear}
              className="rounded p-0.5 text-ink/45 transition hover:bg-ink/5 hover:text-ink"
              aria-label="Close message"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </SnackbarContext.Provider>
  );
}

export function useAdminSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useAdminSnackbar must be used inside AdminSnackbarProvider");
  }
  return context;
}
