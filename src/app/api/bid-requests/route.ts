import { NextResponse, type NextRequest } from "next/server";
import { bidRequestSchema, fieldErrors } from "@/lib/bids/schema";
import { getStore } from "@/lib/bids/store";
import { estimatorNotification, requesterReceipt } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { checkFormToken, issueFormToken, rateLimited, verifyTurnstile } from "@/lib/spam";
import { siteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

/** Issues a fresh signed form token when the form mounts. */
export function GET() {
  return NextResponse.json({ token: issueFormToken() }, { headers: { "Cache-Control": "no-store" } });
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const fail = (status: number, message: string, errors?: Record<string, string>) =>
  NextResponse.json({ ok: false, message, errors }, { status });

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "We couldn't read that submission. Please try again.");
  }

  const ip = clientIp(req);

  // 1. Honeypot — pretend it worked, store nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true, receipt: "sent" });
  }

  // 2. Signed token / fill time
  const token = checkFormToken(body.formToken);
  if (token === "too-fast") return fail(400, "That was quick — please review the form and submit again.");
  if (token !== "ok") return fail(400, "This form expired. Refresh the page and try again.");

  // 3. Rate limit
  if (rateLimited(ip)) return fail(429, "Too many requests from this connection. Please call or try again later.");

  // 4. Turnstile (when configured)
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return fail(400, "Please complete the verification and try again.");
  }

  // 5. Validate
  const parsed = bidRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(422, "Please fix the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  // 6. Save BEFORE we tell anyone it worked.
  let store;
  let bid;
  try {
    store = await getStore();
    bid = await store.createPublicRequest({
      source: "website",
      ownerId: null,
      contactName: input.contactName,
      company: input.company,
      email: input.email,
      phone: input.phone,
      projectName: input.projectName,
      projectLocation: input.projectLocation,
      scope: input.scope,
      plansUrl: input.plansUrl,
      dueDate: input.dueDate,
      dueDateTbd: input.dueDateTbd,
      sendByDate: null,
      notes: null,
    });
  } catch (e) {
    console.error("[bid-request] save failed", e);
    return fail(500, "We couldn't save your request. Please try again in a minute, or call us.");
  }

  // 7. Notify estimator + send receipt. The request is already saved, so
  //    an email failure is recorded on the bid rather than shown as a failure.
  const estimatorTo = process.env.BID_NOTIFY_EMAIL || "estimator@preview.local";
  const base = process.env.APP_BASE_URL?.replace(/\/$/, "");
  const trackerUrl = base ? `${base}/tracker/bids/${bid.id}` : null;

  const [est, receipt] = await Promise.all([
    sendEmail(store, "estimator_notification", bid.id, estimatorNotification(bid, estimatorTo, trackerUrl)),
    sendEmail(store, "requester_receipt", bid.id, requesterReceipt(bid)),
  ]);

  const now = new Date().toISOString();
  const errors = [
    est.status === "failed" ? `Estimator email failed: ${est.error}` : null,
    receipt.status === "failed" ? `Receipt failed: ${receipt.error}` : null,
  ].filter(Boolean);
  try {
    await store.recordNotification(bid.id, {
      estimatorNotifiedAt: est.status === "sent" ? now : null,
      receiptSentAt: receipt.status === "sent" ? now : null,
      notificationError: errors.length ? errors.join(" | ") : null,
    });
  } catch (e) {
    console.error("[bid-request] could not record notification status", e);
  }

  return NextResponse.json({
    ok: true,
    receipt: receipt.status, // "sent" | "disabled" | "failed"
    preview: siteMode() === "preview",
  });
}
