import type { Metadata } from "next";
import { buildLocalBusinessSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "My Digital Savvy — Digital marketing agency in Nagpur",
};

/**
 * Placeholder for the homepage. The real composition (Hero, Results,
 * Marquee, Services, Growth System, Industries, About, Process,
 * Testimonials, Why Us, Audit, Contact) lands in Phase 4, each as its own
 * component under components/* rather than inline here — see the folder
 * structure in the migration brief.
 */
export default function HomePage() {
  const schema = buildLocalBusinessSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="p-mds-pad flex min-h-svh flex-col items-center justify-center gap-4 text-center">
        <p className="label text-mds-ash text-xs font-semibold tracking-[0.12em] uppercase">
          Digital marketing agency &middot; Nagpur, Maharashtra
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight uppercase sm:text-6xl">
          Marketing that pays for itself.
        </h1>
        <p className="text-mds-ash max-w-md text-sm">
          Homepage content migration is Phase 4 of the rebuild — this is the
          architecture checkpoint.
        </p>
      </main>
    </>
  );
}
