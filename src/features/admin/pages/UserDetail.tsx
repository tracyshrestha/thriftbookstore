import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUserById, getUserSavedBookIds } from "@/api/users.api";
import { getBooks, getMyBooks } from "@/api/books.api";
import { getCheckoutsByUser } from "@/api/checkouts.api";
import type { User } from "@/features/auth/types/user";
import type { Book } from "@/types/book.types";
import { ROUTES } from "@/constants";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { getUserCredits } from "@/lib/credits";
import {
  ArrowLeft,
  BookMarked,
  CalendarDays,
  Heart,
  IdCard,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Wallet,
} from "lucide-react";

type BooksTab = "listed" | "bought" | "saved";
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

function formatJoinedLong(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleBadgeClass(role: string) {
  if (role === "superadmin") return "bg-ink-800 text-white";
  if (role === "admin") return "bg-ink-100 text-ink-800";
  return "bg-ink-50 text-ink-700 ring-1 ring-ink-100";
}

function RoleIcon({ role }: { role: string }) {
  if (role === "superadmin") return <ShieldCheck className="h-3.5 w-3.5" />;
  if (role === "admin") return <Shield className="h-3.5 w-3.5" />;
  return <UserRound className="h-3.5 w-3.5" />;
}

function statusLabel(book: Book, tab: BooksTab) {
  if (tab === "bought") return "Bought";
  if (tab === "saved") return "Saved";
  if (book.status === "sold") return "Sold";
  if (book.status === "draft") return "Draft";
  return "Active";
}

function statusClass(book: Book, tab: BooksTab) {
  if (tab === "bought") return "bg-ink-100 text-ink-700";
  if (tab === "saved") return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  if (book.status === "sold") return "bg-ink-200 text-ink-800";
  if (book.status === "draft") return "bg-ink-50 text-ink-500";
  return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100";
}

const BOOKS_TABS: {
  id: BooksTab;
  label: string;
}[] = [
  { id: "listed", label: "Listed" },
  { id: "bought", label: "Bought" },
  { id: "saved", label: "Saved" },
];

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [listedBooks, setListedBooks] = useState<Book[]>([]);
  const [boughtBooks, setBoughtBooks] = useState<BoughtBook[]>([]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
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
        const [found, listings, checkouts, allBooks, savedIds] =
          await Promise.all([
            getUserById(id),
            getMyBooks(id),
            getCheckoutsByUser(id),
            getBooks(),
            getUserSavedBookIds(id),
          ]);

        if (cancelled) return;

        if (!found) {
          setUser(null);
          setListedBooks([]);
          setBoughtBooks([]);
          setSavedBooks([]);
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

        const saved = savedIds
          .map((bookId) => byId.get(bookId))
          .filter((b): b is Book => Boolean(b));

        setUser(found);
        setListedBooks(listings);
        setBoughtBooks(bought);
        setSavedBooks(saved);
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
    if (booksTab === "bought") return boughtBooks;
    return savedBooks;
  }, [booksTab, listedBooks, boughtBooks, savedBooks]);

  const tabCounts: Record<BooksTab, number> = {
    listed: listedBooks.length,
    bought: boughtBooks.length,
    saved: savedBooks.length,
  };

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

  const initials = getInitials(user.name);
  const creditsCents = getUserCredits(user.id, user.credits ?? 0);
  const creditsDisplay = formatPrice(creditsCents);
  const joined = formatJoinedLong(user.joinedAt);

  const profileFields = [
    { label: "Email", value: user.email, icon: Mail },
    { label: "Phone", value: user.phone || "—", icon: Phone },
    { label: "User ID", value: user.id, icon: IdCard, mono: true },
    { label: "Joined", value: joined, icon: CalendarDays },
  ];

  const emptyCopy = {
    listed: {
      title: "No books listed yet",
      hint: "Listings this member uploads for sale appear here.",
    },
    bought: {
      title: "No bought books yet",
      hint: "Purchases from the thrift marketplace appear here.",
    },
    saved: {
      title: "No saved books",
      hint: "Wishlist books this member saved from Browse appear here.",
    },
  }[booksTab];

  return (
    <div className="w-full space-y-5">
      {/* Back + page title */}
      <div>
        <Link
          to={ROUTES.ADMIN_USERS}
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <h2 className="text-2xl font-bold text-ink-950">User details</h2>
        <p className="text-sm text-ink-500 mt-1">
          Account information and thrift activity for this member
        </p>
      </div>

      {/* Profile hero */}
      <section className="rounded-xl border border-ink-100 bg-white shadow-sm overflow-hidden">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-ink-100 via-ink-50 to-white border-b border-ink-100" />
        <div className="px-5 sm:px-6 pb-5 -mt-10 sm:-mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-ink-800 text-white text-2xl sm:text-3xl font-semibold shadow-lg ring-4 ring-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-ink-950 truncate">
                  {user.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${roleBadgeClass(user.role)}`}
                >
                  <RoleIcon role={user.role} />
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-ink-500 mt-1 truncate">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:pb-1">
              <span className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-ink-100 bg-ink-50 px-3 text-sm font-semibold text-ink-900 tabular-nums">
                <Wallet className="h-3.5 w-3.5 text-ink-500" />
                {creditsDisplay}
              </span>
              <span className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-ink-100 bg-white px-3 text-xs text-ink-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {formatDate(user.joinedAt)}
              </span>
            </div>
          </div>

          {/* Profile facts */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {profileFields.map((field) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.label}
                  className="rounded-lg border border-ink-100 bg-ink-50/40 px-3.5 py-3"
                >
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
                    <Icon className="h-3 w-3" />
                    {field.label}
                  </p>
                  <p
                    className={`mt-1.5 text-sm font-medium text-ink-950 truncate ${
                      field.mono ? "font-mono text-xs" : ""
                    }`}
                    title={field.value}
                  >
                    {field.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Activity stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatPill
          icon={BookMarked}
          label="Books listed"
          value={listedBooks.length}
          active={booksTab === "listed"}
          onClick={() => setBooksTab("listed")}
        />
        <StatPill
          icon={ShoppingBag}
          label="Books bought"
          value={boughtBooks.length}
          active={booksTab === "bought"}
          onClick={() => setBooksTab("bought")}
        />
        <StatPill
          icon={Heart}
          label="Books saved"
          value={savedBooks.length}
          active={booksTab === "saved"}
          onClick={() => setBooksTab("saved")}
        />
      </div>

      {/* Books table */}
      <section className="rounded-xl border border-ink-100 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100 px-5 py-3.5">
          <div>
            <p className="text-sm font-semibold text-ink-950">Books activity</p>
            <p className="text-xs text-ink-400 mt-0.5">
              Same sources as this member’s My Books
            </p>
          </div>
          <div
            role="tablist"
            className="inline-flex flex-wrap rounded-lg border border-ink-100 bg-ink-50/60 p-0.5 self-start"
          >
            {BOOKS_TABS.map((tab) => {
              const active = booksTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setBooksTab(tab.id)}
                  className={`h-8 px-3 rounded-md text-xs font-medium transition-all ${
                    active
                      ? "bg-ink-800 text-white shadow-sm"
                      : "text-ink-600 hover:bg-white"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 tabular-nums ${
                      active ? "text-white/75" : "text-ink-400"
                    }`}
                  >
                    {tabCounts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {tableRows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-400">
              {booksTab === "saved" ? (
                <Heart className="h-5 w-5" />
              ) : booksTab === "bought" ? (
                <ShoppingBag className="h-5 w-5" />
              ) : (
                <BookMarked className="h-5 w-5" />
              )}
            </div>
            <p className="text-sm font-medium text-ink-900">{emptyCopy.title}</p>
            <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
              {emptyCopy.hint}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 bg-ink-50/60 border-b border-ink-100">
                  <th className="font-medium px-5 py-3">Book</th>
                  <th className="font-medium px-4 py-3">Author</th>
                  <th className="font-medium px-4 py-3">Genre</th>
                  <th className="font-medium px-4 py-3">Status</th>
                  <th className="font-medium px-4 py-3">
                    {booksTab === "bought"
                      ? "Bought"
                      : booksTab === "saved"
                        ? "Wishlist"
                        : "Listed"}
                  </th>
                  <th className="font-medium px-5 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((book) => {
                  const date =
                    booksTab === "bought"
                      ? formatDate((book as BoughtBook).boughtAt)
                      : booksTab === "saved"
                        ? "Saved"
                        : formatDate(book.listedAt);
                  return (
                    <tr
                      key={`${booksTab}-${book.id}`}
                      className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={book.coverImage}
                            alt=""
                            className="h-12 w-9 shrink-0 rounded-md object-cover bg-ink-100 ring-1 ring-ink-100"
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
                      <td className="px-4 py-3 text-ink-600 max-w-[140px] truncate">
                        {book.author}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-ink-50 px-1.5 py-0.5 text-[11px] font-medium text-ink-600 ring-1 ring-ink-100">
                          {book.genre || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass(book, booksTab)}`}
                        >
                          {statusLabel(book, booksTab)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-500 tabular-nums whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-ink-950 tabular-nums">
                        {formatPrice(book.price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

function StatPill({
  icon: Icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3.5 shadow-sm flex items-center gap-3 transition-all ${
        active
          ? "border-ink-300 bg-white ring-2 ring-ink-100"
          : "border-ink-100 bg-white hover:border-ink-200 hover:shadow-md"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          active ? "bg-ink-800 text-white" : "bg-ink-50 text-ink-700"
        }`}
      >
        <Icon className="h-4.5 w-4.5 h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-xl font-semibold text-ink-950 tabular-nums leading-tight">
          {value}
        </p>
      </div>
    </button>
  );
}

export default UserDetail;
