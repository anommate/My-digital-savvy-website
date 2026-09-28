/**
 * WordPress content models.
 *
 * Two layers on purpose:
 *  - `WP*` types mirror the raw WordPress REST API response shape.
 *  - The plain (un-prefixed) types are what components actually receive —
 *    normalized, with rendered HTML fields already unwrapped and media
 *    resolved to a plain url/alt pair.
 *
 * Components should only ever import the normalized types. Raw `WP*`
 * shapes stay inside lib/wordpress/*.
 *
 * Services, Industries, Testimonials, Case Studies and Team Members are
 * modeled as WordPress custom post types with fields under `acf` — this
 * matches the most common way non-developers get structured fields in
 * WP admin (Advanced Custom Fields), but the exact field names below are
 * my best-guess shape, not confirmed against the real installation yet.
 * Once WORDPRESS_API_URL points at the live site, diff these against its
 * actual `/wp-json/wp/v2/<type>` response and adjust before Phase 8 is
 * considered done.
 */

export interface WPRendered {
  rendered: string;
}

export interface WPMediaDetails {
  width: number;
  height: number;
  sizes?: Record<string, { source_url: string; width: number; height: number }>;
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text: string;
  media_details?: WPMediaDetails;
}

export interface Media {
  id: number;
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export function normalizeMedia(
  media: WPMedia | null | undefined
): Media | null {
  if (!media) return null;
  return {
    id: media.id,
    url: media.source_url,
    alt: media.alt_text || "",
    width: media.media_details?.width,
    height: media.media_details?.height,
  };
}

/* ── Pages ────────────────────────────────────────────────────── */

export interface WPPage {
  id: number;
  slug: string;
  title: WPRendered;
  content: WPRendered;
  excerpt: WPRendered;
  featured_media: number;
  _embedded?: { "wp:featuredmedia"?: WPMedia[] };
  yoast_head_json?: WPSeoMeta;
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: Media | null;
  seo: SeoMeta | null;
}

/* ── Posts (Blog) ─────────────────────────────────────────────── */

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: WPRendered;
  content: WPRendered;
  excerpt: WPRendered;
  featured_media: number;
  categories: number[];
  _embedded?: {
    "wp:featuredmedia"?: WPMedia[];
    author?: { name: string }[];
    "wp:term"?: WPCategory[][];
  };
  yoast_head_json?: WPSeoMeta;
}

export interface Post {
  id: number;
  slug: string;
  date: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: Media | null;
  author: string | null;
  categories: Category[];
  seo: SeoMeta | null;
}

/* ── Categories ───────────────────────────────────────────────── */

export interface WPCategory {
  id: number;
  slug: string;
  name: string;
  count: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  count: number;
}

/* ── Services (custom post type, ACF-shaped — verify against live WP) */

export interface WPServiceACF {
  summary?: string;
  icon?: string;
  tags?: string[];
  cta_label?: string;
}

export interface WPService {
  id: number;
  slug: string;
  title: WPRendered;
  content: WPRendered;
  acf?: WPServiceACF;
  menu_order?: number;
}

export interface Service {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  icon: string | null;
  tags: string[];
  ctaLabel: string | null;
  order: number;
}

/* ── Industries (custom post type — verify against live WP) ─────── */

export interface WPIndustry {
  id: number;
  slug: string;
  title: WPRendered;
  content: WPRendered;
  acf?: { summary?: string };
}

export interface Industry {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
}

/* ── Testimonials (custom post type — verify against live WP) ───── */

export interface WPTestimonialACF {
  author_name?: string;
  author_role?: string;
  author_company?: string;
  quote?: string;
  rating?: number;
  featured?: boolean;
}

export interface WPTestimonial {
  id: number;
  acf?: WPTestimonialACF;
}

export interface Testimonial {
  id: number;
  authorName: string;
  authorRole: string | null;
  authorCompany: string | null;
  quote: string;
  rating: number | null;
  featured: boolean;
}

/* ── Case Studies (custom post type — verify against live WP) ───── */

export interface WPCaseStudyACF {
  client_name?: string;
  industry?: string;
  summary?: string;
  results?: { label: string; value: string }[];
}

export interface WPCaseStudy {
  id: number;
  slug: string;
  title: WPRendered;
  content: WPRendered;
  featured_media: number;
  acf?: WPCaseStudyACF;
  _embedded?: { "wp:featuredmedia"?: WPMedia[] };
}

export interface CaseStudy {
  id: number;
  slug: string;
  title: string;
  content: string;
  clientName: string | null;
  industry: string | null;
  summary: string | null;
  results: { label: string; value: string }[];
  featuredImage: Media | null;
}

/* ── Team Members (custom post type — verify against live WP) ───── */

export interface WPTeamMemberACF {
  role?: string;
  bio?: string;
}

export interface WPTeamMember {
  id: number;
  slug: string;
  title: WPRendered;
  featured_media: number;
  acf?: WPTeamMemberACF;
  _embedded?: { "wp:featuredmedia"?: WPMedia[] };
}

export interface TeamMember {
  id: number;
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo: Media | null;
}

/* ── Site Settings (single ACF Options page — verify against live WP) */

export interface WPSiteSettingsACF {
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  office_addresses?: { label: string; address: string }[];
  social_links?: { platform: string; url: string }[];
  gtm_id?: string;
  meta_pixel_id?: string;
  audit_cta_label?: string;
}

export interface WPSiteSettings {
  acf?: WPSiteSettingsACF;
}

export interface SiteSettings {
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  officeAddresses: { label: string; address: string }[];
  socialLinks: { platform: string; url: string }[];
  gtmId: string | null;
  metaPixelId: string | null;
  auditCtaLabel: string | null;
}

/* ── SEO (Yoast-shaped — swap normalizeSeo if a different SEO plugin
   turns out to be installed on the real backend) ────────────────── */

export interface WPSeoMeta {
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: { url: string }[];
  twitter_title?: string;
  twitter_description?: string;
  canonical?: string;
}

export interface SeoMeta {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  canonical: string | null;
}

export function normalizeSeo(
  seo: WPSeoMeta | null | undefined
): SeoMeta | null {
  if (!seo) return null;
  return {
    title: seo.title ?? null,
    description: seo.description ?? null,
    ogTitle: seo.og_title ?? null,
    ogDescription: seo.og_description ?? null,
    ogImage: seo.og_image?.[0]?.url ?? null,
    twitterTitle: seo.twitter_title ?? null,
    twitterDescription: seo.twitter_description ?? null,
    canonical: seo.canonical ?? null,
  };
}
