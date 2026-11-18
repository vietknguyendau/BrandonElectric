export const BID_STATUSES = [
  "new",
  "reviewing",
  "estimating",
  "sent",
  "won",
  "lost",
  "passed",
] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

export const STATUS_LABEL: Record<BidStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  estimating: "Estimating",
  sent: "Sent",
  won: "Won",
  lost: "Lost",
  passed: "Passed",
};

/** Still needs work before the due date. */
export const OPEN_STATUSES: readonly BidStatus[] = ["new", "reviewing", "estimating"];
export const isOpen = (s: BidStatus) => OPEN_STATUSES.includes(s);

export const BID_SOURCES = ["website", "email", "phone", "other"] as const;
export type BidSource = (typeof BID_SOURCES)[number];
export const SOURCE_LABEL: Record<BidSource, string> = {
  website: "Website form",
  email: "Email invite",
  phone: "Phone",
  other: "Other",
};

export type Bid = {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  source: BidSource;
  status: BidStatus;
  ownerId: string | null;

  contactName: string;
  company: string;
  email: string | null;
  phone: string | null;

  projectName: string;
  projectLocation: string;
  scope: string;
  plansUrl: string | null;

  /** External bid due date (YYYY-MM-DD). */
  dueDate: string | null;
  /** Requester said no due date has been set yet. */
  dueDateTbd: boolean;
  /** Internal target to send by (YYYY-MM-DD). */
  sendByDate: string | null;
  sentDate: string | null;

  notes: string | null;
  isSample: boolean;

  estimatorNotifiedAt: string | null;
  receiptSentAt: string | null;
  notificationError: string | null;
};

export type Staff = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "estimator";
  active: boolean;
};

export type OutboxEmail = {
  id: string;
  createdAt: string;
  bidId: string | null;
  kind: "estimator_notification" | "requester_receipt";
  to: string;
  subject: string;
  text: string;
  /** "disabled" = preview, never sent. */
  status: "disabled" | "sent" | "failed";
  providerId: string | null;
  error: string | null;
};
