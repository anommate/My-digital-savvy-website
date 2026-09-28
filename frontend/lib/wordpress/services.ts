import { wpFetchList } from "./client";
import type { Service, WPService } from "./types";

function normalizeService(service: WPService): Service {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title.rendered,
    summary: service.acf?.summary ?? "",
    content: service.content.rendered,
    icon: service.acf?.icon ?? null,
    tags: service.acf?.tags ?? [],
    ctaLabel: service.acf?.cta_label ?? null,
    order: service.menu_order ?? 0,
  };
}

/**
 * The nine MDS services, in display order. Assumes a `service` custom post
 * type with `menu_order` set in WP admin — confirm the post type slug and
 * ACF field names against the live site before relying on this in Phase 8.
 */
export async function getServices(): Promise<Service[]> {
  const services = await wpFetchList<WPService>("wp/v2/service", {
    searchParams: { orderby: "menu_order", order: "asc", per_page: 20 },
  });
  return services.map(normalizeService).sort((a, b) => a.order - b.order);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const services = await wpFetchList<WPService>("wp/v2/service", {
    searchParams: { slug },
  });
  const service = services[0];
  return service ? normalizeService(service) : null;
}
