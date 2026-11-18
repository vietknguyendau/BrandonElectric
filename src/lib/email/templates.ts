import { business } from "@/config/business";
import { formatDate } from "../dates";
import type { Bid } from "../bids/types";

export type EmailMessage = { to: string; subject: string; text: string; replyTo?: string };

function dueLine(b: Bid) {
  if (b.dueDate) return formatDate(b.dueDate);
  return b.dueDateTbd ? "Not set yet (per requester)" : "Not provided";
}

export function estimatorNotification(b: Bid, to: string, trackerUrl: string | null): EmailMessage {
  const lines = [
    `New bid request from the website.`,
    ``,
    `Bid due: ${dueLine(b)}`,
    `Project: ${b.projectName}`,
    `Location: ${b.projectLocation}`,
    `Plans/specs: ${b.plansUrl ?? "No link provided"}`,
    ``,
    `Scope:`,
    b.scope,
    ``,
    `Contact: ${b.contactName}, ${b.company}`,
    `Email: ${b.email ?? "—"}`,
    `Phone: ${b.phone ?? "—"}`,
    ``,
    trackerUrl ? `Open in tracker: ${trackerUrl}` : `Open the bid tracker to assign an owner.`,
  ];
  return {
    to,
    subject: `Bid request: ${b.projectName} — due ${b.dueDate ? formatDate(b.dueDate) : "TBD"}`,
    text: lines.join("\n"),
    replyTo: b.email ?? undefined,
  };
}

/** Receipt for the requester. No turnaround promise unless Brandon approved one. */
export function requesterReceipt(b: Bid): EmailMessage {
  const turnaround =
    business.receiptTurnaroundLine.approved && business.receiptTurnaroundLine.value.trim()
      ? [business.receiptTurnaroundLine.value.trim(), ``]
      : [];
  const lines = [
    `Hi ${b.contactName},`,
    ``,
    `This confirms ${business.name} received your bid request.`,
    ``,
    `Project: ${b.projectName}`,
    `Location: ${b.projectLocation}`,
    `Bid due: ${dueLine(b)}`,
    `Plans/specs: ${b.plansUrl ?? "No link provided"}`,
    ``,
    ...turnaround,
    `If anything changes — addenda, a new due date, updated plans — just reply to this email.`,
    ``,
    business.name,
  ];
  return {
    to: b.email!,
    subject: `${business.name} received your bid request: ${b.projectName}`,
    text: lines.join("\n"),
  };
}
