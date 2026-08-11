import React, { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Book } from "@/types/book.types";
import { ImageIcon, Link2, Star, Upload, X } from "lucide-react";

export type CoverInputMode = "url" | "file";

/** Payload sent when listing a book for sale */
export type UploadListingFormValues = {
  title: string;
  author: string;
  genre: string;
  priceDollars: string;
  condition: NonNullable<Book["condition"]>;
  description: string;
  /** How the cover was provided */
  coverMode: CoverInputMode;
  /** Remote image URL when coverMode is "url" */
  coverImageUrl: string;
  /** Uploaded file when coverMode is "file" (null if none) */
  coverFile: File | null;
  coverFileName: string;
  /** Display / preview URL (http URL or data/blob URL) included in payload */
  coverPreview: string;
};

/** Star levels 1–4 map to thrift condition (worst → best) */
const CONDITION_BY_STARS: NonNullable<Book["condition"]>[] = [
  "Acceptable",
  "Fair",
  "Good",
  "Like New",
];

const STARS = [1, 2, 3, 4] as const;

function starsForCondition(condition: NonNullable<Book["condition"]>): number {
  const i = CONDITION_BY_STARS.indexOf(condition);
  return i >= 0 ? i + 1 : 3;
}

function conditionForStars(stars: number): NonNullable<Book["condition"]> {
  const idx = Math.min(3, Math.max(0, Math.round(stars) - 1));
  return CONDITION_BY_STARS[idx];
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop";

const emptyForm = {
  title: "",
  author: "",
  genre: "",
  priceDollars: "",
  condition: "Good" as NonNullable<Book["condition"]>,
  description: "",
  coverMode: "url" as CoverInputMode,
  coverImageUrl: "",
  coverFile: null as File | null,
  coverFileName: "",
  coverPreview: "",
};

type UploadForSaleModalProps = {
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: UploadListingFormValues) => void | Promise<void>;
};

