import React, { useEffect, useMemo, useState } from "react";
import { getBooks } from "@/api/api";
import type { Book } from "@/types/book.types";
import { ChevronDown, Heart, Star } from "lucide-react";

type ViewMode = "grid" | "list";
type SortOption = "title" | "price-asc" | "price-desc" | "rating";

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadBooks = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getBooks();
        if (!cancelled) setBooks(data);
      } catch {
        if (!cancelled) setError("Failed to load books. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadBooks();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedBooks = useMemo(() => {
    const next = [...books];
    switch (sortBy) {
      case "price-asc":
        return next.sort((a, b) => a.price - b.price);
      case "price-desc":
        return next.sort((a, b) => b.price - a.price);
      case "rating":
        return next.sort((a, b) => b.rating - a.rating);
      case "title":
      default:
        return next.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [books, sortBy]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full bg-white min-h-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Browse Books</h2>
          {!isLoading && !error && (
            <p className="text-sm text-gray-400 mt-1">{books.length} titles</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid"
                ? "font-semibold text-gray-900"
                : "font-normal text-gray-400 hover:text-gray-700"
            }
          >
            Grid View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list"
                ? "font-semibold text-gray-900"
                : "font-normal text-gray-400 hover:text-gray-700"
            }
          >
            List View
          </button>
          <label className="relative inline-flex items-center text-gray-500">
            <span className="sr-only">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-transparent pr-5 font-normal text-gray-500 hover:text-gray-800 cursor-pointer outline-none"
            >
              <option value="title">Sort</option>
              <option value="title">Title</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-gray-400" />
          </label>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 py-12 text-center">
          Loading books...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!isLoading && !error && sortedBooks.length === 0 && (
        <p className="text-sm text-gray-500 py-12 text-center">No books found.</p>
      )}

      {!isLoading && !error && sortedBooks.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-5 gap-y-10">
          {sortedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              wishlisted={wishlist.has(book.id)}
              onToggleWishlist={() => toggleWishlist(book.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && sortedBooks.length > 0 && viewMode === "list" && (
        <ul className="divide-y divide-gray-100">
          {sortedBooks.map((book) => (
            <li key={book.id} className="flex items-center gap-5 py-5">
              <img
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                className="h-28 w-[4.5rem] shrink-0 object-cover bg-gray-100"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <StarRating rating={book.rating} />
                <h3 className="mt-1 text-[15px] font-semibold text-gray-900 truncate">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-500 truncate">{book.author}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 shrink-0">
                {formatPrice(book.price)}
              </p>
              <BuyButton disabled={book.availableCopies === 0} />
              <button
                type="button"
                onClick={() => toggleWishlist(book.id)}
                aria-label={
                  wishlist.has(book.id)
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                className="p-1 text-gray-400 hover:text-rose-500"
              >
                <Heart
                  className={`h-4 w-4 ${
                    wishlist.has(book.id)
                      ? "fill-rose-500 text-rose-500"
                      : ""
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function BookCard({
  book,
  wishlisted,
  onToggleWishlist,
}: {
  book: Book;
  wishlisted: boolean;
  onToggleWishlist: () => void;
}) {
  return (
    <article className="flex flex-col bg-white group">
      <div className="aspect-[2/3] w-full overflow-hidden bg-gray-100 mb-2.5">
        <img
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <StarRating rating={book.rating} />
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="p-0.5 text-gray-400 hover:text-rose-500 transition-colors"
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              wishlisted ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>
      </div>

      <h3 className="text-[13px] font-semibold text-gray-900 leading-snug truncate">
        {book.title}
      </h3>
      <p className="text-[12px] text-gray-500 mt-0.5 truncate">{book.author}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-gray-900">
          {formatPrice(book.price)}
        </span>
        <BuyButton disabled={book.availableCopies === 0} />
      </div>
    </article>
  );
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} of 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < filled;
        return (
          <Star
            key={index}
            className={`h-3 w-3 ${
              isFilled
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}

function BuyButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="h-7 min-w-[3.25rem] px-2.5 rounded-[3px] bg-[#1aa3a1] text-white text-[11px] font-medium whitespace-nowrap hover:bg-[#158f8d] transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
    >
      {disabled ? "Unavailable" : "Add to cart"}
    </button>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100);
}

export default Books;
