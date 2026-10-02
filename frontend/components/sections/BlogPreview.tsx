import type { BlogPreviewContent } from "@/types/home";

export function BlogPreview({ blog }: { blog: BlogPreviewContent }) {
  return (
    <section className="wrap" id="blog" aria-labelledby="blog-heading">
      <div className="head reveal">
        <h2 id="blog-heading">{blog.heading}</h2>
        <span className="label">{blog.label}</span>
      </div>
      <div className="blog-coming reveal-group">
        <p>{blog.intro}</p>
        <div>
          <a href={blog.cta.href} className="btn ghost">
            {blog.cta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
