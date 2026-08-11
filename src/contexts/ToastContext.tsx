import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Check, Heart, Info, X } from "lucide-react";

export type ToastVariant = "default" | "success" | "heart";

export type ToastInput = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastContextValue = {
  toast: (input: ToastInput | string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput | string) => {
      const payload: ToastInput =
        typeof input === "string" ? { message: input } : input;
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        message: payload.message,
        variant: payload.variant ?? "default",
        duration: payload.duration ?? 2600,
      };
      setToasts((prev) => [...prev.slice(-3), item]);
      window.setTimeout(() => dismiss(id), item.duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 min-w-[240px] max-w-sm rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-lg shadow-ink-900/10 animate-[toast-in_0.25s_ease-out]"
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                t.variant === "heart"
                  ? "bg-rose-50 text-rose-500"
                  : t.variant === "success"
                    ? "bg-ink-50 text-ink-700"
                    : "bg-ink-50 text-ink-500"
              }`}
            >
              {t.variant === "heart" ? (
                <Heart className="h-3.5 w-3.5 fill-current" />
              ) : t.variant === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Info className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="text-sm text-ink-900 font-medium flex-1 pt-0.5">
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-ink-300 hover:text-ink-600 p-0.5"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
