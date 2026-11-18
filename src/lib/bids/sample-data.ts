import { addDays, todayISO } from "../dates";
import type { Bid, Staff } from "./types";

/** Sample staff for the local preview. Not real people. */
export const SAMPLE_STAFF: Staff[] = [
  { id: "staff-brandon", email: "brandon@preview.local", displayName: "Brandon (sample)", role: "admin", active: true },
  { id: "staff-estimator", email: "estimator@preview.local", displayName: "Estimator (sample)", role: "estimator", active: true },
];

/** Sample bids with dates relative to today so the queue states are easy to see. */
export function sampleBids(now = new Date()): Bid[] {
  const today = todayISO(undefined, now);
  const ts = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString();
  const base = {
    email: null,
    phone: null,
    plansUrl: null,
    sendByDate: null,
    sentDate: null,
    notes: null,
    isSample: true,
    estimatorNotifiedAt: null,
    receiptSentAt: null,
    notificationError: null,
    dueDateTbd: false,
  } satisfies Partial<Bid>;

  const bid = (b: Partial<Bid> & Pick<Bid, "id" | "projectName">): Bid => ({
    ...base,
    createdAt: ts(3),
    updatedAt: ts(1),
    source: "email",
    status: "new",
    ownerId: null,
    contactName: "Sample Contact",
    company: "Sample GC Co.",
    projectLocation: "Sample City",
    scope: "Sample scope for preview only.",
    dueDate: null,
    ...b,
  });

  return [
    bid({
      id: "sample-overdue",
      projectName: "SAMPLE — Dental office TI",
      status: "estimating",
      ownerId: "staff-estimator",
      dueDate: addDays(today, -1),
      sendByDate: addDays(today, -2),
      scope: "SAMPLE: 2,400 sq ft suite. Lighting, receptacles, equipment circuits.",
    }),
    bid({
      id: "sample-soon",
      projectName: "SAMPLE — Warehouse LED retrofit",
      status: "reviewing",
      ownerId: "staff-brandon",
      dueDate: addDays(today, 3),
      sendByDate: addDays(today, 2),
      company: "Sample Property Group",
      source: "phone",
    }),
    bid({
      id: "sample-later",
      projectName: "SAMPLE — Retail build-out, Unit 4",
      status: "new",
      dueDate: addDays(today, 16),
      company: "Sample Builders",
    }),
    bid({
      id: "sample-nodate",
      projectName: "SAMPLE — Restaurant panel upgrade",
      status: "new",
      dueDateTbd: true,
      company: "Sample Restaurant LLC",
      source: "website",
    }),
    bid({
      id: "sample-sent",
      projectName: "SAMPLE — Office parking lot lighting",
      status: "sent",
      ownerId: "staff-brandon",
      dueDate: addDays(today, -5),
      sentDate: addDays(today, -6),
      createdAt: ts(14),
    }),
    bid({
      id: "sample-won",
      projectName: "SAMPLE — Clinic service upgrade",
      status: "won",
      ownerId: "staff-estimator",
      dueDate: addDays(today, -20),
      sentDate: addDays(today, -21),
      createdAt: ts(30),
    }),
  ];
}
