const STORAGE_KEY = "thrift_saved_book_ids";

export function getSavedBookIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function setSavedBookIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function toggleSavedBookId(id: string): string[] {
  const current = getSavedBookIds();
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  setSavedBookIds(next);
  return next;
}
