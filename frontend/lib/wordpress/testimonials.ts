import { wpFetchList } from "./client";
import type { Testimonial, WPTestimonial } from "./types";

function normalizeTestimonial(testimonial: WPTestimonial): Testimonial {
  return {
    id: testimonial.id,
    authorName: testimonial.acf?.author_name ?? "",
    authorRole: testimonial.acf?.author_role ?? null,
    authorCompany: testimonial.acf?.author_company ?? null,
    quote: testimonial.acf?.quote ?? "",
    rating: testimonial.acf?.rating ?? null,
    featured: testimonial.acf?.featured ?? false,
  };
}

/** Real, verified reviews only — never invent or pad this list. */
export async function getTestimonials(): Promise<Testimonial[]> {
  const testimonials = await wpFetchList<WPTestimonial>("wp/v2/testimonial", {
    searchParams: { per_page: 50 },
  });
  return testimonials.map(normalizeTestimonial);
}
