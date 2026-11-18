import type { PageContent } from "@/lib/content";
import { DraftTag, SectionHeading } from "./bits";

export function Services({ c }: { c: PageContent }) {
  if (!c.services.length) return null;
  return (
    <section aria-labelledby="services-title" id="services" className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeading id="services-title" eyebrow="What we bid" title="Commercial services" />
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {c.services.map((s, i) => (
          <li key={s.id} className="flex flex-col rounded-md border border-line bg-paper p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="font-display text-sm font-bold text-gold-dark" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.draft ? <DraftTag /> : null}
            </div>
            <h3 className="font-display mt-3 text-2xl font-extrabold uppercase text-burgundy">{s.title}</h3>
            <p className="mt-2 text-charcoal-600">{s.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecentWork({ c }: { c: PageContent }) {
  // Live: hidden until there are approved projects with real photos.
  if (!c.projects.length && !c.preview) return null;

  return (
    <section aria-labelledby="work-title" id="work" className="border-y border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading id="work-title" eyebrow="Projects" title="Recent work" />
          {!c.projects.length ? (
            <DraftTag>Hidden on the live site until photos + permission are in</DraftTag>
          ) : null}
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {c.projects.length
            ? c.projects.map((p) => (
                <li key={p.id}>
                  <figure>
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.imageAlt}
                        className="aspect-[4/3] w-full rounded-md object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <PhotoSlot />
                    )}
                    <figcaption className="mt-3">
                      <p className="font-display text-xl font-bold uppercase text-charcoal">{p.title}</p>
                      <p className="text-charcoal-600">
                        {p.scope}
                        {p.location ? ` · ${p.location}` : ""}
                      </p>
                      {p.draft ? (
                        <span className="mt-2 inline-block">
                          <DraftTag />
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                </li>
              ))
            : [1, 2, 3].map((n) => (
                <li key={n}>
                  <PhotoSlot />
                  <p className="mt-3 font-display text-xl font-bold uppercase text-charcoal-600">Project name</p>
                  <p className="text-charcoal-600">Type of work · size · city (if the client is OK with it)</p>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}

function PhotoSlot() {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md border-2 border-dashed border-[#b9ab94] bg-cream text-center text-sm font-semibold text-charcoal-600">
      Approved project photo
    </div>
  );
}

export function ServiceArea({ c }: { c: PageContent }) {
  if (!c.serviceArea && !c.preview) return null;
  const area = c.serviceArea?.value;
  return (
    <section aria-labelledby="area-title" id="area" className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
      <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading id="area-title" eyebrow="Where we work" title="Service area" />
          {area ? (
            <>
              {c.serviceArea?.draft ? (
                <p className="mt-3">
                  <DraftTag />
                </p>
              ) : null}
              {area.summary ? <p className="mt-4 text-lg text-charcoal-600">{area.summary}</p> : null}
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <DraftTag>Waiting on Brandon</DraftTag>
              <p className="text-lg text-charcoal-600">
                Cities or counties go here once Brandon confirms where he wants to bid. This section stays hidden
                on the live site until then.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {area?.places.length ? (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-lg font-semibold text-charcoal">
              {area.places.map((p) => (
                <li key={p} className="border-b border-line py-2">
                  {p}
                </li>
              ))}
            </ul>
          ) : null}

          {c.hours ? (
            <div>
              <h3 className="font-display flex items-center gap-3 text-xl font-bold uppercase">
                Office hours {c.hours.draft ? <DraftTag /> : null}
              </h3>
              <dl className="mt-3 divide-y divide-line">
                {c.hours.value.map((h) => (
                  <div key={h.days} className="flex justify-between py-2">
                    <dt className="font-semibold">{h.days}</dt>
                    <dd className="text-charcoal-600">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
