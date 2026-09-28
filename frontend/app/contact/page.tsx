import type { Metadata } from "next";
import { ORGANIZATION_FACTS } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with My Digital Savvy — Ganeshpeth and Sadar offices in Nagpur, Maharashtra.",
};

export default function ContactPage() {
  return (
    <main className="p-mds-pad mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight uppercase">
        Tell us what&apos;s not working.
      </h1>
      <dl className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-mds-ash text-xs font-semibold tracking-[0.12em] uppercase">
            Email
          </dt>
          <dd className="mt-1">
            <a
              href={`mailto:${ORGANIZATION_FACTS.email}`}
              className="hover:text-[var(--accent)]"
            >
              {ORGANIZATION_FACTS.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-mds-ash text-xs font-semibold tracking-[0.12em] uppercase">
            WhatsApp
          </dt>
          <dd className="mt-1">
            <a
              href={`https://wa.me/${ORGANIZATION_FACTS.whatsapp}`}
              target="_blank"
              rel="noopener"
              className="hover:text-[var(--accent)]"
            >
              {ORGANIZATION_FACTS.telephone}
            </a>
          </dd>
        </div>
        {ORGANIZATION_FACTS.addresses.map((address) => (
          <div key={address.streetAddress}>
            <dt className="text-mds-ash text-xs font-semibold tracking-[0.12em] uppercase">
              {address.addressLocality} office
            </dt>
            <dd className="text-mds-ash mt-1 text-sm">
              {address.streetAddress}, {address.addressLocality}{" "}
              {address.postalCode}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
