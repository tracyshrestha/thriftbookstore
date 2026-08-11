import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUserById } from "@/api/users.api";
import { getBooks, getMyBooks } from "@/api/books.api";
import { getCheckoutsByUser } from "@/api/checkouts.api";
import type { User } from "@/features/auth/types/user";
import type { Book } from "@/types/book.types";
import { ROUTES } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageSkeleton from "@/components/ui/PageSkeleton";
import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  ShoppingBag,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { getUserCredits } from "@/lib/credits";

type BooksTab = "listed" | "bought";

type BoughtBook = Book & { boughtAt: string };

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100);
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(book: Book, tab: BooksTab) {
  if (tab === "bought") return "Bought";
  if (book.status === "sold") return "Sold";
  if (book.status === "draft") return "Draft";
  return "Active";
}

function statusClass(book: Book, tab: BooksTab) {
  if (tab === "bought") return "bg-ink-100 text-ink-700";
  if (book.status === "sold") return "bg-ink-200 text-ink-800";
  if (book.status === "draft") return "bg-ink-50 text-ink-500";
  return "bg-emerald-50 text-emerald-800";
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [listedBooks, setListedBooks] = useState<Book[]>([]);
  const [boughtBooks, setBoughtBooks] = useState<BoughtBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [booksTab, setBooksTab] = useState<BooksTab>("listed");

  useEffect(() => {
    if (!id) {
      setError("Missing user id.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [found, listings, checkouts, allBooks] = await Promise.all([
          getUserById(id),
          getMyBooks(id),
          getCheckoutsByUser(id),
          getBooks(),
        ]);

        if (cancelled) return;

        if (!found) {
          setUser(null);
          setListedBooks([]);
          setBoughtBooks([]);
          setError("User not found.");
          return;
        }

        const byId = new Map(allBooks.map((b) => [b.id, b]));
        const bought: BoughtBook[] = checkouts
          .map((c) => {
            const book = byId.get(c.bookId);
            if (!book) return null;
            return { ...book, boughtAt: c.checkoutDate };
          })
          .filter((b): b is BoughtBook => b !== null);

        setUser(found);
        setListedBooks(listings);
        setBoughtBooks(bought);
      } catch {
        if (!cancelled) setError("Failed to load user details.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const tableRows = useMemo(() => {
    if (booksTab === "listed") return listedBooks;
    return boughtBooks;
  }, [booksTab, listedBooks, boughtBooks]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="w-full space-y-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </button>
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error || "User not found."}
        </p>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const joined = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const creditsDisplay = formatPrice(
    getUserCredits(user.id, user.credits ?? 0),
  );

  const fields = [
    { label: "Name", value: user.name, icon: UserIcon },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Phone", value: user.phone || "—", icon: Phone },
    { label: "User ID", value: user.id, icon: IdCard },
    { label: "Role", value: user.role, icon: UserIcon, capitalize: true },
    { label: "Credits", value: creditsDisplay, icon: Wallet },
    { label: "Joined", value: joined, icon: CalendarDays },
  ];

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={ROUTES.ADMIN_USERS}
            className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>
          <h2 className="text-2xl font-bold text-ink-950">User details</h2>
          <p className="text-sm text-ink-500 mt-1">
            Account information for this member
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border border-ink-100 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 text-ink-700 text-2xl font-semibold">
              {initials}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink-950">
              {user.name}
            </h3>
            <p className="text-sm text-ink-500 mt-0.5 break-all">{user.email}</p>
            <Badge
              variant="secondary"
              className="mt-3 bg-ink-100 text-ink-800 capitalize"
            >
              {user.role}
            </Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-ink-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-ink-700">
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-ink-50">
              {fields.map((field) => {
                const Icon = field.icon;
                return (
                  <div
                    key={field.label}
                    className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                  >
                    <dt className="flex items-center gap-2 text-sm font-medium text-ink-500">
                      <Icon className="h-4 w-4 text-ink-300" />
                      {field.label}
                    </dt>
                    <dd
                      className={`text-sm text-ink-950 text-right ${
                        field.capitalize ? "capitalize" : ""
                      }`}
                    >
                      {field.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-ink-100 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-ink-500">Books listed</p>
              <p className="text-2xl font-semibold text-ink-950 tabular-nums">
                {listedBooks.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-ink-100 shadow-sm">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-ink-500">Books bought</p>
              <p className="text-2xl font-semibold text-ink-950 tabular-nums">
                {boughtBooks.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Books-style table for this member */}
      <Card className="border border-ink-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-ink-950">
                Books
              </CardTitle>
              <p className="text-xs text-ink-500 mt-0.5">
                Same books from this member’s My Books activity
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-ink-100 bg-white p-0.5 shadow-sm self-start">
              {(
                [
                  {
                    id: "listed" as const,
                    label: "Books listed",
                    count: listedBooks.length,
                  },
                  {
                    id: "bought" as const,
                    label: "Bought",
                    count: boughtBooks.length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBooksTab(tab.id)}
                  className={`h-8 px-3 rounded-md text-xs font-medium transition-all ${
                    booksTab === tab.id
                      ? "bg-ink-600 text-white shadow-sm"
                      : "text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 tabular-nums ${
                      booksTab === tab.id ? "text-white/80" : "text-ink-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {tableRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-4 py-10 text-center">
              <p className="text-sm font-medium text-ink-900">
                {booksTab === "listed"
                  ? "No books listed yet"
                  : "No bought books yet"}
              </p>
              <p className="text-xs text-ink-500 mt-1">
                {booksTab === "listed"
                  ? "Listings this member uploads for sale appear here."
                  : "Purchases from the thrift marketplace appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-ink-400 border-b border-ink-100">
                    <th className="pb-3 pl-1 font-medium">Book</th>
                    <th className="pb-3 font-medium">Author</th>
                    <th className="pb-3 font-medium">Genre</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">
                      {booksTab === "bought" ? "Bought" : "Listed"}
                    </th>
                    <th className="pb-3 pr-1 font-medium text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((book) => {
                    const date =
                      booksTab === "bought"
                        ? formatDate((book as BoughtBook).boughtAt)
                        : formatDate(book.listedAt);
                    return (
                      <tr
                        key={`${booksTab}-${book.id}`}
                        className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40 transition-colors"
                      >
                        <td className="py-3 pl-1">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={book.coverImage}
                              alt=""
                              className="h-12 w-9 shrink-0 rounded object-cover border border-ink-100 bg-ink-50"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-ink-950 truncate max-w-[220px]">
                                {book.title}
                              </p>
                              {book.condition && (
                                <p className="text-[11px] text-ink-400 mt-0.5">
                                  {book.condition}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-ink-600 max-w-[140px] truncate">
                          {book.author}
                        </td>
                        <td className="py-3 text-ink-600">{book.genre || "—"}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass(book, booksTab)}`}
                          >
                            {statusLabel(book, booksTab)}
                          </span>
                        </td>
                        <td className="py-3 text-ink-600 tabular-nums">
                          {date}
                        </td>
                        <td className="py-3 pr-1 text-right font-medium text-ink-950 tabular-nums">
                          {formatPrice(book.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetail;
