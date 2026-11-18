import type { ReactNode } from "react";

/** Simple wordmark until Brandon provides official logo files. */
export function Wordmark({ tone = "dark", size = "md" }: { tone?: "dark" | "light"; size?: "md" | "lg" }) {
  const main = tone === "dark" ? "text-burgundy" : "text-cream";
  const sub = tone === "dark" ? "text-charcoal" : "text-gold-light";
  return (
    <span className="inline-flex flex-col leading-none" aria-label="Brandon Electric">
      <span
        aria-hidden
        className={`font-display font-extrabold uppercase tracking-tight ${main} ${size === "lg" ? "text-3xl" : "text-[1.55rem]"}`}
      >
        Brandon
      </span>
      <span
        aria-hidden
        className={`font-display font-semibold uppercase ${sub} ${size === "lg" ? "text-sm tracking-[0.42em]" : "text-[0.7rem] tracking-[0.38em]"}`}
      >
        Electric
      </span>
    </span>
  );
}

/** Marks unapproved content. Only ever rendered in the private preview. */
export function DraftTag({ children = "Draft — needs Brandon's OK" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-dashed border-gold-dark bg-[#fbf1dc] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#5a4420]">
      {children}
    </span>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-dark">{eyebrow}</p>
      <h2 id={id} className="font-display mt-2 text-3xl font-extrabold uppercase text-charcoal sm:text-4xl">
        {title}
      </h2>
      {children ? <div className="mt-3 text-lg text-charcoal-600">{children}</div> : null}
    </div>
  );
}

export function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5.5C3 4.1 4.1 3 5.5 3h1.6c.6 0 1.1.4 1.3 1l1 3.2c.2.6 0 1.2-.5 1.6l-1.4 1a12 12 0 0 0 6 6l1-1.4c.4-.5 1-.7 1.6-.5l3.2 1c.6.2 1 .7 1 1.3v1.6c0 1.4-1.1 2.5-2.5 2.5h-1C9.6 20 4 14.4 4 7.5v-2Z"
      />
    </svg>
  );
}
