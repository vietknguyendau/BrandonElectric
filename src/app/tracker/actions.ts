"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, signIn, signOut } from "@/lib/auth";
import { bidUpdateSchema, fieldErrors, manualBidSchema } from "@/lib/bids/schema";
import { getStore } from "@/lib/bids/store";
import { todayISO } from "@/lib/dates";
import { dataBackend, isPreview } from "@/lib/site-mode";

export type FormState = { message?: string; errors?: Record<string, string> } | null;

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v : undefined;
};

export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = (str(fd, "email") ?? "").trim();
  const password = str(fd, "password") ?? "";
  if (!email || !password) return { message: "Enter your email and password." };
  const r = await signIn(email, password);
  if (!r.ok) return { message: r.message };
  redirect("/tracker");
}

export async function signOutAction() {
  await signOut();
  redirect("/tracker/login");
}

export async function createManualBidAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const parsed = manualBidSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const store = await getStore();
  const owners = await store.listStaff();
  if (v.ownerId && !owners.some((o) => o.id === v.ownerId)) return { errors: { ownerId: "Pick someone on the list." } };

  const bid = await store.createManual({
    source: v.source,
    ownerId: v.ownerId,
    contactName: v.contactName,
    company: v.company,
    email: v.email,
    phone: v.phone,
    projectName: v.projectName,
    projectLocation: v.projectLocation,
    scope: v.scope,
    plansUrl: v.plansUrl,
    dueDate: v.dueDate,
    dueDateTbd: v.dueDate ? false : v.dueDateTbd,
    sendByDate: v.sendByDate,
    notes: v.notes,
  });
  revalidatePath("/tracker");
  redirect(`/tracker/bids/${bid.id}?saved=1`);
}

export async function updateBidAction(id: string, _: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const parsed = bidUpdateSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  const store = await getStore();
  const owners = await store.listStaff();
  if (parsed.data.ownerId && !owners.some((o) => o.id === parsed.data.ownerId)) {
    return { errors: { ownerId: "Pick someone on the list." } };
  }
  try {
    await store.updateBid(id, parsed.data);
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Couldn't save." };
  }
  revalidatePath("/tracker");
  revalidatePath(`/tracker/bids/${id}`);
  redirect(`/tracker/bids/${id}?saved=1`);
}

/** Inline "Assign" from the queue. */
export async function assignOwnerAction(fd: FormData) {
  await requireStaff();
  const id = str(fd, "id");
  const ownerId = str(fd, "ownerId") || null;
  if (!id) return;
  const store = await getStore();
  const bid = await store.getBid(id);
  if (!bid) return;
  if (ownerId && !(await store.listStaff()).some((s) => s.id === ownerId)) return;
  await store.updateBid(id, {
    ownerId,
    status: bid.status,
    dueDate: bid.dueDate,
    dueDateTbd: bid.dueDateTbd,
    sendByDate: bid.sendByDate,
    sentDate: bid.sentDate,
    notes: bid.notes,
  });
  revalidatePath("/tracker");
}

/** "Mark as Sent" with the sent date. */
export async function markSentAction(id: string, _: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const sentDate = (str(fd, "sentDate") || todayISO()).trim();
  const store = await getStore();
  const bid = await store.getBid(id);
  if (!bid) return { message: "Bid not found." };
  const parsed = bidUpdateSchema.safeParse({
    ownerId: bid.ownerId ?? "",
    status: "sent",
    dueDate: bid.dueDate ?? "",
    dueDateTbd: bid.dueDateTbd,
    sendByDate: bid.sendByDate ?? "",
    sentDate,
    notes: bid.notes ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await store.updateBid(id, parsed.data);
  revalidatePath("/tracker");
  redirect(`/tracker/bids/${id}?sent=1`);
}

export async function resetSampleDataAction() {
  await requireStaff();
  if (!isPreview() || dataBackend() !== "local") return;
  const { resetLocalPreviewData } = await import("@/lib/bids/store-local");
  await resetLocalPreviewData();
  revalidatePath("/tracker");
  redirect("/tracker");
}
