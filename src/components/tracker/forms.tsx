"use client";

import { keepValuesOnSubmit } from "./useKeepValuesSubmit";
import { useActionState, useState, type ReactNode } from "react";
import { createManualBidAction, markSentAction, updateBidAction, type FormState } from "@/app/tracker/actions";
import { BID_SOURCES, BID_STATUSES, SOURCE_LABEL, STATUS_LABEL, type Bid, type Staff } from "@/lib/bids/types";

function F({
  name,
  label,
  error,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block font-semibold">
        {label}
      </label>
      {hint ? <p className="text-sm text-charcoal-600">{hint}</p> : null}
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inv = (state: FormState, name: string) =>
  state?.errors?.[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};

function Banner({ state }: { state: FormState }) {
  return (
    <div aria-live="assertive">
      {state?.message ? (
        <p className="rounded-md border-2 border-danger bg-[#fdf0f0] px-3 py-2 font-semibold text-danger">{state.message}</p>
      ) : null}
    </div>
  );
}

function DueDateFields({
  state,
  defaultDue,
  defaultTbd,
}: {
  state: FormState;
  defaultDue?: string | null;
  defaultTbd?: boolean;
}) {
  const [tbd, setTbd] = useState(Boolean(defaultTbd) && !defaultDue);
  return (
    <div>
      <F name="dueDate" label="Bid due date (external)" error={state?.errors?.dueDate}>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={defaultDue ?? ""}
          disabled={tbd}
          className="field disabled:opacity-50"
          {...inv(state, "dueDate")}
        />
      </F>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="dueDateTbd"
          checked={tbd}
          onChange={(e) => setTbd(e.target.checked)}
          className="h-5 w-5 accent-burgundy"
        />
        No due date set yet
      </label>
    </div>
  );
}

export function ManualBidForm({ staff }: { staff: Staff[] }) {
  const [state, action, pending] = useActionState(createManualBidAction, null);
  const e = state?.errors ?? {};
  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="space-y-6" noValidate>
      <Banner state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <F name="source" label="Came in by">
          <select id="source" name="source" className="field" defaultValue="email">
            {BID_SOURCES.filter((s) => s !== "website").map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
        </F>
        <F name="ownerId" label="Owner" error={e.ownerId}>
          <select id="ownerId" name="ownerId" className="field" defaultValue="">
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </F>
        <F name="projectName" label="Project name" error={e.projectName}>
          <input id="projectName" name="projectName" className="field" required {...inv(state, "projectName")} />
        </F>
        <F name="projectLocation" label="Project location" error={e.projectLocation}>
          <input id="projectLocation" name="projectLocation" className="field" />
        </F>
        <F name="company" label="Company (GC / owner)" error={e.company}>
          <input id="company" name="company" className="field" required {...inv(state, "company")} />
        </F>
        <F name="contactName" label="Contact name" error={e.contactName}>
          <input id="contactName" name="contactName" className="field" />
        </F>
        <F name="email" label="Contact email" error={e.email}>
          <input id="email" name="email" type="email" className="field" {...inv(state, "email")} />
        </F>
        <F name="phone" label="Contact phone" error={e.phone}>
          <input id="phone" name="phone" type="tel" className="field" {...inv(state, "phone")} />
        </F>
        <DueDateFields state={state} />
        <F name="sendByDate" label="Internal send-by date" hint="Optional. Your own target." error={e.sendByDate}>
          <input id="sendByDate" name="sendByDate" type="date" className="field" {...inv(state, "sendByDate")} />
        </F>
      </div>
      <F name="plansUrl" label="Link to plans / specs" error={e.plansUrl}>
        <input id="plansUrl" name="plansUrl" type="url" placeholder="https://" className="field" {...inv(state, "plansUrl")} />
      </F>
      <F name="scope" label="Scope" error={e.scope}>
        <textarea id="scope" name="scope" rows={4} className="field" />
      </F>
      <F name="notes" label="Internal notes" error={e.notes}>
        <textarea id="notes" name="notes" rows={3} className="field" />
      </F>
      <button disabled={pending} className="rounded-md bg-burgundy px-6 py-3 font-bold text-cream disabled:opacity-70">
        {pending ? "Saving…" : "Add to queue"}
      </button>
    </form>
  );
}

export function EditBidForm({ bid, staff }: { bid: Bid; staff: Staff[] }) {
  const [state, action, pending] = useActionState(updateBidAction.bind(null, bid.id), null);
  const e = state?.errors ?? {};
  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="space-y-5" noValidate aria-label="Update bid">
      <Banner state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <F name="ownerId" label="Owner" error={e.ownerId}>
          <select id="ownerId" name="ownerId" className="field" defaultValue={bid.ownerId ?? ""}>
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </F>
        <F name="status" label="Status" error={e.status}>
          <select id="status" name="status" className="field" defaultValue={bid.status}>
            {BID_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </F>
        <DueDateFields state={state} defaultDue={bid.dueDate} defaultTbd={bid.dueDateTbd} />
        <F name="sendByDate" label="Internal send-by date" error={e.sendByDate}>
          <input id="sendByDate" name="sendByDate" type="date" defaultValue={bid.sendByDate ?? ""} className="field" />
        </F>
        <F name="sentDate" label="Sent date" hint="Required when status is Sent." error={e.sentDate}>
          <input
            id="sentDate"
            name="sentDate"
            type="date"
            defaultValue={bid.sentDate ?? ""}
            className="field"
            {...inv(state, "sentDate")}
          />
        </F>
      </div>
      <F name="notes" label="Internal notes">
        <textarea id="notes" name="notes" rows={3} defaultValue={bid.notes ?? ""} className="field" />
      </F>
      <button disabled={pending} className="rounded-md bg-burgundy px-6 py-3 font-bold text-cream disabled:opacity-70">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export function MarkSentForm({ bidId, today }: { bidId: string; today: string }) {
  const [state, action, pending] = useActionState(markSentAction.bind(null, bidId), null);
  return (
    <form onSubmit={keepValuesOnSubmit(action)} className="flex flex-wrap items-end gap-3" aria-label="Mark as sent">
      <div>
        <label htmlFor="markSentDate" className="block text-sm font-semibold">
          Sent on
        </label>
        <input id="markSentDate" name="sentDate" type="date" defaultValue={today} className="field mt-1 !w-auto" />
      </div>
      <button disabled={pending} className="rounded-md bg-ok px-5 py-3 font-bold text-white disabled:opacity-70">
        {pending ? "Saving…" : "Mark as Sent"}
      </button>
      {state?.errors?.sentDate || state?.message ? (
        <p className="w-full text-sm font-semibold text-danger">{state?.errors?.sentDate ?? state?.message}</p>
      ) : null}
    </form>
  );
}
