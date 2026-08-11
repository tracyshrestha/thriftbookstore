import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUserById } from "@/api/users.api";
import { getMyBooks } from "@/api/books.api";
import { getCheckoutsByUser } from "@/api/checkouts.api";
import type { User } from "@/features/auth/types/user";
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
} from "lucide-react";

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [listingCount, setListingCount] = useState(0);
  const [boughtCount, setBoughtCount] = useState(0);

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
        const [found, listings, checkouts] = await Promise.all([
          getUserById(id),
          getMyBooks(id),
          getCheckoutsByUser(id),
        ]);

        if (cancelled) return;

        if (!found) {
          setUser(null);
          setError("User not found.");
          return;
        }

        setUser(found);
        setListingCount(listings.length);
        setBoughtCount(checkouts.length);
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

  const fields = [
    { label: "Name", value: user.name, icon: UserIcon },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Phone", value: user.phone || "—", icon: Phone },
    { label: "User ID", value: user.id, icon: IdCard },
    { label: "Role", value: user.role, icon: UserIcon, capitalize: true },
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
                {listingCount}
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
                {boughtCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;
