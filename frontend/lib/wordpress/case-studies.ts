import { wpFetchList } from "./client";
import { normalizeMedia, type CaseStudy, type WPCaseStudy } from "./types";

function normalizeCaseStudy(caseStudy: WPCaseStudy): CaseStudy {
  return {
    id: caseStudy.id,
    slug: caseStudy.slug,
    title: caseStudy.title.rendered,
    content: caseStudy.content.rendered,
    clientName: caseStudy.acf?.client_name ?? null,
    industry: caseStudy.acf?.industry ?? null,
    summary: caseStudy.acf?.summary ?? null,
    results: caseStudy.acf?.results ?? [],
    featuredImage: normalizeMedia(
      caseStudy._embedded?.["wp:featuredmedia"]?.[0]
    ),
  };
}

/**
 * Case studies with verified, real client data only (per the brief: "only
 * when real verified case-study data exists"). Returns [] until the client
 * post type is actually populated in WP admin — do not fill gaps with
 * placeholder results.
 */
export async function getCaseStudies(): Promise<CaseStudy[]> {
  const caseStudies = await wpFetchList<WPCaseStudy>("wp/v2/case_study", {
    searchParams: { _embed: true, per_page: 50 },
  });
  return caseStudies.map(normalizeCaseStudy);
}

export async function getCaseStudyBySlug(
  slug: string
): Promise<CaseStudy | null> {
  const caseStudies = await wpFetchList<WPCaseStudy>("wp/v2/case_study", {
    searchParams: { slug, _embed: true },
  });
  const caseStudy = caseStudies[0];
  return caseStudy ? normalizeCaseStudy(caseStudy) : null;
}
