const STORAGE_KEY = "thrift_user_credits";

type CreditsMap = Record<string, number>;

/** Default thrift credits in cents ($150) */
export const DEFAULT_CREDITS_CENTS = 15000;

function readMap(): CreditsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CreditsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: CreditsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getUserCredits(
  userId: string,
  fallback: number = DEFAULT_CREDITS_CENTS,
): number {
  const map = readMap();
  if (typeof map[userId] === "number" && Number.isFinite(map[userId])) {
    return Math.max(0, Math.round(map[userId]));
  }
  // Seed once so returning users keep their balance
  map[userId] = fallback;
  writeMap(map);
  return fallback;
}

export function setUserCredits(userId: string, creditsCents: number): number {
  const map = readMap();
  const next = Math.max(0, Math.round(creditsCents));
  map[userId] = next;
  writeMap(map);
  return next;
}

export function deductUserCredits(
  userId: string,
  amountCents: number,
  fallback: number = DEFAULT_CREDITS_CENTS,
): number | null {
  const current = getUserCredits(userId, fallback);
  if (amountCents > current) return null;
  return setUserCredits(userId, current - amountCents);
}
