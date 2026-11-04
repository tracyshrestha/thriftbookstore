import React, { useEffect, useMemo, useState } from "react";
import {
  deleteBook,
  getAvailableBooks,
  createListing,
  updateBook,
  type BookEditPayload,
} from "@/api/books.api";
import type { Book } from "@/types/book.types";
import { Badge } from "@/components/ui/badge";
import {
  BookPlus,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  List,
  Pencil,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { getSavedBookIds, toggleSavedBookId } from "@/lib/savedBooks";
import { useToast } from "@/contexts/ToastContext";
import { useCart } from "@/contexts/CartContext";
import { useUser } from "@/contexts/UserContext";
import { isAdminRole } from "@/constants";
import {
  UploadForSaleModal,
  type UploadListingFormValues,
} from "@/features/user/components/UploadForSaleModal";

type ViewMode = "grid" | "list";
type SortOption = "title" | "price-asc" | "price-desc" | "rating";

const PAGE_SIZE = 20;

const Books: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const isAdmin = isAdminRole(user?.role);
  const [books, setBooks] = useState<Book[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [animateIn, setAnimateIn] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setWishlist(new Set(getSavedBookIds(user?.id)));
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadBooks = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getAvailableBooks();
        if (!cancelled) {
          setBooks(data);
          setAnimateIn(false);
          requestAnimationFrame(() => setAnimateIn(true));
        }
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

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of books) {
      const g = book.genre?.trim() || "Other";
      counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      if (selectedGenre && (book.genre?.trim() || "Other") !== selectedGenre) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        book.title,
        book.author,
        book.genre,
        book.isbn,
        book.publisher,
        book.description,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [books, searchQuery, selectedGenre]);

  const sortedBooks = useMemo(() => {
    const next = [...filteredBooks];
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
  }, [filteredBooks, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedBooks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedBooks.slice(start, start + PAGE_SIZE);
  }, [sortedBooks, currentPage]);

  // Reset to page 1 when search/sort/genre changes the result set
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, selectedGenre]);

  // Keep page in range if books shrink (e.g. delete)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const isSearching = searchQuery.trim().length > 0;
  const rangeStart =
    sortedBooks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sortedBooks.length);

  const toggleWishlist = (book: Book) => {
    const wasSaved = wishlist.has(book.id);
    const next = toggleSavedBookId(book.id, user?.id);
    setWishlist(new Set(next));
    toast({
      message: wasSaved
        ? `Removed “${book.title}” from saved`
        : `Saved “${book.title}”`,
      variant: "heart",
    });
  };

  const handleAddToCart = (book: Book) => {
    addToCart(book);
  };

  const handleDelete = async (book: Book) => {
    const ok = window.confirm(
      `Delete “${book.title}” from the catalog? This cannot be undone.`,
    );
    if (!ok) return;

    setDeletingId(book.id);
    try {
      await deleteBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      toast({
        message: `Deleted “${book.title}”`,
        variant: "success",
      });
    } catch {
      toast({
        message: "Failed to delete book. Please try again.",
        variant: "default",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (values: BookEditPayload) => {
    if (!editBook) return;
    setIsSavingEdit(true);
    try {
      const updated = await updateBook(editBook, values);
      setBooks((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      setEditBook(null);
      toast({
        message: `Updated “${updated.title}”`,
        variant: "success",
      });
    } catch {
      toast({
        message: "Failed to update book. Please try again.",
        variant: "default",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddBook = async (values: UploadListingFormValues) => {
    if (!user?.id) return;
    setIsAdding(true);
    try {
      const created = await createListing(user.id, values);
      // Admin catalog stock: store inventory, not a user marketplace listing
      const catalogBook: Book = {
        ...created,
        sellerId: undefined,
        location: "Store",
        availableCopies: Math.max(1, created.availableCopies),
        totalCopies: Math.max(1, created.totalCopies),
      };
      setBooks((prev) => [catalogBook, ...prev]);
      setAddOpen(false);
      toast({
        message: `Added “${catalogBook.title}” to the catalog`,
        variant: "success",
      });
    } catch {
      toast({
        message: "Failed to add book. Please try again.",
        variant: "default",
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-950">Browse Books</h2>
          <p className="text-sm text-ink-600/70 mt-1">
            Explore store stock and marketplace listings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-ink-800 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-ink-900 transition-colors"
            >
              <BookPlus className="h-4 w-4" />
              Add book
            </button>
          )}
          <label className="relative flex h-9 min-w-[min(100%,240px)] flex-1 sm:flex-none sm:w-64 items-center rounded-lg border border-ink-100 bg-white shadow-sm focus-within:border-ink-300 focus-within:ring-2 focus-within:ring-ink-100">
            <Search className="absolute left-2.5 h-4 w-4 text-ink-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, genre…"
              aria-label="Search books"
              className="h-full w-full rounded-lg bg-transparent pl-9 pr-8 text-sm text-ink-900 placeholder:text-ink-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 p-0.5 rounded text-ink-400 hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink-100 bg-white px-3 text-sm text-ink-600 shadow-sm">
            <span className="text-ink-400 text-xs">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent outline-none cursor-pointer text-ink-800 font-medium"
            >
              <option value="title">Title</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </label>
        </div>
      </div>

      {!error && genres.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">
            Categories
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by category"
          >
            <CategoryChip
              label="All"
              count={books.length}
              active={selectedGenre === null}
              onClick={() => setSelectedGenre(null)}
            />
            {genres.map((g) => (
              <CategoryChip
                key={g.name}
                label={g.name}
                count={g.count}
                active={selectedGenre === g.name}
                onClick={() =>
                  setSelectedGenre((prev) =>
                    prev === g.name ? null : g.name,
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!error && sortedBooks.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-white p-12 text-center shadow-sm">
          <p className="text-ink-950 font-medium">
            {isSearching ? "No matching books" : "No books found"}
          </p>
          <p className="text-sm text-ink-500 mt-1">
            {isSearching
              ? `Nothing matched “${searchQuery.trim()}”. Try another title or author.`
              : "Try refreshing the page."}
          </p>
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 text-sm font-medium text-ink-700 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {!error && sortedBooks.length > 0 && (
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex items-start sm:items-center justify-between gap-3 mb-5">
            <div className="min-w-0">
              <p className="text-sm text-ink-600/80">Catalog</p>
              <p className="text-lg font-semibold text-ink-950">
                {sortedBooks.length} book{sortedBooks.length === 1 ? "" : "s"}
                {selectedGenre && (
                  <span className="ml-2 text-sm font-normal text-ink-400">
                    in {selectedGenre}
                  </span>
                )}
                {isSearching && (
                  <span className="ml-2 text-sm font-normal text-ink-400">
                    matching “{searchQuery.trim()}”
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-400 mt-0.5">
                Showing {rangeStart}–{rangeEnd} · Page {currentPage} of{" "}
                {totalPages}
              </p>
            </div>
            <Segmented
              value={viewMode}
              options={[
                { id: "grid", label: "Grid", icon: LayoutGrid },
                { id: "list", label: "List", icon: List },
              ]}
              onChange={(v) => setViewMode(v as ViewMode)}
            />
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {pagedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  wishlisted={wishlist.has(book.id)}
                  onToggleWishlist={() => toggleWishlist(book)}
                  onAddToCart={() => handleAddToCart(book)}
                  animateIn={animateIn}
                  isAdmin={isAdmin}
                  isDeleting={deletingId === book.id}
                  onEdit={() => setEditBook(book)}
                  onDelete={() => handleDelete(book)}
                />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {pagedBooks.map((book) => (
                <li
                  key={book.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-ink-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-ink-200 transition-all"
                >
                  {isAdmin && (
                    <AdminHoverActions
                      isDeleting={deletingId === book.id}
                      onEdit={() => setEditBook(book)}
                      onDelete={() => handleDelete(book)}
                      className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                    />
                  )}
                  <img
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    className="h-28 w-20 shrink-0 rounded-lg object-cover bg-ink-50 border border-ink-100"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 pr-16">
                        <h3 className="font-semibold text-ink-950 truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-ink-500">by {book.author}</p>
                      </div>
                      <SourceBadge book={book} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <StarRating rating={book.rating} />
                      <span className="text-xs text-ink-400">{book.genre}</span>
                      {book.availableCopies === 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-ink-100 text-ink-600"
                        >
                          Out of stock
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <p className="text-lg font-semibold text-ink-950 tabular-nums">
                      {formatPrice(book.price)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleWishlist(book)}
                        aria-label={
                          wishlist.has(book.id)
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        className="p-2 rounded-lg border border-ink-100 text-ink-400 hover:text-rose-500 hover:bg-ink-50 transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            wishlist.has(book.id)
                              ? "fill-rose-500 text-rose-500"
                              : ""
                          }`}
                        />
                      </button>
                      <BuyButton
                        disabled={book.availableCopies === 0}
                        onClick={() => handleAddToCart(book)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-ink-50 pt-4">
              <p className="text-xs text-ink-500">
                {PAGE_SIZE} per page · {sortedBooks.length} total
              </p>
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </div>
      )}

      {editBook && (
        <EditBookModal
          book={editBook}
          isSaving={isSavingEdit}
          onClose={() => !isSavingEdit && setEditBook(null)}
          onSave={handleSaveEdit}
        />
      )}

      {isAdmin && (
        <UploadForSaleModal
          open={addOpen}
          isSubmitting={isAdding}
          onClose={() => !isAdding && setAddOpen(false)}
          onSubmit={handleAddBook}
          heading="Add book"
          description="Add a thrift book to the store catalog"
          submitLabel="Add to catalog"
          submittingLabel="Adding..."
        />
      )}
    </div>
  );
};

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="inline-flex items-center gap-1" role="navigation" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-100 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages[0] > 1 && (
        <>
          <PageButton page={1} current={page} onChange={onChange} />
          {pages[0] > 2 && (
            <span className="px-1 text-ink-300 text-sm">…</span>
          )}
        </>
      )}
      {pages.map((p) => (
        <PageButton key={p} page={p} current={page} onChange={onChange} />
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-ink-300 text-sm">…</span>
          )}
          <PageButton
            page={totalPages}
            current={page}
            onChange={onChange}
          />
        </>
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-100 text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function PageButton({
  page,
  current,
  onChange,
}: {
  page: number;
  current: number;
  onChange: (page: number) => void;
}) {
  const active = page === current;
  return (
    <button
      type="button"
      onClick={() => onChange(page)}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
        active
          ? "bg-ink-800 text-white shadow-sm"
          : "border border-ink-100 text-ink-700 hover:bg-ink-50"
      }`}
    >
      {page}
    </button>
  );
}

function AdminHoverActions({
  onEdit,
  onDelete,
  isDeleting,
  className = "",
}: {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        disabled={isDeleting}
        title="Edit book"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-100 bg-white text-ink-700 shadow-sm hover:bg-ink-50 hover:border-ink-200 transition-colors disabled:opacity-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">Edit</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isDeleting}
        title="Delete book"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-600 shadow-sm hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete</span>
      </button>
    </div>
  );
}

function BookCard({
  book,
  wishlisted,
  onToggleWishlist,
  onAddToCart,
  isAdmin,
  isDeleting,
  onEdit,
  onDelete,
}: {
  book: Book;
  wishlisted: boolean;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  animateIn?: boolean;
  isAdmin?: boolean;
  isDeleting?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const available = book.availableCopies > 0;

  return (
    <article className="rounded-lg border border-ink-100 bg-white p-2.5 shadow-sm hover:shadow-md hover:border-ink-200 transition-all group flex flex-col relative">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-ink-50 border border-ink-100 mb-2">
        <img
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 border border-ink-100 text-ink-400 hover:text-rose-500 shadow-sm transition-colors"
        >
          <Heart
            className={`h-3 w-3 ${
              wishlisted ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>
        {isAdmin && onEdit && onDelete && (
          <AdminHoverActions
            isDeleting={isDeleting}
            onEdit={onEdit}
            onDelete={onDelete}
            className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity scale-90"
          />
        )}
        {book.sellerId && (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink-900/85 px-1.5 py-0.5 text-[9px] font-medium text-white">
            Seller
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1.5 mb-1">
        <StarRating rating={book.rating} compact />
        <SourceBadge book={book} compact />
      </div>

      <h3 className="text-xs font-semibold text-ink-950 leading-snug line-clamp-2 min-h-[2rem]">
        {book.title}
      </h3>
      <p className="text-[11px] text-ink-500 mt-0.5 truncate">{book.author}</p>
      <p className="text-[10px] text-ink-400 mt-0.5 truncate">{book.genre}</p>

      <div className="mt-auto pt-2 border-t border-ink-50 flex items-end justify-between gap-1.5">
        <div className="min-w-0">
          <p className="text-[10px] text-ink-500">Price</p>
          <p className="text-sm font-semibold text-ink-950 tabular-nums">
            {formatPrice(book.price)}
          </p>
        </div>
        <BuyButton disabled={!available} onClick={onAddToCart} compact />
      </div>
    </article>
  );
}

function EditBookModal({
  book,
  isSaving,
  onClose,
  onSave,
}: {
  book: Book;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: BookEditPayload) => void;
}) {
  const [form, setForm] = useState<BookEditPayload>({
    title: book.title,
    author: book.author,
    genre: book.genre,
    priceDollars: (book.price / 100).toFixed(2),
    description: book.description ?? "",
  });

  useEffect(() => {
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      priceDollars: (book.price / 100).toFixed(2),
      description: book.description ?? "",
    });
  }, [book]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink-950/40"
        onClick={onClose}
        disabled={isSaving}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-book-title"
        className="relative w-full max-w-md rounded-xl border border-ink-100 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <h3
              id="edit-book-title"
              className="font-semibold text-ink-950"
            >
              Edit book
            </h3>
            <p className="text-xs text-ink-500 mt-0.5 truncate max-w-[280px]">
              {book.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => setForm((p) => ({ ...p, title: v }))}
            required
          />
          <Field
            label="Author"
            value={form.author}
            onChange={(v) => setForm((p) => ({ ...p, author: v }))}
            required
          />
          <Field
            label="Genre"
            value={form.genre}
            onChange={(v) => setForm((p) => ({ ...p, genre: v }))}
          />
          <Field
            label="Price (USD)"
            type="number"
            step="0.01"
            min="0"
            value={form.priceDollars}
            onChange={(v) => setForm((p) => ({ ...p, priceDollars: v }))}
            required
          />
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 outline-none focus:border-ink-300 focus:ring-2 focus:ring-ink-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 px-3 rounded-lg border border-ink-100 text-sm text-ink-700 hover:bg-ink-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-lg bg-ink-800 text-sm font-medium text-white hover:bg-ink-900 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  step,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={step}
        min={min}
        className="w-full h-9 rounded-lg border border-ink-100 px-3 text-sm text-ink-900 outline-none focus:border-ink-300 focus:ring-2 focus:ring-ink-100"
      />
    </div>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-ink-800 bg-ink-800 text-white shadow-sm"
          : "border-ink-100 bg-white text-ink-700 hover:border-ink-200 hover:bg-ink-50"
      }`}
    >
      <span>{label}</span>
      <span
        className={`tabular-nums rounded-full px-1.5 py-0.5 text-[10px] ${
          active ? "bg-white/15 text-white" : "bg-ink-50 text-ink-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-ink-100 bg-white p-0.5 shadow-sm">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all ${
              active
                ? "bg-ink-700 text-white shadow-sm"
                : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SourceBadge({
  book,
  compact,
}: {
  book: Book;
  compact?: boolean;
}) {
  if (book.sellerId) {
    return (
      <Badge
        variant="secondary"
        className={`bg-ink-100 text-ink-700 shrink-0 ${
          compact ? "text-[9px] px-1.5 py-0 h-5" : ""
        }`}
      >
        {compact ? "Seller" : "Marketplace"}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={`bg-ink-50 text-ink-600 shrink-0 ${
        compact ? "text-[9px] px-1.5 py-0 h-5" : ""
      }`}
    >
      Store
    </Badge>
  );
}

function StarRating({
  rating,
  compact,
}: {
  rating: number;
  compact?: boolean;
}) {
  const filled = Math.round(rating);
  const size = compact ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rated ${rating} of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < filled;
        return (
          <Star
            key={index}
            className={`${size} ${
              isFilled
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-ink-200"
            }`}
          />
        );
      })}
    </div>
  );
}

function BuyButton({
  disabled,
  onClick,
  compact,
}: {
  disabled?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md bg-ink-700 text-white font-medium whitespace-nowrap hover:bg-ink-800 transition-colors disabled:opacity-45 disabled:cursor-not-allowed shadow-sm ${
        compact
          ? "h-7 px-2 text-[10px]"
          : "h-8 px-3 text-xs rounded-lg"
      }`}
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
