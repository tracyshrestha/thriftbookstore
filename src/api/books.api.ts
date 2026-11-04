import { apiRequest } from "./client";
import { API_PATHS } from "./paths";
import type { Book } from "@/types/book.types";
import type { UploadListingFormValues } from "@/features/user/components/UploadForSaleModal";

/**
 * GET /mock-api/books/list.json
 * Single books endpoint — store stock + seller listings in one file.
 */
export async function getBooks(): Promise<Book[]> {
  return apiRequest<Book[]>(API_PATHS.BOOKS);
}

/** Books available to browse/buy (in stock and not sold). */
export function isBookAvailable(book: Book): boolean {
  if (book.status === "sold") return false;
  return book.availableCopies > 0;
}

/** Available books only (Browse Books). */
export async function getAvailableBooks(): Promise<Book[]> {
  const books = await getBooks();
  return books.filter(isBookAvailable);
}

/** Books listed by a seller (My Books) — same endpoint, filtered by sellerId. */
export async function getMyBooks(sellerId: string): Promise<Book[]> {
  const books = await getBooks();
  return books.filter((book) => book.sellerId === sellerId);
}

export type BookEditPayload = {
  title: string;
  author: string;
  genre: string;
  priceDollars: string;
  description: string;
};

/**
 * Simulated update POST against books endpoint.
 * Network tab: books/list.json?_method=POST&payload=...
 */
export async function updateBook(
  book: Book,
  values: BookEditPayload,
): Promise<Book> {
  await apiRequest<Book[]>(API_PATHS.BOOKS, {
    method: "POST",
    body: {
      _action: "update",
      id: book.id,
      ...values,
    },
  });

  const priceCents = Math.round(Number(values.priceDollars) * 100);

  return {
    ...book,
    title: values.title.trim(),
    author: values.author.trim(),
    genre: values.genre.trim(),
    description: values.description.trim() || book.description,
    price: Number.isFinite(priceCents) ? priceCents : book.price,
  };
}

/**
 * Simulated delete against books endpoint.
 * Network tab: books/list.json?_method=POST&payload=...
 */
export async function deleteBook(bookId: string): Promise<void> {
  await apiRequest<Book[]>(API_PATHS.BOOKS, {
    method: "POST",
    body: {
      _action: "delete",
      id: bookId,
    },
  });
}

/**
 * Simulated create listing POST against the same books endpoint.
 * Network tab: books/list.json?_method=POST&payload=...
 */
export async function createListing(
  sellerId: string,
  values: UploadListingFormValues,
): Promise<Book> {
  const networkPayload = {
    title: values.title,
    author: values.author,
    genre: values.genre,
    priceDollars: values.priceDollars,
    condition: values.condition,
    description: values.description,
    coverMode: values.coverMode,
    coverImageUrl: values.coverImageUrl || null,
    coverFile: values.coverFile
      ? {
          name: values.coverFileName || values.coverFile.name,
          type: values.coverFile.type,
          size: values.coverFile.size,
        }
      : null,
    hasCoverPreview: Boolean(values.coverPreview),
  };

  await apiRequest<Book[]>(API_PATHS.BOOKS, {
    method: "POST",
    body: networkPayload,
  });

  const priceCents = Math.round(Number(values.priceDollars) * 100);

  return {
    id: `listing_${sellerId}_${Date.now()}`,
    title: values.title,
    author: values.author,
    isbn: "",
    genre: values.genre,
    publishedYear: new Date().getFullYear(),
    publisher: "",
    pages: 0,
    language: "English",
    description:
      values.description || `${values.condition} thrift listing`,
    coverImage: values.coverPreview,
    availableCopies: 1,
    totalCopies: 1,
    rating: 0,
    location: "Seller",
    price: priceCents,
    sellerId,
    condition: values.condition,
    listedAt: new Date().toISOString().slice(0, 10),
    status: "active",
  };
}
