import "server-only";
import { emailDeliveryEnabled } from "../site-mode";
import type { BidStore } from "../bids/store";
import type { OutboxEmail } from "../bids/types";
import type { EmailMessage } from "./templates";

export type SendResult =
  | { status: "sent"; providerId: string }
  | { status: "disabled" }
  | { status: "failed"; error: string };

/**
 * Sends through Resend (https://resend.com) when delivery is enabled.
 * Every message is written to the email log either way, so preview "emails"
 * can be reviewed in the tracker's Outbox.
 */
export async function sendEmail(
  store: BidStore,
  kind: OutboxEmail["kind"],
  bidId: string | null,
  msg: EmailMessage,
): Promise<SendResult> {
  let result: SendResult;

  if (!emailDeliveryEnabled()) {
    result = { status: "disabled" };
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [msg.to],
          subject: msg.subject,
          text: msg.text,
          ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      result =
        res.ok && body.id
          ? { status: "sent", providerId: body.id }
          : { status: "failed", error: body.message ?? `HTTP ${res.status}` };
    } catch (e) {
      result = { status: "failed", error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  try {
    await store.logEmail({
      bidId,
      kind,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      status: result.status,
      providerId: result.status === "sent" ? result.providerId : null,
      error: result.status === "failed" ? result.error : null,
    });
  } catch (e) {
    console.error("[email] could not write email log", e);
  }
  return result;
}
