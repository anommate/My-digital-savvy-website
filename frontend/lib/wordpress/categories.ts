import { wpFetchList } from "./client";
import type { Category, WPCategory } from "./types";

function normalizeCategory(category: WPCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    count: category.count,
  };
}

/** Blog categories with at least one published post. */
export async function getCategories(): Promise<Category[]> {
  const categories = await wpFetchList<WPCategory>("wp/v2/categories", {
    searchParams: { per_page: 100, hide_empty: true },
  });
  return categories.map(normalizeCategory);
}
