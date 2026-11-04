/**
 * HTTP client for mock APIs served from `public/mock-api`.
 * Uses real `fetch` so requests appear in the browser Network tab.
 */

const API_BASE = "/mock-api";

/** Artificial latency so loading states feel like a real backend */
const MIN_DELAY_MS = 250;
const MAX_DELAY_MS = 700;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency() {
  return (
    MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS))
  );
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Skip artificial delay (still uses network fetch) */
  noDelay?: boolean;
  signal?: AbortSignal;
}

/**
 * Request a mock endpoint (path relative to /mock-api, e.g. "users/list.json").
 * POST/PUT/PATCH still perform a GET under the hood on static JSON files,
 * but the method is set on the Request for Network-tab clarity where possible.
 * Static hosts only support GET for .json; we use GET for file load and
 * log the intended verb in a custom header-visible way via query `_method`.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const cleanPath = path.replace(/^\//, "");
  const url = new URL(`${API_BASE}/${cleanPath}`, window.location.origin);

  // Surface intended verb in Network tab for non-GET operations
  if (method !== "GET") {
    url.searchParams.set("_method", method);
  }

  if (!options.noDelay) {
    await delay(randomLatency());
  }

  const init: RequestInit = {
    method: "GET", // static JSON files only support GET
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Mock-Method": method,
    },
    signal: options.signal,
    cache: "no-store",
  };

  // Attach body as query for debug visibility on mock POST (no real backend)
  if (options.body !== undefined && method !== "GET") {
    url.searchParams.set("payload", JSON.stringify(options.body));
  }

  const res = await fetch(url.toString(), init);

  if (!res.ok) {
    throw new ApiError(
      `API ${method} ${cleanPath} failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

export function getApiBase() {
  return API_BASE;
}
