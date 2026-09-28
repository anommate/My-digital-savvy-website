/**
 * Base fetch layer for the WordPress REST API. Every function in
 * lib/wordpress/* goes through here — nothing outside this folder should
 * call `fetch` against WORDPRESS_API_URL directly.
 *
 * Server-only by construction: this file is only ever imported from Server
 * Components / route handlers / generateMetadata, so WORDPRESS_API_URL
 * (and any future WP auth token) never reaches the browser bundle. Do not
 * import this file from a "use client" component.
 */

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;

export class WordPressAPIError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "WordPressAPIError";
    this.status = status;
  }
}

interface WPFetchOptions {
  /** Next.js fetch cache/revalidation config. Defaults to a 1-hour ISR window. */
  next?: NextFetchRequestConfig;
  searchParams?: Record<string, string | number | boolean | undefined>;
}

/**
 * Fetches `path` from the WordPress REST API (default namespace `wp/v2`).
 * Returns null — never throws — when WORDPRESS_API_URL isn't configured,
 * the resource is a 404, or the request fails outright. Callers render
 * their own "content unavailable" fallback rather than crashing the page;
 * a marketing site should degrade, not 500, when the CMS is unreachable.
 * Anything other than a 404 is logged so a real outage is still visible.
 */
export async function wpFetch<T>(
  path: string,
  { next, searchParams }: WPFetchOptions = {}
): Promise<T | null> {
  if (!WORDPRESS_API_URL) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[wordpress] WORDPRESS_API_URL is not set — returning null for "${path}"`
      );
    }
    return null;
  }

  const base = WORDPRESS_API_URL.endsWith("/")
    ? WORDPRESS_API_URL
    : `${WORDPRESS_API_URL}/`;
  const url = new URL(path.replace(/^\//, ""), base);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: next ?? { revalidate: 3600 },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      console.error(
        `[wordpress] ${res.status} ${res.statusText} for ${url.toString()}`
      );
      throw new WordPressAPIError(
        `WordPress API responded with ${res.status} for ${path}`,
        res.status
      );
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof WordPressAPIError) throw error;
    console.error(`[wordpress] request failed for ${url.toString()}:`, error);
    return null;
  }
}

/** Same contract as wpFetch, but for endpoints that return a list. Falls back to []. */
export async function wpFetchList<T>(
  path: string,
  options: WPFetchOptions = {}
): Promise<T[]> {
  const result = await wpFetch<T[]>(path, options);
  return result ?? [];
}
