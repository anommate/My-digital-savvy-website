import { wpFetchList } from "./client";
import { normalizeMedia, normalizeSeo, type Page, type WPPage } from "./types";

function normalizePage(page: WPPage): Page {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title.rendered,
    content: page.content.rendered,
    excerpt: page.excerpt.rendered,
    featuredImage: normalizeMedia(page._embedded?.["wp:featuredmedia"]?.[0]),
    seo: normalizeSeo(page.yoast_head_json),
  };
}

/** All pages, embedding featured media and (if the Yoast SEO plugin is active) SEO meta. */
export async function getPages(): Promise<Page[]> {
  const pages = await wpFetchList<WPPage>("wp/v2/pages", {
    searchParams: { _embed: true, per_page: 100 },
  });
  return pages.map(normalizePage);
}

/** A single page by slug, or null if it doesn't exist / WordPress is unreachable. */
export async function getPage(slug: string): Promise<Page | null> {
  const pages = await wpFetchList<WPPage>("wp/v2/pages", {
    searchParams: { slug, _embed: true },
  });
  const page = pages[0];
  return page ? normalizePage(page) : null;
}
