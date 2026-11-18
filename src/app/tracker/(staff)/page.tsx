import { BidRow, Panel } from "@/components/tracker/ui";
import { business } from "@/config/business";
import { requireStaff } from "@/lib/auth";
import { buildQueue } from "@/lib/bids/queue";
import { getStore } from "@/lib/bids/store";
import { todayISO } from "@/lib/dates";
import { dataBackend, isPreview } from "@/lib/site-mode";
import { resetSampleDataAction } from "../actions";

export default async function QueuePage() {
  await requireStaff();
  const store = await getStore();
  const [bids, staff] = await Promise.all([store.listBids(), store.listStaff()]);
  const today = todayISO();
  const q = buildQueue(bids, today, business.dueSoonDays);
  const rowProps = { today, dueSoonDays: business.dueSoonDays, staff };

  const stats = [
    { label: "Open", value: q.counts.open },
    { label: "Unassigned", value: q.counts.unassigned, alert: q.counts.unassigned > 0 },
    { label: "Overdue", value: q.counts.overdue, alert: q.counts.overdue > 0 },
    { label: `Due in ${business.dueSoonDays} days`, value: q.counts.dueSoon },
    { label: "No due date", value: q.counts.noDate },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase">Bid queue</h1>
          <p className="text-charcoal-600">Open bids ordered by bid due date. Today is {today}.</p>
        </div>
        {isPreview() && dataBackend() === "local" ? (
          <form action={resetSampleDataAction}>
            <button type="submit" className="rounded-md border border-charcoal-600 px-3 py-1.5 text-sm font-semibold">
              Reset sample data
            </button>
          </form>
        ) : null}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Summary">
        {stats.map((s) => (
          <li
            key={s.label}
            className={`rounded-md border p-3 ${s.alert ? "border-danger bg-[#fdf0f0]" : "border-line bg-paper"}`}
          >
            <p className={`font-display text-3xl font-extrabold ${s.alert ? "text-danger" : ""}`}>{s.value}</p>
            <p className="text-sm font-semibold text-charcoal-600">{s.label}</p>
          </li>
        ))}
      </ul>

      <Panel id="unassigned" title="Needs an owner" count={q.unassigned.length} empty="Every open bid has an owner.">
        <ul className="space-y-3" data-testid="unassigned-list">
          {q.unassigned.map((b) => (
            <BidRow key={b.id} bid={b} {...rowProps} showAssign />
          ))}
        </ul>
      </Panel>

      <Panel
        id="urgent"
        title={`Overdue or due within ${business.dueSoonDays} days`}
        count={q.urgent.length}
        empty="Nothing due this week."
      >
        <ul className="space-y-3" data-testid="urgent-list">
          {q.urgent.map((b) => (
            <BidRow key={b.id} bid={b} {...rowProps} />
          ))}
        </ul>
      </Panel>

      <Panel id="open" title="All open bids by deadline" count={q.counts.open} empty="No open bids.">
        <ul className="space-y-3" data-testid="open-list">
          {q.openWithDate.map((b) => (
            <BidRow key={b.id} bid={b} {...rowProps} />
          ))}
        </ul>
        {q.openNoDate.length ? (
          <>
            <h3 className="pt-3 font-bold text-charcoal-600">No due date yet ({q.openNoDate.length})</h3>
            <ul className="space-y-3" data-testid="nodate-list">
              {q.openNoDate.map((b) => (
                <BidRow key={b.id} bid={b} {...rowProps} />
              ))}
            </ul>
          </>
        ) : null}
      </Panel>

      <Panel id="closed" title="Sent & closed" count={q.closed.length} empty="Nothing sent yet.">
        <ul className="space-y-3" data-testid="closed-list">
          {q.closed.slice(0, 25).map((b) => (
            <BidRow key={b.id} bid={b} {...rowProps} />
          ))}
        </ul>
      </Panel>
    </div>
  );
}
