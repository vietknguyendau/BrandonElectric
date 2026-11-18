import Link from "next/link";
import { notFound } from "next/navigation";
import { EditBidForm, MarkSentForm } from "@/components/tracker/forms";
import { StatusPill, Tag } from "@/components/tracker/ui";
import { business } from "@/config/business";
import { requireStaff } from "@/lib/auth";
import { dueState, sendByPassed } from "@/lib/bids/queue";
import { getStore } from "@/lib/bids/store";
import { isOpen, SOURCE_LABEL } from "@/lib/bids/types";
import { formatDate, relativeDays, todayISO } from "@/lib/dates";

export default async function BidPage({ params, searchParams }: PageProps<"/tracker/bids/[id]">) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const store = await getStore();
  const [bid, staff] = await Promise.all([store.getBid(id), store.listStaff()]);
  if (!bid) notFound();
  const today = todayISO();
  const state = dueState(bid, today, business.dueSoonDays);
  const owner = staff.find((s) => s.id === bid.ownerId);

  return (
    <div className="space-y-8">
      <Link href="/tracker" className="font-semibold text-burgundy underline-offset-4 hover:underline">
        ← Back to queue
      </Link>

      {sp.saved || sp.sent ? (
        <p role="status" className="rounded-md border-2 border-ok bg-[#e6f2ea] px-4 py-2 font-semibold text-ok">
          {sp.sent ? "Marked as Sent." : "Saved."}
        </p>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={bid.status} />
          {state === "overdue" ? <Tag cls="bg-danger text-white">Overdue</Tag> : null}
          {state === "due-soon" ? <Tag cls="bg-[#fbf1dc] text-[#5a4420]">Due soon</Tag> : null}
          {sendByPassed(bid, today) ? <Tag cls="border border-danger text-danger">Past send-by</Tag> : null}
          {bid.isSample ? <Tag cls="bg-charcoal text-cream">Sample</Tag> : null}
        </div>
        <h1 className="font-display mt-2 text-3xl font-extrabold uppercase">{bid.projectName}</h1>
        <p className="text-charcoal-600">
          {bid.company} · {SOURCE_LABEL[bid.source]} · received {formatDate(bid.createdAt.slice(0, 10))}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="details" className="space-y-5 rounded-md border border-line bg-paper p-5">
          <h2 id="details" className="font-display text-xl font-extrabold uppercase">
            Details
          </h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
            <dt className="text-charcoal-600">Bid due</dt>
            <dd className="font-semibold">
              {bid.dueDate ? `${formatDate(bid.dueDate)} (${relativeDays(bid.dueDate, today)})` : bid.dueDateTbd ? "Not set yet" : "—"}
            </dd>
            <dt className="text-charcoal-600">Send by</dt>
            <dd>{formatDate(bid.sendByDate)}</dd>
            <dt className="text-charcoal-600">Sent</dt>
            <dd>{formatDate(bid.sentDate)}</dd>
            <dt className="text-charcoal-600">Owner</dt>
            <dd>{owner?.displayName ?? <span className="font-semibold text-danger">Unassigned</span>}</dd>
            <dt className="text-charcoal-600">Location</dt>
            <dd>{bid.projectLocation || "—"}</dd>
            <dt className="text-charcoal-600">Contact</dt>
            <dd>
              {bid.contactName || "—"}
              {bid.email ? (
                <>
                  <br />
                  <a className="text-burgundy underline" href={`mailto:${bid.email}`}>
                    {bid.email}
                  </a>
                </>
              ) : null}
              {bid.phone ? (
                <>
                  <br />
                  <a className="text-burgundy underline" href={`tel:${bid.phone.replace(/[^\d+]/g, "")}`}>
                    {bid.phone}
                  </a>
                </>
              ) : null}
            </dd>
            <dt className="text-charcoal-600">Plans / specs</dt>
            <dd className="break-all">
              {bid.plansUrl ? (
                <a className="text-burgundy underline" href={bid.plansUrl} target="_blank" rel="noopener noreferrer nofollow">
                  {bid.plansUrl}
                </a>
              ) : (
                "No link"
              )}
            </dd>
          </dl>
          <div>
            <h3 className="font-bold">Scope</h3>
            <p className="mt-1 whitespace-pre-wrap text-charcoal-600">{bid.scope || "—"}</p>
          </div>
          {bid.source === "website" ? (
            <div className="border-t border-line pt-3 text-sm text-charcoal-600">
              <p>Estimator email: {bid.estimatorNotifiedAt ? `sent ${bid.estimatorNotifiedAt}` : "not sent"}</p>
              <p>Requester receipt: {bid.receiptSentAt ? `sent ${bid.receiptSentAt}` : "not sent"}</p>
              {bid.notificationError ? <p className="font-semibold text-danger">{bid.notificationError}</p> : null}
            </div>
          ) : null}
        </section>

        <div className="space-y-8">
          {isOpen(bid.status) ? (
            <section aria-labelledby="send" className="rounded-md border-2 border-ok bg-paper p-5">
              <h2 id="send" className="font-display text-xl font-extrabold uppercase">
                Bid sent?
              </h2>
              <p className="mb-3 text-charcoal-600">Record the date it went out.</p>
              <MarkSentForm bidId={bid.id} today={today} />
            </section>
          ) : null}
          <section aria-labelledby="edit" className="rounded-md border border-line bg-paper p-5">
            <h2 id="edit" className="font-display mb-4 text-xl font-extrabold uppercase">
              Owner, status &amp; dates
            </h2>
            <EditBidForm key={bid.updatedAt} bid={bid} staff={staff} />
          </section>
        </div>
      </div>
    </div>
  );
}
