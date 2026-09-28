import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/wordpress";

export const metadata: Metadata = {
  title: "Blog",
  description: "Marketing notes from My Digital Savvy, Nagpur.",
};

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <main className="p-mds-pad mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight uppercase">Blog</h1>
      {posts.length > 0 ? (
        <ul className="divide-mds-rule mt-8 divide-y">
          {posts.map((post) => (
            <li key={post.id} className="py-6">
              <Link
                href={`/blog/${post.slug}`}
                className="text-lg font-bold hover:text-[var(--accent)]"
              >
                {post.title}
              </Link>
              <p
                className="text-mds-ash mt-2 text-sm"
                dangerouslySetInnerHTML={{ __html: post.excerpt }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-mds-ash mt-6 text-sm">
          No posts published yet, or WordPress isn&apos;t connected — nothing to
          fake here.
        </p>
      )}
    </main>
  );
}
