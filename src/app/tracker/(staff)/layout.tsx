import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "../actions";
import { requireStaff } from "@/lib/auth";
import { dataBackend, emailDeliveryEnabled, isPreview } from "@/lib/site-mode";

export const metadata: Metadata = { title: "Bid Tracker | Brandon Electric", robots: { index: false, follow: false } };

export default async function StaffLayout({ children }: LayoutProps<"/tracker">) {
  const staff = await requireStaff();
  const sample = dataBackend() === "local";
  return (
    <div className="on-light flex flex-1 flex-col">
      {isPreview() || !emailDeliveryEnabled() ? (
        <p className="bg-[#fbf1dc] px-4 py-2 text-center text-sm text-[#5a4420]">
          {sample ? "Local preview with sample bids. " : ""}
          {emailDeliveryEnabled() ? "" : "Outbound email is off — messages are logged in the Outbox only."}
        </p>
      ) : null}
      <header className="bg-charcoal text-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/tracker" className="font-display text-xl font-extrabold uppercase">
            Bid Tracker
          </Link>
          <nav aria-label="Tracker" className="flex flex-wrap items-center gap-1 text-[0.95rem]">
            <Link className="rounded-sm px-3 py-1.5 font-semibold hover:underline" href="/tracker">
              Queue
            </Link>
            <Link className="rounded-sm bg-cream px-3 py-1.5 font-bold text-burgundy" href="/tracker/new">
              + Add invite
            </Link>
            <Link className="rounded-sm px-3 py-1.5 font-semibold hover:underline" href="/tracker/outbox">
              Outbox
            </Link>
            <form action={signOutAction} className="flex items-center gap-2 pl-2">
              <span className="text-sm text-cream/80">{staff.displayName}</span>
              <button type="submit" className="rounded-sm px-2 py-1.5 text-sm font-semibold underline">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
