import type { PageContent } from "@/lib/content";
import { DraftTag, PhoneIcon } from "./bits";

export function Hero({ c, truckPhoto }: { c: PageContent; truckPhoto: boolean }) {
  const serviceNames = c.services.map((s) => s.title.toLowerCase());
  const servicesLine =
    serviceNames.length > 1
      ? `${serviceNames.slice(0, -1).join(", ")}, and ${serviceNames.at(-1)}`
      : serviceNames[0];

  return (
    <section id="top" aria-labelledby="hero-title" className="bg-burgundy text-cream">
      <div
        className={`mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 ${truckPhoto ? "lg:grid-cols-[1.15fr_1fr] lg:items-center" : ""}`}
      >
        <div>
          {c.primaryArea ? (
            <p className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-light">
              {c.primaryArea.value}
              {c.primaryArea.draft ? <DraftTag /> : null}
            </p>
          ) : c.preview ? (
            <p className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-light">
              City / service area
              <DraftTag>Add once confirmed</DraftTag>
            </p>
          ) : null}

          <h1
            id="hero-title"
            className="font-display mt-4 max-w-3xl text-[2.75rem] font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl"
          >
            Commercial Electrical Contractor
          </h1>
          <div className="pinstripe mt-6 max-w-md" aria-hidden />

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/90 sm:text-xl">
            {servicesLine ? (
              <>
                {c.name} bids {servicesLine} for general contractors, property and facilities managers, and
                business owners.
              </>
            ) : (
              <>
                {c.name} bids commercial electrical work for general contractors, property and facilities managers,
                and business owners.
              </>
            )}{" "}
            Send your plans and bid date.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#bid"
              className="inline-flex items-center justify-center rounded-md bg-cream px-6 py-3.5 text-lg font-bold text-burgundy hover:bg-white"
            >
              Request a Bid
            </a>
            {c.phone ? (
              <a
                href={`tel:${c.phone.tel}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-cream/80 px-6 py-3.5 text-lg font-bold text-cream hover:bg-burgundy-700"
              >
                <PhoneIcon /> Call Brandon
              </a>
            ) : c.preview ? (
              <span className="inline-flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gold-light px-6 py-2 text-center font-bold text-gold-light">
                Call Brandon
                <span className="text-xs font-normal">Shows once his business number is confirmed</span>
              </span>
            ) : null}
          </div>
        </div>

        {truckPhoto ? (
          <figure className="overflow-hidden rounded-md border border-gold/60 bg-burgundy-900">
            {/* eslint-disable-next-line @next/next/no-img-element -- private preview asset, not optimized on purpose */}
            <img
              src="/preview-assets/truck"
              alt="Brandon Electric work truck in burgundy with gold lettering"
              className="h-full w-full object-cover"
            />
            <figcaption className="px-3 py-2 text-xs text-cream/80">
              Preview only — redacted photo stays out of the live site.
            </figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}

export function Audience() {
  const items = [
    {
      who: "General contractors",
      what: "Send the plan set, specs, and your bid due date. Add addenda as they come out.",
    },
    {
      who: "Property & facilities managers",
      what: "Describe the building, the work, and any tenant or access constraints.",
    },
    {
      who: "Business owners",
      what: "Tell us what you're building or changing, where, and when you need it done.",
    },
  ];
  return (
    <section aria-labelledby="audience-title" className="border-b border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 id="audience-title" className="sr-only">
          Who requests bids
        </h2>
        <ul className="grid gap-8 md:grid-cols-3">
          {items.map((i) => (
            <li key={i.who} className="border-l-4 border-burgundy pl-4">
              <p className="font-display text-xl font-bold uppercase text-charcoal">{i.who}</p>
              <p className="mt-1 text-charcoal-600">{i.what}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
