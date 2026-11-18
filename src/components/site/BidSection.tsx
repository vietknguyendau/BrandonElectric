import type { PageContent } from "@/lib/content";
import { BidForm } from "./BidForm";
import { SectionHeading } from "./bits";

export function BidSection({ c }: { c: PageContent }) {
  return (
    <section aria-labelledby="bid-form-title" id="bid" className="border-t-8 border-burgundy bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionHeading id="bid-form-title" eyebrow="Bid requests" title="Request a Bid">
            <p>Tell us about the project. The estimator gets your request with the due date and plans link.</p>
          </SectionHeading>
          <div className="mt-8 border-l-4 border-gold pl-4">
            <p className="font-display text-lg font-bold uppercase">What helps us bid accurately</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-charcoal-600">
              <li>A link to the plan set and specs</li>
              <li>Bid due date, or that it isn&apos;t set yet</li>
              <li>Project address or city</li>
              <li>Who to contact with questions</li>
            </ul>
          </div>
        </div>
        <BidForm
          preview={c.preview}
          phone={c.phone}
          publicEmail={c.publicEmail}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
        />
      </div>
    </section>
  );
}
