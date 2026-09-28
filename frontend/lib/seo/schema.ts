/**
 * JSON-LD structured data builders. Real, already-published business facts
 * only — every value below is copied from the live site's existing
 * LocalBusiness schema (my-digital-savvy-v2.html) or mds-theme/functions.php,
 * not invented for this rebuild. Once lib/wordpress/site-settings.ts is
 * wired to the real WP backend, swap these constants for values pulled
 * from getSiteSettings() so a content editor can update them without a
 * code change — leave hard-coded until then rather than guessing a shape.
 */

export const ORGANIZATION_FACTS = {
  name: "My Digital Savvy",
  url: "https://mydigitalsavvy.com",
  telephone: "+91-8149105083",
  whatsapp: "918149105083",
  email: "hello@mydigitalsavvy.com",
  foundingDate: "2018",
  addresses: [
    {
      streetAddress: "Shop No 67, 1st Floor, Rahul Complex 2, Ganeshpeth",
      addressLocality: "Nagpur",
      postalCode: "440018",
      addressRegion: "Maharashtra",
    },
    {
      streetAddress:
        "15/16, NMC Complex, 1st Floor, J.B. Wing, Mangalwari, Sadar",
      addressLocality: "Nagpur",
      postalCode: "440001",
      addressRegion: "Maharashtra",
    },
  ],
  areaServed: ["Nagpur", "Indore", "Raipur", "Hyderabad", "Jabalpur"],
  sameAs: [
    "https://www.facebook.com/profile.php?id=61553360870147",
    "https://www.instagram.com/mydigitalsavvy/",
    "https://www.linkedin.com/company/my-digital-savvy/",
  ],
  aggregateRating: {
    ratingValue: "4.9",
    reviewCount: "320",
    bestRating: "5",
  },
} as const;

export function buildLocalBusinessSchema() {
  const f = ORGANIZATION_FACTS;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: f.name,
    url: f.url,
    telephone: f.telephone,
    email: f.email,
    foundingDate: f.foundingDate,
    address: f.addresses.map((address) => ({
      "@type": "PostalAddress",
      ...address,
      addressCountry: "IN",
    })),
    areaServed: f.areaServed,
    sameAs: f.sameAs,
    aggregateRating: {
      "@type": "AggregateRating",
      ...f.aggregateRating,
    },
  };
}

export function buildArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: article.url,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    author: article.authorName
      ? { "@type": "Person", name: article.authorName }
      : { "@type": "Organization", name: ORGANIZATION_FACTS.name },
    image: article.imageUrl ? [article.imageUrl] : undefined,
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_FACTS.name,
      url: ORGANIZATION_FACTS.url,
    },
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
