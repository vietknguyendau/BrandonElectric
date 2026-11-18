import "server-only";
import { supabaseAsUser, supabaseService } from "../supabase/server";
import type { BidStore, NewBid, NotificationResult } from "./store";
import type { BidUpdateInput } from "./schema";
import type { Bid, OutboxEmail, Staff } from "./types";

type Row = {
  id: string;
  created_at: string;
  updated_at: string;
  source: Bid["source"];
  status: Bid["status"];
  owner_id: string | null;
  contact_name: string;
  company: string;
  email: string | null;
  phone: string | null;
  project_name: string;
  project_location: string;
  scope: string;
  plans_url: string | null;
  due_date: string | null;
  due_date_tbd: boolean;
  send_by_date: string | null;
  sent_date: string | null;
  notes: string | null;
  is_sample: boolean;
  estimator_notified_at: string | null;
  receipt_sent_at: string | null;
  notification_error: string | null;
};

const fromRow = (r: Row): Bid => ({
  id: r.id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  source: r.source,
  status: r.status,
  ownerId: r.owner_id,
  contactName: r.contact_name,
  company: r.company,
  email: r.email,
  phone: r.phone,
  projectName: r.project_name,
  projectLocation: r.project_location,
  scope: r.scope,
  plansUrl: r.plans_url,
  dueDate: r.due_date,
  dueDateTbd: r.due_date_tbd,
  sendByDate: r.send_by_date,
  sentDate: r.sent_date,
  notes: r.notes,
  isSample: r.is_sample,
  estimatorNotifiedAt: r.estimator_notified_at,
  receiptSentAt: r.receipt_sent_at,
  notificationError: r.notification_error,
});

const toInsert = (b: NewBid) => ({
  source: b.source,
  owner_id: b.ownerId,
  contact_name: b.contactName,
  company: b.company,
  email: b.email,
  phone: b.phone,
  project_name: b.projectName,
  project_location: b.projectLocation,
  scope: b.scope,
  plans_url: b.plansUrl,
  due_date: b.dueDate,
  due_date_tbd: b.dueDate ? false : b.dueDateTbd,
  send_by_date: b.sendByDate,
  notes: b.notes,
});

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export class SupabaseBidStore implements BidStore {
  async createPublicRequest(input: NewBid) {
    const db = supabaseService();
    const row = check(
      await db
        .from("bids")
        .insert({ ...toInsert({ ...input, ownerId: null }), source: "website" })
        .select()
        .single<Row>(),
    );
    return fromRow(row);
  }

  async recordNotification(id: string, r: NotificationResult) {
    const db = supabaseService();
    const patch: Record<string, unknown> = {};
    if (r.estimatorNotifiedAt !== undefined) patch.estimator_notified_at = r.estimatorNotifiedAt;
    if (r.receiptSentAt !== undefined) patch.receipt_sent_at = r.receiptSentAt;
    if (r.notificationError !== undefined) patch.notification_error = r.notificationError;
    check(await db.from("bids").update(patch).eq("id", id));
  }

  async logEmail(e: Omit<OutboxEmail, "id" | "createdAt">) {
    const db = supabaseService();
    check(
      await db.from("email_log").insert({
        bid_id: e.bidId,
        kind: e.kind,
        to_address: e.to,
        subject: e.subject,
        body_text: e.text,
        status: e.status,
        provider_id: e.providerId,
        error: e.error,
      }),
    );
  }

  async listBids() {
    const db = await supabaseAsUser();
    const rows = check(await db.from("bids").select("*").order("created_at").returns<Row[]>());
    return rows.map(fromRow);
  }

  async getBid(id: string) {
    const db = await supabaseAsUser();
    const row = check(await db.from("bids").select("*").eq("id", id).maybeSingle<Row>());
    return row ? fromRow(row) : null;
  }

  async createManual(input: NewBid) {
    const db = await supabaseAsUser();
    return fromRow(check(await db.from("bids").insert(toInsert(input)).select().single<Row>()));
  }

  async updateBid(id: string, u: BidUpdateInput) {
    const db = await supabaseAsUser();
    const row = check(
      await db
        .from("bids")
        .update({
          owner_id: u.ownerId,
          status: u.status,
          due_date: u.dueDate,
          due_date_tbd: u.dueDate ? false : u.dueDateTbd,
          send_by_date: u.sendByDate,
          sent_date: u.sentDate,
          notes: u.notes,
        })
        .eq("id", id)
        .select()
        .single<Row>(),
    );
    return fromRow(row);
  }

  async listStaff() {
    const db = await supabaseAsUser();
    const rows = check(
      await db
        .from("staff")
        .select("user_id,email,display_name,role,active")
        .eq("active", true)
        .order("display_name")
        .returns<{ user_id: string; email: string; display_name: string; role: Staff["role"]; active: boolean }[]>(),
    );
    return rows.map((r) => ({
      id: r.user_id,
      email: r.email,
      displayName: r.display_name,
      role: r.role,
      active: r.active,
    }));
  }

  async listOutbox() {
    const db = await supabaseAsUser();
    const rows = check(
      await db
        .from("email_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<
          {
            id: string;
            created_at: string;
            bid_id: string | null;
            kind: OutboxEmail["kind"];
            to_address: string;
            subject: string;
            body_text: string;
            status: OutboxEmail["status"];
            provider_id: string | null;
            error: string | null;
          }[]
        >(),
    );
    return rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      bidId: r.bid_id,
      kind: r.kind,
      to: r.to_address,
      subject: r.subject,
      text: r.body_text,
      status: r.status,
      providerId: r.provider_id,
      error: r.error,
    }));
  }
}
