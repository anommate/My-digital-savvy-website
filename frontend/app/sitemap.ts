import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/wordpress";

const BASE_URL = "https://mydigitalsavvy.com";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/services`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.6 },
  { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts({ perPage: 100 });
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...STATIC_ROUTES, ...postRoutes];
}
