/**
 * @deprecated Prefer `@/api` domain modules + `apiRequest` from `@/api/client`.
 * Kept for compatibility; uses the simulated client (Network tab).
 */
import { apiRequest } from "@/api/client";

export async function fetchJson<T>(path: string): Promise<T> {
  // Allow absolute mock paths like "/mock-api/users/list.json"
  const relative = path.replace(/^\/?mock-api\//, "").replace(/^\//, "");
  return apiRequest<T>(relative);
}
