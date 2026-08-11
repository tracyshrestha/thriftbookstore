import React, { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserById, updateUserProfile } from "@/api/users.api";
import { Check, Pencil, X } from "lucide-react";
import PageSkeleton from "@/components/ui/PageSkeleton";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
};

const UserProfile: React.FC = () => {
  const { user, isLoading, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
  });

  // Hydrate phone/joinedAt from users API when missing on session user
  useEffect(() => {
    if (!user?.id) return;
    if (user.phone) return;

    let cancelled = false;
    getUserById(user.id).then((full) => {
      if (cancelled || !full) return;
      if (full.phone || full.joinedAt) {
        updateUser({
          phone: full.phone,
          joinedAt: full.joinedAt,
        });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only enrich once when phone missing
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    });
  }, [user]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <p className="text-ink-500">No profile data available.</p>;
  }

  const startEdit = () => {
    setError("");
    setSuccess("");
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setError("");
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    });
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateUserProfile(user, {
        id: user.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
      });
      updateUser(updated);
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-ink-950 mb-1">Profile</h2>
          <p className="text-ink-500">Your account information</p>
        </div>

        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startEdit}
            className="border-ink-200 text-ink-800 hover:bg-ink-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              disabled={isSaving}
              className="border-ink-200"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="profile-edit-form"
              size="sm"
              disabled={isSaving}
              className="bg-ink-700 hover:bg-ink-800 text-white"
            >
              <Check className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && !isEditing && (
        <div className="mb-4 rounded-md border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-700">
          {success}
        </div>
      )}

      <Card className="border border-ink-100 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-700 text-xl font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl text-ink-950 truncate">
              {isEditing ? form.name || user.name : user.name}
            </CardTitle>
            <p className="text-sm text-ink-500 truncate">
              {isEditing ? form.email || user.email : user.email}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-ink-100 text-ink-800 capitalize"
          >
            {user.role}
          </Badge>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form
              id="profile-edit-form"
              onSubmit={handleSave}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="profile-name" className="text-ink-700">
                  Name
                </Label>
                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="border-ink-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="text-ink-700">
                  Email
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="border-ink-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-phone" className="text-ink-700">
                  Phone
                </Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 555-0000"
                  className="border-ink-200"
                />
              </div>

              <div className="rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2 text-xs text-ink-500">
                User ID and role cannot be changed.
              </div>
            </form>
          ) : (
            <dl className="divide-y divide-ink-50">
              {[
                { label: "Name", value: user.name },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone || "—" },
                { label: "User ID", value: user.id },
                { label: "Role", value: user.role, capitalize: true },
              ].map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <dt className="text-sm font-medium text-ink-500">
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
              ))}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
