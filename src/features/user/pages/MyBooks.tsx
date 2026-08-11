import React, { useEffect, useMemo, useState } from "react";
import { createListing, getBooks, getMyBooks } from "@/api/books.api";
import { getCheckoutsByUser } from "@/api/checkouts.api";
import type { Book } from "@/types/book.types";
import { useUser } from "@/contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import {
  BookMarked,
  BookPlus,
  DollarSign,
  Heart,
  LayoutGrid,
  List,
  ShoppingBag,
} from "lucide-react";
import {
  UploadForSaleModal,
  type UploadListingFormValues,
} from "@/features/user/components/UploadForSaleModal";
import PageSkeleton from "@/components/ui/PageSkeleton";
import {
  getSavedBookIds,
  setSavedBookIds,
  toggleSavedBookId,
} from "@/lib/savedBooks";

type ViewMode = "grid" | "list";
type BooksTab = "listed" | "bought" | "saved";

type BoughtBook = Book & { boughtAt: string };
type BookRow = Book & { boughtAt?: string };

const TABS: { id: BooksTab; label: string }[] = [
  { id: "listed", label: "Books Listed" },
  { id: "bought", label: "Bought" },
  { id: "saved", label: "Saved" },
];

const MyBooks: React.FC = () => {
  const { user } = useUser();
  const [myListings, setMyListings] = useState<Book[]>([]);
  const [boughtBooks, setBoughtBooks] = useState<BoughtBook[]>([]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<BooksTab>("listed");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.id) {
        setMyListings([]);
        setBoughtBooks([]);
        setSavedBooks([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const [listings, checkouts, allBooks] = await Promise.all([
          getMyBooks(user.id),
          getCheckoutsByUser(user.id),
          getBooks(),
        ]);

        if (cancelled) return;

        const byId = new Map(allBooks.map((b) => [b.id, b]));

        const bought: BoughtBook[] = checkouts
          .map((c) => {
            const book = byId.get(c.bookId);
            if (!book) return null;
            return { ...book, boughtAt: c.checkoutDate };
          })
          .filter((b): b is BoughtBook => b !== null);

        let savedIds = getSavedBookIds();
        // Seed a couple of saves for first visit so Saved is not always empty
        if (savedIds.length === 0 && allBooks.length > 0) {
          savedIds = allBooks
            .filter((b) => b.availableCopies > 0)
            .slice(0, 2)
            .map((b) => b.id);
          setSavedBookIds(savedIds);
        }
        const saved = savedIds
          .map((id) => byId.get(id))
          .filter((b): b is Book => Boolean(b));

        setMyListings(listings);
        setBoughtBooks(bought);
        setSavedBooks(saved);
        setAnimateIn(false);
        requestAnimationFrame(() => setAnimateIn(true));
      } catch {
        if (!cancelled) setError("Failed to load your books.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const activeCount = myListings.filter((b) => b.status !== "sold").length;
  const soldCount = myListings.filter((b) => b.status === "sold").length;
  const totalValue = myListings
    .filter((b) => b.status !== "sold")
    .reduce((sum, b) => sum + b.price, 0);
  const listedTotal = Math.max(myListings.length, 1);

  const tabBooks: BookRow[] = useMemo(() => {
    if (activeTab === "listed") return myListings;
    if (activeTab === "bought") return boughtBooks;
    return savedBooks;
  }, [activeTab, myListings, boughtBooks, savedBooks]);

  const tabMeta = {
    listed: {
      eyebrow: "Your listings",
      emptyTitle: "No books listed yet",
      emptyHint: "When you upload a book for sale, it will show up here.",
      count: myListings.length,
    },
    bought: {
      eyebrow: "Purchases",
      emptyTitle: "No bought books yet",
      emptyHint: "Books you buy from the thrift marketplace appear here.",
      count: boughtBooks.length,
    },
    saved: {
      eyebrow: "Wishlist",
      emptyTitle: "No saved books",
      emptyHint: "Save books from Browse Books and they will land here.",
      count: savedBooks.length,
    },
  }[activeTab];

  const handleUpload = async (values: UploadListingFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const listing = await createListing(user.id, values);
      setMyListings((prev) => [listing, ...prev]);
      setActiveTab("listed");
      setModalOpen(false);
    } catch {
      // keep modal open; user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsave = (bookId: string) => {
    const nextIds = toggleSavedBookId(bookId);
    setSavedBooks((prev) => prev.filter((b) => nextIds.includes(b.id)));
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-950">My Books</h2>
          <p className="text-sm text-ink-600/70 mt-1">
            Listings, purchases, and saved thrift finds
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-ink-700 text-white text-sm font-medium hover:bg-ink-800 shadow-sm transition-colors"
          >
            <BookPlus className="h-4 w-4" />
            Upload for sale
          </button>
        </div>
      </div>

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Active listings"
            value={String(activeCount)}
            badge={`${Math.round((activeCount / listedTotal) * 100)}%`}
            badgeUp
            barWidth={animateIn ? (activeCount / listedTotal) * 100 : 0}
            icon={<BookMarked className="h-4 w-4" />}
          />
          <MetricCard
            title="Bought"
            value={String(boughtBooks.length)}
            badge={boughtBooks.length > 0 ? "Owned" : "—"}
            badgeUp={boughtBooks.length > 0}
            barWidth={animateIn ? Math.min(100, boughtBooks.length * 35) : 0}
            icon={<ShoppingBag className="h-4 w-4" />}
          />
          <MetricCard
            title="Saved"
            value={String(savedBooks.length)}
            badge={savedBooks.length > 0 ? "Wishlist" : "—"}
            badgeUp={savedBooks.length > 0}
            barWidth={animateIn ? Math.min(100, savedBooks.length * 35) : 0}
            icon={<Heart className="h-4 w-4" />}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!error && (
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <SectionTabs
            tabs={TABS.map((t) => ({
              ...t,
              count:
                t.id === "listed"
                  ? myListings.length
                  : t.id === "bought"
                    ? boughtBooks.length
                    : savedBooks.length,
            }))}
            value={activeTab}
            onChange={setActiveTab}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 mt-5">
            <div>
              <p className="text-sm text-ink-600/80">{tabMeta.eyebrow}</p>
              <p className="text-lg font-semibold text-ink-950">
                {tabMeta.count} book{tabMeta.count === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeTab === "listed" && soldCount > 0 && (
                <span className="text-xs text-ink-400">{soldCount} sold</span>
              )}
              {activeTab === "listed" && soldCount === 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatPrice(totalValue)} listed value
                </span>
              )}
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {tabBooks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-12 text-center">
              <p className="text-ink-950 font-medium">{tabMeta.emptyTitle}</p>
              <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
                {tabMeta.emptyHint}
              </p>
              {activeTab === "listed" && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-4 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-ink-700 text-white text-sm font-medium hover:bg-ink-800 transition-colors"
                >
                  <BookPlus className="h-4 w-4" />
                  Upload for sale
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {tabBooks.map((book) => (
                <BookTile
                  key={book.id}
                  book={book}
                  mode={activeTab}
                  animateIn={animateIn}
                  boughtAt={book.boughtAt}
                  onUnsave={
                    activeTab === "saved"
                      ? () => handleUnsave(book.id)
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {tabBooks.map((book) => (
                <li
                  key={book.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-ink-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-ink-200 transition-all"
                >
                  <img
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    className="h-28 w-20 shrink-0 rounded-lg object-cover bg-ink-50 border border-ink-100"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink-950 truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-ink-500">
                          by {book.author}
                        </p>
                      </div>
                      <TabBadge
                        mode={activeTab}
                        status={book.status}
                      />
                    </div>
                    <p className="text-xs text-ink-400 mt-2">
                      {book.genre}
                      {book.condition ? ` · ${book.condition}` : ""}
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <p className="text-lg font-semibold text-ink-950 tabular-nums">
                      {formatPrice(book.price)}
                    </p>
                    {book.boughtAt && (
                      <p className="text-xs text-ink-400">
                        Bought {formatDate(book.boughtAt)}
                      </p>
                    )}
                    {activeTab === "listed" && book.listedAt && (
                      <p className="text-xs text-ink-400">
                        Listed {formatDate(book.listedAt)}
                      </p>
                    )}
                    {activeTab === "saved" && (
                      <button
                        type="button"
                        onClick={() => handleUnsave(book.id)}
                        className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-rose-600 transition-colors"
                      >
                        <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <UploadForSaleModal
        open={modalOpen}
        isSubmitting={isSubmitting}
        onClose={() => !isSubmitting && setModalOpen(false)}
        onSubmit={handleUpload}
      />
    </div>
  );
};

function SectionTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: BooksTab; label: string; count: number }[];
  value: BooksTab;
  onChange: (id: BooksTab) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-6 border-b border-ink-100 -mx-1 px-1"
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px pb-3 text-sm font-medium transition-colors ${
              active
                ? "text-ink-950 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-ink-950"
                : "text-ink-400 hover:text-ink-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs tabular-nums ${
                active ? "text-ink-500" : "text-ink-300"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TabBadge({
  mode,
  status,
}: {
  mode: BooksTab;
  status?: Book["status"];
}) {
  if (mode === "bought") {
    return (
      <Badge variant="secondary" className="shrink-0 bg-ink-50 text-ink-700">
        Owned
      </Badge>
    );
  }
  if (mode === "saved") {
    return (
      <Badge variant="secondary" className="shrink-0 bg-rose-50 text-rose-700">
        Saved
      </Badge>
    );
  }
  return <StatusBadge status={status ?? "active"} />;
}

function BookTile({
  book,
  mode,
  animateIn,
  boughtAt,
  onUnsave,
}: {
  book: Book;
  mode: BooksTab;
  animateIn: boolean;
  boughtAt?: string;
  onUnsave?: () => void;
}) {
  return (
    <article className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-ink-200 transition-all group flex flex-col">
      <div className="flex gap-3">
        <img
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          className="h-28 w-20 shrink-0 rounded-lg object-cover bg-ink-50 border border-ink-100"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink-950 leading-snug line-clamp-2">
              {book.title}
            </h3>
            <TabBadge mode={mode} status={book.status} />
          </div>
          <p className="text-sm text-ink-500 mt-1 truncate">
            by {book.author}
          </p>
          <p className="text-xs text-ink-400 mt-2">
            {book.genre}
            {book.condition ? ` · ${book.condition}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-ink-50 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-ink-500">
            {mode === "bought" ? "Paid" : mode === "saved" ? "Price" : "List price"}
          </p>
          <p className="text-xl font-semibold tracking-tight text-ink-950 tabular-nums">
            {formatPrice(book.price)}
          </p>
        </div>
        {mode === "listed" && book.listedAt && (
          <p className="text-xs text-ink-400">
            Listed {formatDate(book.listedAt)}
          </p>
        )}
        {mode === "bought" && boughtAt && (
          <p className="text-xs text-ink-400">
            Bought {formatDate(boughtAt)}
          </p>
        )}
        {mode === "saved" && onUnsave && (
          <button
            type="button"
            onClick={onUnsave}
            aria-label="Remove from saved"
            className="p-2 rounded-lg border border-ink-100 text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Heart className="h-4 w-4 fill-rose-500" />
          </button>
        )}
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-ink-50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            book.status === "sold" ? "bg-ink-300" : "bg-ink-600"
          }`}
          style={{
            width: animateIn
              ? mode === "saved"
                ? "55%"
                : book.status === "sold"
                  ? "100%"
                  : "70%"
              : "0%",
          }}
        />
      </div>
    </article>
  );
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="View layout"
      className="inline-flex rounded-lg border border-ink-100 bg-white p-0.5 shadow-sm"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all ${
          value === "grid"
            ? "bg-ink-700 text-white shadow-sm"
            : "text-ink-600 hover:bg-ink-50"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Grid
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all ${
          value === "list"
            ? "bg-ink-700 text-white shadow-sm"
            : "text-ink-600 hover:bg-ink-50"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
}

function MetricCard({
  title,
  value,
  badge,
  badgeUp,
  barWidth,
  icon,
}: {
  title: string;
  value: string;
  badge: string;
  badgeUp: boolean;
  barWidth: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-ink-200 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ink-600/80">{title}</p>
        <span className="text-ink-200 group-hover:text-ink-400 transition-colors">
          {icon}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-ink-950 tabular-nums">
          {value}
        </p>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            badgeUp ? "bg-ink-50 text-ink-700" : "bg-ink-100 text-ink-500"
          }`}
        >
          {badge}
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-ink-50 overflow-hidden">
        <div
          className="h-full rounded-full bg-ink-500 transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(barWidth, 0))}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: NonNullable<Book["status"]> }) {
  const styles =
    status === "sold"
      ? "bg-ink-100 text-ink-600"
      : status === "draft"
        ? "bg-amber-50 text-amber-800"
        : "bg-ink-50 text-ink-700";

  const label =
    status === "sold" ? "Sold" : status === "draft" ? "Draft" : "For sale";

  return (
    <Badge variant="secondary" className={`shrink-0 capitalize ${styles}`}>
      {label}
    </Badge>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default MyBooks;
