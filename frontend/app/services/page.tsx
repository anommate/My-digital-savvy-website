import type { Metadata } from "next";
import { getServices } from "@/lib/wordpress";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Meta Ads, SEO, website development, social media and more — nine services, one team, at My Digital Savvy.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <main className="p-mds-pad mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight uppercase">
        What we do
      </h1>
      {services.length > 0 ? (
        <ul className="border-mds-rule bg-mds-rule mt-8 grid gap-px border sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.id} className="bg-mds-paper p-6">
              <h2 className="text-lg font-bold">{service.title}</h2>
              {service.summary ? (
                <p className="text-mds-ash mt-2 text-sm">{service.summary}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-mds-ash mt-6 text-sm">
          Services aren&apos;t loading from WordPress yet — connect
          WORDPRESS_API_URL and confirm the `service` custom post type in Phase
          8.
        </p>
      )}
    </main>
  );
}
