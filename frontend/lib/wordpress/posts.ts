import { wpFetchList } from "./client";
import { normalizeMedia, normalizeSeo, type Post, type WPPost } from "./types";

function normalizePost(post: WPPost): Post {
  return {
    id: post.id,
    slug: post.slug,
    date: post.date,
    title: post.title.rendered,
    content: post.content.rendered,
    excerpt: post.excerpt.rendered,
    featuredImage: normalizeMedia(post._embedded?.["wp:featuredmedia"]?.[0]),
    author: post._embedded?.author?.[0]?.name ?? null,
    categories: (post._embedded?.["wp:term"]?.[0] ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      count: c.count,
    })),
    seo: normalizeSeo(post.yoast_head_json),
  };
}

interface GetPostsOptions {
  page?: number;
  perPage?: number;
  categorySlug?: string;
}

/** Published posts, newest first. Returns [] on failure — callers should render an empty state, not crash. */
export async function getPosts({
  page = 1,
  perPage = 12,
  categorySlug,
}: GetPostsOptions = {}): Promise<Post[]> {
  let categoryId: number | undefined;
  if (categorySlug) {
    const categories = await wpFetchList<{ id: number }>("wp/v2/categories", {
      searchParams: { slug: categorySlug },
    });
    categoryId = categories[0]?.id;
    if (!categoryId) return [];
  }

  const posts = await wpFetchList<WPPost>("wp/v2/posts", {
    searchParams: {
      _embed: true,
      page,
      per_page: perPage,
      categories: categoryId,
    },
  });
  return posts.map(normalizePost);
}

/** A single post by slug, or null if it doesn't exist / WordPress is unreachable. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await wpFetchList<WPPost>("wp/v2/posts", {
    searchParams: { slug, _embed: true },
  });
  const post = posts[0];
  return post ? normalizePost(post) : null;
}
