import { wpFetchList } from "./client";
import type { Industry, WPIndustry } from "./types";

function normalizeIndustry(industry: WPIndustry): Industry {
  return {
    id: industry.id,
    slug: industry.slug,
    title: industry.title.rendered,
    summary: industry.acf?.summary ?? "",
    content: industry.content.rendered,
  };
}

/** Verticals MDS serves (hospitality, education, trading, jewellery, real estate, ...). */
export async function getIndustries(): Promise<Industry[]> {
  const industries = await wpFetchList<WPIndustry>("wp/v2/industry", {
    searchParams: { per_page: 20 },
  });
  return industries.map(normalizeIndustry);
}
