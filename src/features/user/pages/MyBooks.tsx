import React, { useEffect, useMemo, useState } from "react";
import { getBooks } from "@/api/api";
import type { Book } from "@/types/book.types";
import { useUser } from "@/contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import { BookPlus } from "lucide-react";

const MyBooks: React.FC = () => {
  const { user } = useUser();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getBooks();
        if (!cancelled) setBooks(data);
      } catch {
        if (!cancelled) setError("Failed to load your listings.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const myListings = useMemo(
    () => books.filter((book) => book.sellerId && book.sellerId === user?.id),
    [books, user?.id],
  );

  const activeCount = myListings.filter((b) => b.status !== "sold").length;
  const soldCount = myListings.filter((b) => b.status === "sold").length;
  const totalValue = myListings
    .filter((b) => b.status !== "sold")
    .reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Books</h2>
          <p className="text-gray-500 mt-1">
            Books you have uploaded for sale
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#1aa3a1] text-white text-sm font-medium hover:bg-[#158f8d] transition-colors"
        >
          <BookPlus className="h-4 w-4" />
          Upload for sale
        </button>
      </div>

      {!isLoading && !error && myListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <StatCard label="Active listings" value={String(activeCount)} />
          <StatCard label="Sold" value={String(soldCount)} />
          <StatCard
            label="Listed value"
            value={formatPrice(totalValue)}
          />
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-gray-500 py-12 text-center">
          Loading your books...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!isLoading && !error && myListings.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 px-6 text-center">
          <p className="text-gray-900 font-medium">No books listed yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            When you upload a book for sale, it will show up here.
          </p>
        </div>
      )}

      {!isLoading && !error && myListings.length > 0 && (
        <ul className="space-y-3">
          {myListings.map((book) => (
            <li
              key={book.id}
              className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <img
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                className="h-28 w-20 shrink-0 rounded object-cover bg-gray-100"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500">by {book.author}</p>
                  </div>
                  <StatusBadge status={book.status ?? "active"} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  {book.condition && (
                    <span>
                      Condition:{" "}
                      <span className="text-gray-800">{book.condition}</span>
                    </span>
                  )}
                  {book.listedAt && (
                    <span>
                      Listed:{" "}
                      <span className="text-gray-800">
                        {formatDate(book.listedAt)}
                      </span>
                    </span>
                  )}
                  <span className="text-gray-400">{book.genre}</span>
                </div>

                <p className="mt-3 text-base font-semibold text-gray-900">
                  {formatPrice(book.price)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: NonNullable<Book["status"]> }) {
  const styles =
    status === "sold"
      ? "bg-gray-100 text-gray-700"
      : status === "draft"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  const label =
    status === "sold" ? "Sold" : status === "draft" ? "Draft" : "For sale";

  return (
    <Badge variant="secondary" className={`capitalize ${styles}`}>
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
