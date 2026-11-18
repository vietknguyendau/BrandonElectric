import "server-only";
import { business } from "@/config/business";
import { siteMode } from "./site-mode";

/**
 * schema.org Electrician (a LocalBusiness type). Only emitted on the live site
 * once the URL, phone, and service area are all approved — never with guesses.
 */
export function localBusinessJsonLd(): Record<string, unknown> | null {
  const b = business;
  const ready =
    siteMode() === "live" &&
    b.siteUrl.approved &&
    b.siteUrl.value &&
    b.phone.approved &&
    b.phone.value.tel &&
    b.serviceArea.approved &&
    b.serviceArea.value.places.length > 0;
  if (!ready) return null;

  const services = b.services.filter((s) => s.approved);
  return {
    "@context": "https://schema.org",
    "@type": "Electrician",
    name: b.name,
    url: b.siteUrl.value,
    telephone: b.phone.value.tel,
    ...(b.publicEmail.approved && b.publicEmail.value ? { email: b.publicEmail.value } : {}),
    areaServed: b.serviceArea.value.places.map((name) => ({ "@type": "City", name })),
    ...(services.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Commercial electrical services",
            itemListElement: services.map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s.title, description: s.description },
            })),
          },
        }
      : {}),
    ...(b.googleBusinessProfileUrl.approved && b.googleBusinessProfileUrl.value
      ? { sameAs: [b.googleBusinessProfileUrl.value] }
      : {}),
  };
}

/** What's still missing before structured data can be published (preview checklist). */
export function structuredDataMissing(): string[] {
  const b = business;
  const out: string[] = [];
  if (!(b.siteUrl.approved && b.siteUrl.value)) out.push("site URL");
  if (!(b.phone.approved && b.phone.value.tel)) out.push("phone");
  if (!(b.serviceArea.approved && b.serviceArea.value.places.length)) out.push("service area");
  return out;
}
