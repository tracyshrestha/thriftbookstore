import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Wallet, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";

const PRESETS_CENTS = [1000, 2500, 5000, 10000, 25000]; // $10–$250

/** Above cart (60–80), page modals (70), toasts (100) */
const Z_OVERLAY = "z-[200]";
const Z_CONFIRM = "z-[210]";

function formatCredits(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RechargeCreditsModal({ open, onClose }: Props) {
  const { credits, rechargeCredits } = useUser();
  const { toast } = useToast();
  const titleId = useId();
  const confirmId = useId();

  const [selectedCents, setSelectedCents] = useState(2500);
  const [customDollars, setCustomDollars] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedCents(2500);
    setCustomDollars("");
    setConfirmOpen(false);
    setIsSubmitting(false);
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmOpen) setConfirmOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmOpen, onClose]);

  if (!open || typeof document === "undefined") return null;

  const customCents = (() => {
    const n = Number(customDollars);
    if (!customDollars.trim() || !Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  })();

  const amountCents = customCents ?? selectedCents;
  const amountValid = amountCents > 0 && amountCents <= 1_000_000;

  const handleContinue = () => {
    setError("");
    if (!amountValid) {
      setError("Enter a valid amount between $0.01 and $10,000.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmYes = async () => {
    if (!amountValid) return;
    setIsSubmitting(true);
    setError("");
    try {
      const next = await rechargeCredits(amountCents);
      if (next === null) {
        setError("Could not add credits. Try again.");
        return;
      }
      toast({
        message: `Added ${formatCredits(amountCents)}. Balance ${formatCredits(next)}.`,
        variant: "success",
      });
      setConfirmOpen(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 ${Z_OVERLAY} flex items-center justify-center p-4`}
      style={{ isolation: "isolate" }}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink-950/50"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-md rounded-xl border border-ink-100 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-800">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink-950">
                Add credits
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Current balance{" "}
                <span className="font-medium text-ink-800 tabular-nums">
                  {formatCredits(credits)}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-ink-600 mt-4">
          Choose a recharge amount for your thrift wallet.
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {PRESETS_CENTS.map((cents) => {
            const active = customCents === null && selectedCents === cents;
            return (
              <button
                key={cents}
                type="button"
                onClick={() => {
                  setSelectedCents(cents);
                  setCustomDollars("");
                  setError("");
                }}
                className={`h-10 rounded-lg border text-sm font-medium tabular-nums transition-colors ${
                  active
                    ? "border-ink-700 bg-ink-800 text-white"
                    : "border-ink-100 bg-white text-ink-800 hover:bg-ink-50"
                }`}
              >
                {formatCredits(cents)}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-ink-500">
            Or custom amount (USD)
          </span>
          <div className="mt-1.5 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">
              $
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 40"
              value={customDollars}
              onChange={(e) => {
                setCustomDollars(e.target.value);
                setError("");
              }}
              className="h-11 w-full rounded-lg border border-ink-100 bg-white pl-7 pr-3 text-sm text-ink-950 outline-none focus:border-ink-300 focus:ring-2 focus:ring-ink-100"
            />
          </div>
        </label>

        <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm flex items-center justify-between gap-2">
          <span className="text-ink-500">You will add</span>
          <span className="font-semibold text-ink-950 tabular-nums">
            {formatCredits(amountCents)}
          </span>
        </div>
        <div className="mt-1.5 text-xs text-ink-400 flex justify-between tabular-nums">
          <span>New balance</span>
          <span className="text-ink-700 font-medium">
            {formatCredits(credits + amountCents)}
          </span>
        </div>

        {error && (
          <p className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-ink-100 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="h-10 px-4 rounded-lg bg-ink-800 text-sm font-medium text-white hover:bg-ink-900"
          >
            Continue
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div
          className={`fixed inset-0 ${Z_CONFIRM} flex items-center justify-center p-4`}
        >
          <button
            type="button"
            aria-label="Close confirmation"
            className="absolute inset-0 bg-ink-950/40"
            onClick={() => !isSubmitting && setConfirmOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={confirmId}
            className="relative z-[1] w-full max-w-sm rounded-xl border border-ink-100 bg-white p-5 shadow-2xl"
          >
            <h3
              id={confirmId}
              className="text-lg font-semibold text-ink-950"
            >
              Are you sure?
            </h3>
            <p className="text-sm text-ink-600 mt-2">
              Add{" "}
              <span className="font-semibold text-ink-900 tabular-nums">
                {formatCredits(amountCents)}
              </span>{" "}
              to your thrift credits? Your balance will become{" "}
              <span className="font-semibold text-ink-900 tabular-nums">
                {formatCredits(credits + amountCents)}
              </span>
              .
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmOpen(false)}
                className="h-10 px-4 rounded-lg border border-ink-100 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmYes}
                className="h-10 px-4 rounded-lg bg-ink-800 text-sm font-medium text-white hover:bg-ink-900 disabled:opacity-50"
              >
                {isSubmitting ? "Adding…" : "Yes, add credits"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
