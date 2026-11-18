"use client";

import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

type Props = {
  preview: boolean;
  phone: { display: string; tel: string } | null;
  publicEmail: string | null;
  turnstileSiteKey: string | null;
};

type Errors = Record<string, string>;
type Done = { receipt: "sent" | "disabled" | "failed"; email: string };

const FIELD_ORDER = [
  "contactName",
  "company",
  "email",
  "phone",
  "projectName",
  "projectLocation",
  "scope",
  "dueDate",
  "plansUrl",
];

export function BidForm({ preview, phone, publicEmail, turnstileSiteKey }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tbd, setTbd] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  async function loadToken() {
    try {
      const r = await fetch("/api/bid-requests", { cache: "no-store" });
      const j = await r.json();
      setToken(j.token);
    } catch {
      setToken(null);
    }
  }
  useEffect(() => {
    // Fetch a signed form token once the form is on screen (spam protection).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadToken();
  }, []);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    body.dueDateTbd = tbd;
    body.formToken = token;
    body.turnstileToken = fd.get("cf-turnstile-response");

    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/bid-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setErrors({});
        setDone({ receipt: json.receipt, email: String(body.email ?? "") });
        return;
      }
      const errs: Errors = json.errors ?? {};
      setErrors(errs);
      setMessage(json.message ?? "Something went wrong. Please try again.");
      if (res.status === 400) loadToken(); // token may have expired
      requestAnimationFrame(() => {
        const first = FIELD_ORDER.find((f) => errs[f]);
        if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        else summaryRef.current?.focus();
      });
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setSending(false);
    }
  }

  const fallback = phone ? (
    <>
      Or call Brandon at{" "}
      <a className="font-bold underline" href={`tel:${phone.tel}`}>
        {phone.display}
      </a>
      .
    </>
  ) : publicEmail ? (
    <>
      Or email{" "}
      <a className="font-bold underline" href={`mailto:${publicEmail}`}>
        {publicEmail}
      </a>
      .
    </>
  ) : null;

  if (done) {
    return (
      <div className="rounded-md border-2 border-ok bg-paper p-6" role="status">
        <h3 ref={doneRef} tabIndex={-1} className="font-display text-2xl font-extrabold uppercase text-ok">
          Request received
        </h3>
        <p className="mt-2 text-lg">Your bid request is saved and Brandon&apos;s team has it.</p>
        <p className="mt-2 text-charcoal-600">
          {done.receipt === "sent" && <>A confirmation is on its way to {done.email}.</>}
          {done.receipt === "disabled" &&
            (preview ? (
              <>Preview: saved to the sample tracker. No confirmation email was sent.</>
            ) : (
              <>Confirmation emails aren&apos;t turned on yet, so you won&apos;t get one.</>
            ))}
          {done.receipt === "failed" && (
            <>We couldn&apos;t send the confirmation email, so you may not see one. Your request is still saved.</>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setTbd(false);
            loadToken();
          }}
          className="on-light mt-5 rounded-md border-2 border-burgundy px-4 py-2 font-bold text-burgundy"
        >
          Send another request
        </button>
      </div>
    );
  }

  const err = (name: string) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="on-light space-y-5" aria-labelledby="bid-form-title">
      {preview ? (
        <p className="rounded-md border border-dashed border-gold-dark bg-[#fbf1dc] px-4 py-3 text-sm text-[#5a4420]">
          <strong>Preview form.</strong> Submissions go to the sample tracker. Emails are turned off.
        </p>
      ) : null}

      <div ref={summaryRef} tabIndex={-1} aria-live="assertive" className="outline-none">
        {message ? (
          <div className="rounded-md border-2 border-danger bg-[#fdf0f0] px-4 py-3 text-danger">
            <p className="font-bold">{message}</p>
            {fallback ? <p className="mt-1 text-charcoal">{fallback}</p> : null}
          </div>
        ) : null}
      </div>

      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-bold uppercase text-charcoal">Your contact info</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="contactName" label="Your name" error={errors.contactName}>
            <input id="contactName" name="contactName" autoComplete="name" className="field" required {...err("contactName")} />
          </Field>
          <Field name="company" label="Company" error={errors.company}>
            <input id="company" name="company" autoComplete="organization" className="field" required {...err("company")} />
          </Field>
          <Field name="email" label="Email" error={errors.email}>
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" className="field" required {...err("email")} />
          </Field>
          <Field name="phone" label="Phone" optional error={errors.phone}>
            <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className="field" {...err("phone")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-bold uppercase text-charcoal">The project</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="projectName" label="Project name" error={errors.projectName}>
            <input id="projectName" name="projectName" className="field" required {...err("projectName")} />
          </Field>
          <Field name="projectLocation" label="Project location" hint="City or street address" error={errors.projectLocation}>
            <input id="projectLocation" name="projectLocation" autoComplete="off" className="field" required {...err("projectLocation")} />
          </Field>
        </div>
        <Field name="scope" label="Brief scope" hint="A few sentences: type of work, size, anything unusual." error={errors.scope}>
          <textarea id="scope" name="scope" rows={4} maxLength={2000} className="field" required {...err("scope")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field name="dueDate" label="Bid due date" error={errors.dueDate}>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className="field disabled:opacity-50"
                disabled={tbd}
                {...err("dueDate")}
              />
            </Field>
            <label className="mt-2 flex items-center gap-2 text-[0.95rem]">
              <input
                type="checkbox"
                name="dueDateTbd"
                checked={tbd}
                onChange={(e) => {
                  setTbd(e.target.checked);
                  if (e.target.checked) {
                    const d = formRef.current?.querySelector<HTMLInputElement>('[name="dueDate"]');
                    if (d) d.value = "";
                  }
                }}
                className="h-5 w-5 accent-burgundy"
              />
              No due date yet
            </label>
          </div>
          <Field name="plansUrl" label="Link to plans or specs" optional hint="Dropbox, Google Drive, plan room, etc." error={errors.plansUrl}>
            <input
              id="plansUrl"
              name="plansUrl"
              type="url"
              inputMode="url"
              placeholder="https://"
              className="field"
              {...err("plansUrl")}
            />
          </Field>
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {turnstileSiteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
        </>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={sending || !token}
          className="rounded-md bg-burgundy px-7 py-3.5 text-lg font-bold text-cream hover:bg-burgundy-700 disabled:cursor-wait disabled:opacity-70"
        >
          {sending ? "Sending…" : "Request a Bid"}
        </button>
        {fallback ? <p className="text-charcoal-600">{fallback}</p> : null}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  optional,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block font-semibold text-charcoal">
        {label} {optional ? <span className="font-normal text-charcoal-600">(optional)</span> : null}
      </label>
      {hint ? <p className="text-sm text-charcoal-600">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
