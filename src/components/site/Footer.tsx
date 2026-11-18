import type { PageContent } from "@/lib/content";
import { DraftTag, Wordmark } from "./bits";

export function Footer({ c }: { c: PageContent }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-charcoal pb-24 text-cream sm:pb-0">
      <div className="pinstripe" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Wordmark tone="light" size="lg" />
          <p className="mt-3 text-cream/80">Commercial electrical contractor.</p>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase text-gold-light">Contact</h2>
          <ul className="mt-3 space-y-2">
            {c.phone ? (
              <li>
                <a className="font-semibold underline-offset-4 hover:underline" href={`tel:${c.phone.tel}`}>
                  {c.phone.display}
                </a>
              </li>
            ) : null}
            {c.publicEmail ? (
              <li>
                <a className="font-semibold underline-offset-4 hover:underline" href={`mailto:${c.publicEmail}`}>
                  {c.publicEmail}
                </a>
              </li>
            ) : null}
            <li>
              <a className="font-semibold underline-offset-4 hover:underline" href="#bid">
                Request a Bid
              </a>
            </li>
            {c.preview && !c.phone ? (
              <li className="text-sm text-cream/70">Phone and email appear here once confirmed.</li>
            ) : null}
          </ul>
        </div>

        <div>
          {c.credentials.length ? (
            <>
              <h2 className="font-display text-lg font-bold uppercase text-gold-light">Credentials</h2>
              <ul className="mt-3 space-y-1 text-cream/90">
                {c.credentials.map((cr) => (
                  <li key={cr.label}>
                    {cr.label}: {cr.value} {cr.draft ? <DraftTag /> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : c.preview ? (
            <p className="text-sm text-cream/70">
              License and insurance details appear here only if Brandon approves them for publication.
            </p>
          ) : null}
          {c.serviceArea && !c.serviceArea.draft && c.serviceArea.value.summary ? (
            <p className="mt-4 text-cream/80">{c.serviceArea.value.summary}</p>
          ) : null}
        </div>
      </div>
      <p className="border-t border-cream/15 px-4 py-4 text-center text-sm text-cream/70">
        © {year} {c.name}
      </p>
    </footer>
  );
}

export function LaunchChecklist({ items, structuredMissing }: { items: { item: string; done: boolean }[]; structuredMissing: string[] }) {
  return (
    <section aria-labelledby="checklist-title" className="border-t border-dashed border-gold-dark bg-[#fbf1dc]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-[#3d2e15]">
        <h2 id="checklist-title" className="font-display text-xl font-bold uppercase">
          Preview only: before launch
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i.item} className="flex gap-2">
              <span aria-hidden className="font-bold">
                {i.done ? "✓" : "○"}
              </span>
              <span>
                <span className="sr-only">{i.done ? "Done: " : "Needed: "}</span>
                {i.item}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          Search structured data:{" "}
          {structuredMissing.length ? `waiting on ${structuredMissing.join(", ")}.` : "ready for the live site."}
        </p>
      </div>
    </section>
  );
}
