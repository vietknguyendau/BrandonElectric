import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { SAMPLE_STAFF, sampleBids } from "./sample-data";
import type { BidStore, NewBid, NotificationResult } from "./store";
import type { BidUpdateInput } from "./schema";
import type { Bid, OutboxEmail, Staff } from "./types";

/**
 * Local preview store: a JSON file in .preview-data/ (git-ignored).
 * For running the private preview on your own machine only.
 */
type Data = { bids: Bid[]; outbox: OutboxEmail[]; staff: Staff[] };

const DIR = path.join(process.cwd(), ".preview-data");
const FILE = path.join(DIR, "store.json");

let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

async function load(): Promise<Data> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Data;
  } catch {
    const fresh: Data = { bids: sampleBids(), outbox: [], staff: SAMPLE_STAFF };
    await save(fresh);
    return fresh;
  }
}

async function save(data: Data) {
  await mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, FILE);
}

function mutate<T>(fn: (d: Data) => T): Promise<T> {
  return serialize(async () => {
    const d = await load();
    const out = fn(d);
    await save(d);
    return out;
  });
}

export async function resetLocalPreviewData() {
  await serialize(() => save({ bids: sampleBids(), outbox: [], staff: SAMPLE_STAFF }));
}

const now = () => new Date().toISOString();

function insert(d: Data, input: NewBid): Bid {
  const bid: Bid = {
    ...input,
    id: randomUUID(),
    createdAt: now(),
    updatedAt: now(),
    status: "new",
    sentDate: null,
    isSample: false,
    estimatorNotifiedAt: null,
    receiptSentAt: null,
    notificationError: null,
  };
  d.bids.push(bid);
  return bid;
}

export class LocalBidStore implements BidStore {
  createPublicRequest(input: NewBid) {
    return mutate((d) => insert(d, { ...input, source: "website", ownerId: null }));
  }
  createManual(input: NewBid) {
    return mutate((d) => insert(d, input));
  }
  recordNotification(id: string, r: NotificationResult) {
    return mutate((d) => {
      const b = d.bids.find((x) => x.id === id);
      if (b) Object.assign(b, r, { updatedAt: now() });
    });
  }
  logEmail(e: Omit<OutboxEmail, "id" | "createdAt">) {
    return mutate((d) => {
      d.outbox.unshift({ ...e, id: randomUUID(), createdAt: now() });
    });
  }
  async listBids() {
    return (await serialize(load)).bids;
  }
  async getBid(id: string) {
    return (await serialize(load)).bids.find((b) => b.id === id) ?? null;
  }
  updateBid(id: string, u: BidUpdateInput) {
    return mutate((d) => {
      const b = d.bids.find((x) => x.id === id);
      if (!b) throw new Error("Bid not found");
      if (u.ownerId && !d.staff.some((s) => s.id === u.ownerId && s.active)) {
        throw new Error("Unknown owner");
      }
      Object.assign(b, {
        ownerId: u.ownerId,
        status: u.status,
        dueDate: u.dueDate,
        dueDateTbd: u.dueDate ? false : u.dueDateTbd,
        sendByDate: u.sendByDate,
        sentDate: u.sentDate,
        notes: u.notes,
        updatedAt: now(),
      });
      return { ...b };
    });
  }
  async listStaff() {
    return (await serialize(load)).staff.filter((s) => s.active);
  }
  async listOutbox() {
    return (await serialize(load)).outbox;
  }
}
