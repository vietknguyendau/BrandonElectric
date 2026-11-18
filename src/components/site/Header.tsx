import type { PageContent } from "@/lib/content";
import { PhoneIcon, Wordmark } from "./bits";

export function PreviewBar() {
  return (
    <div className="bg-charcoal text-cream">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-sm">
        <strong className="text-gold-light">Private preview.</strong> Draft content, not public. Bid requests save to
        sample data and no emails are sent.
      </p>
    </div>
  );
}

export function Header({ c }: { c: PageContent }) {
  const nav = [
    c.services.length ? { href: "#services", label: "Services" } : null,
    c.projects.length || c.preview ? { href: "#work", label: "Recent Work" } : null,
    c.serviceArea || c.preview ? { href: "#area", label: "Service Area" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <header className="on-light sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="#top" className="rounded-sm">
          <Wordmark />
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="rounded-sm px-3 py-2 text-[0.95rem] font-semibold text-charcoal hover:text-burgundy hover:underline underline-offset-4"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          {c.phone ? (
            <a
              href={`tel:${c.phone.tel}`}
              className="hidden items-center gap-2 rounded-md px-3 py-2 font-semibold text-burgundy hover:underline sm:inline-flex"
            >
              <PhoneIcon /> {c.phone.display}
            </a>
          ) : null}
          <a
            href="#bid"
            className="rounded-md bg-burgundy px-4 py-2.5 text-[0.95rem] font-bold text-cream hover:bg-burgundy-700"
          >
            Request a Bid
          </a>
        </nav>
      </div>
    </header>
  );
}

/** Mobile bottom bar: Call + Request a Bid. Live: only once the phone number is confirmed. */
export function MobileActionBar({ c }: { c: PageContent }) {
  if (!c.phone && !c.preview) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 p-3 backdrop-blur sm:hidden">
      <div className="grid grid-cols-2 gap-3">
        {c.phone ? (
          <a
            href={`tel:${c.phone.tel}`}
            className="on-light inline-flex items-center justify-center gap-2 rounded-md border-2 border-burgundy px-3 py-3 font-bold text-burgundy"
          >
            <PhoneIcon /> Call Brandon
          </a>
        ) : (
          <span className="inline-flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gold-dark px-2 py-1.5 text-center text-sm font-semibold leading-tight text-[#5a4420]">
            Call Brandon
            <span className="text-xs font-normal">number to confirm</span>
          </span>
        )}
        <a
          href="#bid"
          className="inline-flex items-center justify-center rounded-md bg-burgundy px-3 py-3 font-bold text-cream"
        >
          Request a Bid
        </a>
      </div>
    </div>
  );
}
