export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: number;
  publisher: string;
  pages: number;
  language: string;
  description: string;
  coverImage: string;
  availableCopies: number;
  totalCopies: number;
  rating: number;
  location: string;
  price: number;
  /** Set when a user listed this book for sale */
  sellerId?: string;
  condition?: "Like New" | "Very Good" | "Good" | "Fair" | "Acceptable";
  listedAt?: string;
  status?: "active" | "sold" | "draft";
}