export function UploadForSaleModal({
  open,
  isSubmitting = false,
  onClose,
  onSubmit,
}: UploadForSaleModalProps) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setError("");
    setLocalPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Revoke blob URLs on unmount / change
  useEffect(() => {
    return () => {
      if (localPreview.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  if (!open) return null;

  const setField = <K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setCoverMode = (mode: CoverInputMode) => {
    setError("");
    setForm((prev) => ({
      ...prev,
      coverMode: mode,
      // Clear the inactive field values for a clean payload
      coverImageUrl: mode === "url" ? prev.coverImageUrl : "",
      coverFile: mode === "file" ? prev.coverFile : null,
      coverFileName: mode === "file" ? prev.coverFileName : "",
      coverPreview: mode === "url" ? prev.coverImageUrl : prev.coverPreview,
    }));
    if (mode === "url") {
      if (localPreview.startsWith("blob:")) URL.revokeObjectURL(localPreview);
      setLocalPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError("");

    if (localPreview.startsWith("blob:")) {
      URL.revokeObjectURL(localPreview);
    }

    if (!file) {
      setForm((prev) => ({
        ...prev,
        coverFile: null,
        coverFileName: "",
        coverPreview: "",
      }));
      setLocalPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WebP, etc.).");
      e.target.value = "";
      return;
    }

    // Soft size limit ~5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      e.target.value = "";
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    setForm((prev) => ({
      ...prev,
      coverFile: file,
      coverFileName: file.name,
      coverPreview: blobUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.author.trim()) {
      setError("Title and author are required.");
      return;
    }

    const price = Number(form.priceDollars);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price greater than 0.");
      return;
    }

    if (form.coverMode === "url") {
      const url = form.coverImageUrl.trim();
      const payload: UploadListingFormValues = {
        title: form.title.trim(),
        author: form.author.trim(),
        genre: form.genre.trim() || "General",
        priceDollars: form.priceDollars,
        condition: form.condition,
        description: form.description.trim(),
        coverMode: "url",
        coverImageUrl: url,
        coverFile: null,
        coverFileName: "",
        coverPreview: url || DEFAULT_COVER,
      };
      await onSubmit(payload);
      return;
    }

    // File mode
    if (!form.coverFile) {
      setError("Please upload a cover image file, or switch to URL.");
      return;
    }

    // Read file to data URL so payload is serializable / displayable after modal closes
    const dataUrl = await readFileAsDataUrl(form.coverFile);
    const payload: UploadListingFormValues = {
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre.trim() || "General",
      priceDollars: form.priceDollars,
      condition: form.condition,
      description: form.description.trim(),
      coverMode: "file",
      coverImageUrl: "",
      coverFile: form.coverFile,
      coverFileName: form.coverFile.name,
      coverPreview: dataUrl,
    };
    await onSubmit(payload);
  };

  const previewSrc =
    form.coverMode === "url"
      ? form.coverImageUrl.trim() || ""
      : localPreview;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-ink-100"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink-100 bg-white px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-ink-950">
              Upload for sale
            </h2>
            <p className="text-sm text-ink-500 mt-0.5">
              List a thrift book on the marketplace
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" htmlFor="listing-title" required>
              <Input
                id="listing-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Book title"
                required
              />
            </Field>

            <Field label="Author" htmlFor="listing-author" required>
              <Input
                id="listing-author"
                value={form.author}
                onChange={(e) => setField("author", e.target.value)}
                placeholder="Author name"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Genre" htmlFor="listing-genre">
              <Input
                id="listing-genre"
                value={form.genre}
                onChange={(e) => setField("genre", e.target.value)}
                placeholder="e.g. Fiction"
              />
            </Field>

            <Field label="Price (USD)" htmlFor="listing-price" required>
              <Input
                id="listing-price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.priceDollars}
                onChange={(e) => setField("priceDollars", e.target.value)}
                placeholder="12.99"
                required
              />
            </Field>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label id="listing-condition-label" className="text-ink-800">
                Condition
              </Label>
              <span className="text-sm font-medium text-ink-800">
                {form.condition}
              </span>
            </div>
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-labelledby="listing-condition-label"
            >
              {STARS.map((star) => {
                const active = starsForCondition(form.condition) >= star;
                const label = CONDITION_BY_STARS[star - 1];
                return (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={starsForCondition(form.condition) === star}
                    aria-label={`${star} star${star === 1 ? "" : "s"} — ${label}`}
                    onClick={() => setField("condition", conditionForStars(star))}
                    className={`p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-200 ${
                      active
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-ink-200 hover:text-amber-400"
                    }`}
                  >
                    <Star
                      className={`h-7 w-7 ${active ? "fill-current" : ""}`}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-400">
              Click stars to rate condition: Acceptable → Fair → Good → Like New
            </p>
          </div>

          {/* Cover: URL vs File toggle */}
          <div className="space-y-2">
            <Label className="text-ink-800">Cover image</Label>
            <div
              className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5"
              role="group"
              aria-label="Cover input mode"
            >
              <button
                type="button"
                onClick={() => setCoverMode("url")}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                  form.coverMode === "url"
                    ? "bg-ink-700 text-white shadow-sm"
                    : "text-ink-600 hover:bg-white"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setCoverMode("file")}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                  form.coverMode === "file"
                    ? "bg-ink-700 text-white shadow-sm"
                    : "text-ink-600 hover:bg-white"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload file
              </button>
            </div>

            {form.coverMode === "url" ? (
              <Input
                id="listing-cover-url"
                value={form.coverImageUrl}
                onChange={(e) => {
                  setField("coverImageUrl", e.target.value);
                  setField("coverPreview", e.target.value);
                }}
                placeholder="https://example.com/cover.jpg"
              />
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  id="listing-cover-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-md file:border-0 file:bg-ink-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-800 hover:file:bg-ink-200"
                />
                {form.coverFileName && (
                  <p className="text-xs text-ink-500">
                    Selected:{" "}
                    <span className="font-medium text-ink-800">
                      {form.coverFileName}
                    </span>{" "}
                    ({formatBytes(form.coverFile?.size ?? 0)})
                  </p>
                )}
              </div>
            )}

            {previewSrc ? (
              <div className="mt-2 flex items-start gap-3 rounded-lg border border-ink-100 bg-ink-50/50 p-2">
                <img
                  src={previewSrc}
                  alt="Cover preview"
                  className="h-20 w-14 rounded object-cover border border-ink-100 bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <p className="text-xs text-ink-500 pt-1">
                  Preview ({form.coverMode === "url" ? "URL" : "file"})
                </p>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2 text-xs text-ink-400">
                <ImageIcon className="h-3.5 w-3.5" />
                {form.coverMode === "url"
                  ? "Optional — a default cover is used if empty"
                  : "Required for file mode"}
              </div>
            )}
          </div>

          <Field label="Description" htmlFor="listing-description">
            <textarea
              id="listing-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Condition notes, edition, etc."
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-y min-h-[80px]"
            />
          </Field>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 pb-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-ink-700 hover:bg-ink-800 text-white"
            >
              {isSubmitting ? "Listing..." : "List for sale"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-ink-800">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
