import type { Metadata } from "next";
import { getPage } from "@/lib/wordpress";

export const metadata: Metadata = {
  title: "About",
  description:
    "My Digital Savvy is a digital marketing agency based in Nagpur, Maharashtra — one team running Meta Ads, websites and content for businesses across Maharashtra.",
};

export default async function AboutPage() {
  const page = await getPage("about");

  return (
    <main className="p-mds-pad mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight uppercase">
        About
      </h1>
      {page ? (
        <div
          className="prose prose-invert mt-6"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="text-mds-ash mt-6 text-sm">
          Content not yet available from WordPress — real About copy lands in
          Phase 4.
        </p>
      )}
    </main>
  );
}
