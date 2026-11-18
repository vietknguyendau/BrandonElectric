import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getStore } from "@/lib/bids/store";
import { emailDeliveryEnabled } from "@/lib/site-mode";

const STATUS: Record<string, string> = {
  disabled: "Not sent (email off)",
  sent: "Sent",
  failed: "Failed",
};

export default async function OutboxPage() {
  await requireStaff();
  const emails = await (await getStore()).listOutbox();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase">Outbox</h1>
        <p className="text-charcoal-600">
          {emailDeliveryEnabled()
            ? "Every email the website sent or tried to send."
            : "Email delivery is off. These are the messages that would have gone out."}
        </p>
      </div>
      {emails.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-4 text-charcoal-600">No emails yet.</p>
      ) : (
        <ul className="space-y-4" data-testid="outbox-list">
          {emails.map((m) => (
            <li key={m.id} className="rounded-md border border-line bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-bold uppercase tracking-wide text-charcoal-600">
                  {m.kind === "estimator_notification" ? "To estimator" : "Receipt to requester"}
                </span>
                <span className={m.status === "failed" ? "font-bold text-danger" : "font-semibold"}>
                  {STATUS[m.status]}
                  {m.error ? ` — ${m.error}` : ""}
                </span>
              </div>
              <p className="mt-2 font-semibold">{m.subject}</p>
              <p className="text-sm text-charcoal-600">To: {m.to}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-semibold text-burgundy">Show message</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-sm bg-cream p-3 font-sans text-sm">{m.text}</pre>
              </details>
              {m.bidId ? (
                <Link href={`/tracker/bids/${m.bidId}`} className="mt-2 inline-block text-sm text-burgundy underline">
                  Open bid
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
