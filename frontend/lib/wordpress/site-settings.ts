import { wpFetch } from "./client";
import type { SiteSettings, WPSiteSettings } from "./types";

const FALLBACK: SiteSettings = {
  phone: null,
  whatsappNumber: null,
  email: null,
  officeAddresses: [],
  socialLinks: [],
  gtmId: null,
  metaPixelId: null,
  auditCtaLabel: null,
};

function normalizeSiteSettings(settings: WPSiteSettings): SiteSettings {
  const acf = settings.acf ?? {};
  return {
    phone: acf.phone ?? null,
    whatsappNumber: acf.whatsapp_number ?? null,
    email: acf.email ?? null,
    officeAddresses: acf.office_addresses ?? [],
    socialLinks: acf.social_links ?? [],
    gtmId: acf.gtm_id ?? null,
    metaPixelId: acf.meta_pixel_id ?? null,
    auditCtaLabel: acf.audit_cta_label ?? null,
  };
}

/**
 * Global site settings (contact info, socials, tracking IDs, CTA copy) —
 * modeled as a single ACF Options page. This assumes the "ACF to REST API"
 * plugin (or equivalent) exposes it at `acf/v3/options/options`; confirm
 * the real path once WORDPRESS_API_URL points at the live install, since
 * a bare WP REST API install has no options-page endpoint by default.
 *
 * Falls back to null-shaped settings — never fabricated values — if
 * WordPress is unreachable or the endpoint doesn't exist yet.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await wpFetch<WPSiteSettings>("acf/v3/options/options");
  return settings ? normalizeSiteSettings(settings) : FALLBACK;
}
