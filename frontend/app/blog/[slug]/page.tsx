import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/wordpress";
import { buildArticleSchema } from "@/lib/seo/schema";

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? undefined,
    openGraph: {
      title: post.seo?.ogTitle ?? post.title,
      description: post.seo?.ogDescription ?? undefined,
      images: post.featuredImage ? [post.featuredImage.url] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const schema = buildArticleSchema({
    title: post.title,
    description: post.excerpt.replace(/<[^>]+>/g, ""),
    url: `https://mydigitalsavvy.com/blog/${post.slug}`,
    datePublished: post.date,
    authorName: post.author ?? undefined,
    imageUrl: post.featuredImage?.url,
  });

  return (
    <main className="p-mds-pad mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className="text-3xl font-extrabold tracking-tight uppercase">
        {post.title}
      </h1>
      <div
        className="prose prose-invert mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </main>
  );
}
