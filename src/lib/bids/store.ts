import "server-only";
import { dataBackend } from "../site-mode";
import type { Bid, BidSource, OutboxEmail, Staff } from "./types";
import type { BidUpdateInput } from "./schema";

export type NewBid = Omit<
  Bid,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "status"
  | "sentDate"
  | "estimatorNotifiedAt"
  | "receiptSentAt"
  | "notificationError"
  | "isSample"
> & { source: BidSource };

export type NotificationResult = {
  estimatorNotifiedAt?: string | null;
  receiptSentAt?: string | null;
  notificationError?: string | null;
};

/**
 * Public writes (`createPublicRequest`, `logEmail`, `recordNotification`) run with
 * server credentials. Staff reads/writes run as the signed-in user.
 */
export interface BidStore {
  createPublicRequest(input: NewBid): Promise<Bid>;
  recordNotification(id: string, result: NotificationResult): Promise<void>;
  logEmail(email: Omit<OutboxEmail, "id" | "createdAt">): Promise<void>;

  listBids(): Promise<Bid[]>;
  getBid(id: string): Promise<Bid | null>;
  createManual(input: NewBid): Promise<Bid>;
  updateBid(id: string, input: BidUpdateInput): Promise<Bid>;
  listStaff(): Promise<Staff[]>;
  listOutbox(): Promise<OutboxEmail[]>;
}

export async function getStore(): Promise<BidStore> {
  if (dataBackend() === "supabase") {
    const { SupabaseBidStore } = await import("./store-supabase");
    return new SupabaseBidStore();
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Supabase is not configured. The local preview store only works on your own machine — set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in Vercel.",
    );
  }
  const { LocalBidStore } = await import("./store-local");
  return new LocalBidStore();
}
