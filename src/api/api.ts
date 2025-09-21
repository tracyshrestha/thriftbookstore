import { Book } from "@/types/book.types";

export async function getBooks(): Promise<Book[]> {
  const res = await fetch("/data/books.json");
  if (!res.ok) throw new Error("Failed to fetch books");
  return res.json();
}
