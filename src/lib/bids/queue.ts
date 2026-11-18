import { daysBetween } from "../dates";
import { isOpen, type Bid } from "./types";

export type DueState = "overdue" | "due-soon" | "later" | "no-date" | "closed";

export function dueState(bid: Bid, today: string, dueSoonDays: number): DueState {
  if (!isOpen(bid.status)) return "closed";
  if (!bid.dueDate) return "no-date";
  const d = daysBetween(today, bid.dueDate);
  if (d < 0) return "overdue";
  if (d <= dueSoonDays) return "due-soon";
  return "later";
}

export function sendByPassed(bid: Bid, today: string): boolean {
  return isOpen(bid.status) && !!bid.sendByDate && daysBetween(today, bid.sendByDate) < 0;
}

/** Earliest external deadline first; bids without a deadline go last (but stay in the list). */
export function byDeadline(a: Bid, b: Bid): number {
  if (a.dueDate && b.dueDate) {
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  } else if (a.dueDate) return -1;
  else if (b.dueDate) return 1;
  // tie-break: internal send-by date, then oldest request first
  if (a.sendByDate !== b.sendByDate) {
    if (!a.sendByDate) return 1;
    if (!b.sendByDate) return -1;
    return a.sendByDate < b.sendByDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

export type Queue = {
  unassigned: Bid[];
  urgent: Bid[]; // open, overdue or due soon
  openWithDate: Bid[];
  openNoDate: Bid[];
  closed: Bid[];
  counts: { open: number; unassigned: number; overdue: number; dueSoon: number; noDate: number };
};

export function buildQueue(bids: Bid[], today: string, dueSoonDays: number): Queue {
  const open = bids.filter((b) => isOpen(b.status)).sort(byDeadline);
  const state = (b: Bid) => dueState(b, today, dueSoonDays);
  const closed = bids
    .filter((b) => !isOpen(b.status))
    .sort((a, b) => (b.sentDate ?? b.updatedAt).localeCompare(a.sentDate ?? a.updatedAt));

  return {
    unassigned: open.filter((b) => !b.ownerId),
    urgent: open.filter((b) => ["overdue", "due-soon"].includes(state(b))),
    openWithDate: open.filter((b) => b.dueDate),
    openNoDate: open.filter((b) => !b.dueDate),
    closed,
    counts: {
      open: open.length,
      unassigned: open.filter((b) => !b.ownerId).length,
      overdue: open.filter((b) => state(b) === "overdue").length,
      dueSoon: open.filter((b) => state(b) === "due-soon").length,
      noDate: open.filter((b) => !b.dueDate).length,
    },
  };
}
