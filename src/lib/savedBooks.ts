const LEGACY_KEY = "thrift_saved_book_ids";
const MAP_KEY = "thrift_saved_by_user";

type SavedMap = Record<string, string[]>;

function readMap(): SavedMap {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SavedMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: SavedMap) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === "string");
}

/** Read legacy global list once (older app versions). */
function readLegacyIds(): string[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    return normalizeIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

/**
 * Saved / wishlist book ids for a user (local thrift wishlist).
 */
export function getSavedBookIds(userId?: string | null): string[] {
  if (!userId) {
    return readLegacyIds();
  }

  const map = readMap();
  if (Array.isArray(map[userId])) {
    return normalizeIds(map[userId]);
  }

  // Migrate legacy list into this user's bag on first read
  const legacy = readLegacyIds();
  if (legacy.length > 0) {
    map[userId] = legacy;
    writeMap(map);
    return legacy;
  }

  return [];
}

export function setSavedBookIds(
  ids: string[],
  userId?: string | null,
): void {
  const next = normalizeIds(ids);
  if (!userId) {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(next));
    return;
  }
  const map = readMap();
  map[userId] = next;
  writeMap(map);
}

export function toggleSavedBookId(
  id: string,
  userId?: string | null,
): string[] {
  const current = getSavedBookIds(userId);
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  setSavedBookIds(next, userId);
  return next;
}
