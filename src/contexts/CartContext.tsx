import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Book } from "@/types/book.types";
import {
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";

const STORAGE_KEY = "thrift_cart";

export type CartLine = {
  book: Book;
  quantity: number;
};

type CheckoutSuccess = {
  totalCents: number;
  itemCount: number;
  creditsRemaining: number;
  titles: string[];
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  totalCents: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  setQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCart(items: CartLine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, credits, spendCredits } = useUser();
  const { toast } = useToast();
  const [items, setItems] = useState<CartLine[]>(() => loadCart());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [success, setSuccess] = useState<CheckoutSuccess | null>(null);

  useEffect(() => {
    persistCart(items);
  }, [items]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmOpen) setConfirmOpen(false);
        else setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawerOpen, confirmOpen]);

  const addToCart = useCallback((book: Book) => {
    setSuccess(null);
    setCheckoutError("");
    setItems((prev) => {
      const existing = prev.find((line) => line.book.id === book.id);
      if (existing) {
        return prev.map((line) =>
          line.book.id === book.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((line) => line.book.id !== bookId));
  }, []);

  const setQuantity = useCallback((bookId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((line) => line.book.id !== bookId);
      }
      return prev.map((line) =>
        line.book.id === bookId ? { ...line, quantity } : line,
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, line) => sum + line.quantity, 0),
    [items],
  );

  const totalCents = useMemo(
    () => items.reduce((sum, line) => sum + line.book.price * line.quantity, 0),
    [items],
  );

  const canAfford = credits >= totalCents;
  const shortfall = Math.max(0, totalCents - credits);

  const handleCheckoutClick = () => {
    setCheckoutError("");
    if (!user) {
      setCheckoutError("Please sign in to checkout.");
      return;
    }
    if (items.length === 0) return;

    if (!canAfford) {
      setCheckoutError(
        `Not enough credits. You need ${formatPrice(shortfall)} more.`,
      );
      toast({
        message: `Insufficient credits. Balance ${formatPrice(credits)}.`,
        variant: "default",
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmCheckout = () => {
    if (!user || items.length === 0) return;

    const paid = totalCents;
    const count = itemCount;
    const titles = items.map((l) => l.book.title);

    const remaining = spendCredits(paid);
    if (remaining === null) {
      setConfirmOpen(false);
      setCheckoutError("Not enough credits to complete this purchase.");
      return;
    }

    clearCart();
    setConfirmOpen(false);
    setSuccess({
      totalCents: paid,
      itemCount: count,
      creditsRemaining: remaining,
      titles,
    });
    toast({
      message: "Purchase successful — books are on the way!",
      variant: "success",
    });
  };

  const value = useMemo(
    () => ({
      items,
      itemCount,
      totalCents,
      isDrawerOpen,
      openDrawer: () => {
        setIsDrawerOpen(true);
      },
      closeDrawer: () => {
        setIsDrawerOpen(false);
        setConfirmOpen(false);
      },
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      totalCents,
      isDrawerOpen,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
    ],
  );

  const showFab = (itemCount > 0 || success) && !isDrawerOpen;

  return (
    <CartContext.Provider value={value}>
      {children}

      {showFab && (
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label={
            success
              ? "Open cart — last order success"
              : `Open cart, ${itemCount} items`
          }
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink-800 text-white shadow-lg shadow-ink-900/25 hover:bg-ink-900 hover:scale-105 active:scale-95 transition-all animate-[cart-pop_0.35s_ease-out]"
        >
          {success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          ) : (
            <ShoppingBag className="h-5 w-5" />
          )}
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </button>
      )}

      {/* Cart drawer */}
      <div
        className={`fixed inset-0 z-[60] ${
          isDrawerOpen ? "visible" : "invisible pointer-events-none"
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <button
          type="button"
          aria-label="Close cart"
          onClick={() => {
            setIsDrawerOpen(false);
            setConfirmOpen(false);
          }}
          className={`absolute inset-0 bg-ink-950/40 transition-opacity duration-300 ${
            isDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
          className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-ink-700" />
              <div>
                <p className="font-semibold text-ink-950">Your cart</p>
                <p className="text-xs text-ink-500">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                setConfirmOpen(false);
              }}
              className="rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-900">
                      Purchase successful
                    </p>
                    <p className="text-sm text-emerald-800/80 mt-1">
                      You bought {success.itemCount} book
                      {success.itemCount === 1 ? "" : "s"} for{" "}
                      {formatPrice(success.totalCents)}.
                    </p>
                    <p className="text-xs text-emerald-700 mt-2 tabular-nums">
                      Credits left: {formatPrice(success.creditsRemaining)}
                    </p>
                    {success.titles.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {success.titles.slice(0, 4).map((t) => (
                          <li
                            key={t}
                            className="text-xs text-emerald-800/70 truncate"
                          >
                            · {t}
                          </li>
                        ))}
                        {success.titles.length > 4 && (
                          <li className="text-xs text-emerald-800/70">
                            · +{success.titles.length - 4} more
                          </li>
                        )}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => setSuccess(null)}
                      className="mt-3 text-xs font-medium text-emerald-800 underline underline-offset-2"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {items.length === 0 && !success ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-16">
                <ShoppingBag className="h-10 w-10 text-ink-200 mb-3" />
                <p className="font-medium text-ink-900">Cart is empty</p>
                <p className="text-sm text-ink-500 mt-1 max-w-[220px]">
                  Add books from Browse and they will show up here.
                </p>
              </div>
            ) : items.length === 0 && success ? (
              <div className="text-center py-8">
                <p className="text-sm text-ink-500">
                  Your cart is empty. Keep browsing to find more thrift finds.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((line) => (
                  <li
                    key={line.book.id}
                    className="flex gap-3 rounded-xl border border-ink-100 p-3"
                  >
                    <img
                      src={line.book.coverImage}
                      alt=""
                      className="h-20 w-14 shrink-0 rounded-md object-cover bg-ink-50 border border-ink-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-950 line-clamp-2">
                        {line.book.title}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5 truncate">
                        {line.book.author}
                      </p>
                      <p className="text-sm font-semibold text-ink-900 mt-1 tabular-nums">
                        {formatPrice(line.book.price)}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-lg border border-ink-100 bg-ink-50/50">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(line.book.id, line.quantity - 1)
                            }
                            className="p-1.5 text-ink-600 hover:text-ink-950"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-medium tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(line.book.id, line.quantity + 1)
                            }
                            className="p-1.5 text-ink-600 hover:text-ink-950"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.book.id)}
                          className="p-1.5 rounded-md text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label={`Remove ${line.book.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-ink-100 px-5 py-4 space-y-3 bg-white">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-ink-500">
                  <Wallet className="h-3.5 w-3.5" />
                  Your credits
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    canAfford ? "text-ink-950" : "text-rose-600"
                  }`}
                >
                  {formatPrice(credits)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="font-semibold text-ink-950 tabular-nums">
                  {formatPrice(totalCents)}
                </span>
              </div>
              {!canAfford && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  Need {formatPrice(shortfall)} more credits for this cart.
                </p>
              )}
              {checkoutError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {checkoutError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full h-11 rounded-lg bg-ink-800 text-white text-sm font-medium hover:bg-ink-900 transition-colors shadow-sm disabled:opacity-50"
                disabled={items.length === 0}
              >
                Checkout
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full h-9 rounded-lg text-sm text-ink-500 hover:text-ink-800 hover:bg-ink-50 transition-colors"
              >
                Clear cart
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Confirm checkout modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close confirmation"
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setConfirmOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-confirm-title"
            className="relative w-full max-w-sm rounded-xl border border-ink-100 bg-white p-5 shadow-2xl"
          >
            <h3
              id="checkout-confirm-title"
              className="text-lg font-semibold text-ink-950"
            >
              Confirm purchase?
            </h3>
            <p className="text-sm text-ink-600 mt-2">
              Use{" "}
              <span className="font-semibold text-ink-900 tabular-nums">
                {formatPrice(totalCents)}
              </span>{" "}
              of your{" "}
              <span className="font-semibold text-ink-900 tabular-nums">
                {formatPrice(credits)}
              </span>{" "}
              credits for {itemCount} book
              {itemCount === 1 ? "" : "s"}?
            </p>
            <p className="text-xs text-ink-400 mt-2 tabular-nums">
              Remaining after: {formatPrice(credits - totalCents)}
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="h-10 px-4 rounded-lg border border-ink-100 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                className="h-10 px-4 rounded-lg bg-ink-800 text-sm font-medium text-white hover:bg-ink-900"
              >
                Yes, pay with credits
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
