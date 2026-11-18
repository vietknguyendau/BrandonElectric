import Link from "next/link";
import type { ReactNode } from "react";
import { assignOwnerAction } from "@/app/tracker/actions";
import { formatDate, relativeDays } from "@/lib/dates";
import { dueState, sendByPassed, type DueState } from "@/lib/bids/queue";
import { SOURCE_LABEL, STATUS_LABEL, type Bid, type BidStatus, type Staff } from "@/lib/bids/types";

const STATUS_STYLE: Record<BidStatus, string> = {
  new: "bg-[#e8eef8] text-[#1d3a6b] border-[#b9c7e2]",
  reviewing: "bg-[#f1ebfa] text-[#4a2a7a] border-[#cfc0e6]",
  estimating: "bg-[#fbf1dc] text-[#5a4420] border-[#dcc79d]",
  sent: "bg-[#e6f2ea] text-[#1f5e3a] border-[#b5d4c0]",
  won: "bg-[#1f5e3a] text-white border-[#1f5e3a]",
  lost: "bg-[#ece8e3] text-[#4a4542] border-[#d0c8bd]",
  passed: "bg-[#ece8e3] text-[#4a4542] border-[#d0c8bd]",
};

export function StatusPill({ status }: { status: BidStatus }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const DUE_TAG: Partial<Record<DueState, { label: string; cls: string }>> = {
  overdue: { label: "Overdue", cls: "bg-danger text-white" },
  "due-soon": { label: "Due soon", cls: "bg-[#fbf1dc] text-[#5a4420] border border-[#dcc79d]" },
  "no-date": { label: "No due date", cls: "bg-[#ece8e3] text-[#4a4542]" },
};

export function Tag({ children, cls }: { children: ReactNode; cls: string }) {
  return <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${cls}`}>{children}</span>;
}

export function BidRow({
  bid,
  today,
  dueSoonDays,
  staff,
  showAssign = false,
}: {
  bid: Bid;
  today: string;
  dueSoonDays: number;
  staff: Staff[];
  showAssign?: boolean;
}) {
  const state = dueState(bid, today, dueSoonDays);
  const tag = DUE_TAG[state];
  const owner = staff.find((s) => s.id === bid.ownerId);
  return (
    <li className="rounded-md border border-line bg-paper p-4" data-testid="bid-row" data-bid-id={bid.id}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={bid.status} />
            {tag ? <Tag cls={tag.cls}>{tag.label}</Tag> : null}
            {sendByPassed(bid, today) ? <Tag cls="border border-danger text-danger">Past send-by</Tag> : null}
            {bid.notificationError ? <Tag cls="border border-danger text-danger">Email issue</Tag> : null}
            {bid.isSample ? <Tag cls="bg-charcoal text-cream">Sample</Tag> : null}
          </div>
          <Link
            href={`/tracker/bids/${bid.id}`}
            className="mt-2 block text-lg font-bold text-burgundy underline-offset-4 hover:underline"
          >
            {bid.projectName}
          </Link>
          <p className="text-sm text-charcoal-600">
            {bid.company}
            {bid.projectLocation ? ` · ${bid.projectLocation}` : ""} · {SOURCE_LABEL[bid.source]}
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-3 gap-x-5 gap-y-1 text-sm md:text-right">
          <div>
            <dt className="text-charcoal-600">Due</dt>
            <dd className="font-semibold" data-testid="due">
              {bid.dueDate ? (
                <>
                  {formatDate(bid.dueDate)}
                  <span className="block text-xs font-normal text-charcoal-600">{relativeDays(bid.dueDate, today)}</span>
                </>
              ) : bid.dueDateTbd ? (
                "Not set yet"
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-charcoal-600">{bid.sentDate ? "Sent" : "Send by"}</dt>
            <dd className="font-semibold">{formatDate(bid.sentDate ?? bid.sendByDate)}</dd>
          </div>
          <div>
            <dt className="text-charcoal-600">Owner</dt>
            <dd className="font-semibold">{owner ? owner.displayName : <span className="text-danger">Unassigned</span>}</dd>
          </div>
        </dl>
      </div>

      {showAssign ? (
        <form action={assignOwnerAction} className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <input type="hidden" name="id" value={bid.id} />
          <label htmlFor={`assign-${bid.id}`} className="text-sm font-semibold">
            Assign to
          </label>
          <select id={`assign-${bid.id}`} name="ownerId" className="field !w-auto !py-1.5" defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-burgundy px-3 py-1.5 text-sm font-bold text-cream">
            Assign
          </button>
        </form>
      ) : null}
    </li>
  );
}

export function Panel({
  title,
  count,
  children,
  id,
  empty,
}: {
  title: string;
  count?: number;
  children: ReactNode;
  id: string;
  empty?: string;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="font-display flex items-baseline gap-2 text-xl font-extrabold uppercase">
        {title}
        {count !== undefined ? <span className="text-base font-bold text-charcoal-600">({count})</span> : null}
      </h2>
      {count === 0 && empty ? <p className="rounded-md border border-dashed border-line p-4 text-charcoal-600">{empty}</p> : children}
    </section>
  );
}
