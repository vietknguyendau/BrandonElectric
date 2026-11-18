import "server-only";
import { business, type Credential, type Project, type Service } from "@/config/business";
import { siteMode } from "./site-mode";

/** Item plus whether it is shown as an unapproved draft (preview only). */
export type Shown<T> = T & { draft: boolean };

function pick<T extends { approved: boolean }>(items: T[], preview: boolean): Shown<T>[] {
  return items
    .filter((i) => preview || i.approved)
    .map((i) => ({ ...i, draft: !i.approved }));
}

function one<T>(a: { value: T; approved: boolean }, preview: boolean, hasValue: (v: T) => boolean) {
  if (a.approved && hasValue(a.value)) return { value: a.value, draft: false };
  if (preview && hasValue(a.value)) return { value: a.value, draft: true };
  return null;
}

const nonEmpty = (s: string) => s.trim().length > 0;

/**
 * Everything the public page renders, already filtered for the current mode.
 * `null` / empty arrays mean "hide it".
 */
export function getPageContent() {
  const preview = siteMode() === "preview";
  const services: Shown<Service>[] = pick(business.services, preview);
  const projects: Shown<Project>[] = pick(business.projects, preview).filter(
    // Live: a project needs a real photo. Preview: show slots so Brandon sees the layout.
    (p) => preview || nonEmpty(p.image),
  );
  const credentials: Shown<Credential>[] = pick(business.credentials, preview).filter((c) =>
    nonEmpty(c.value),
  );

  const phone = one(business.phone, preview, (v) => nonEmpty(v.tel));
  const publicEmail = one(business.publicEmail, preview, nonEmpty);
  const primaryArea = one(business.primaryArea, preview, nonEmpty);
  const serviceArea = one(
    business.serviceArea,
    preview,
    (v) => nonEmpty(v.summary) || v.places.length > 0,
  );
  const hours = one(business.hours, preview, (v) => v.length > 0);

  return {
    preview,
    name: business.name,
    ownerFirstName: business.ownerFirstName,
    services,
    projects,
    credentials,
    /** Live call links only render when the number is approved. */
    phone: phone && !phone.draft ? phone.value : null,
    publicEmail: publicEmail && !publicEmail.draft ? publicEmail.value : null,
    primaryArea,
    serviceArea,
    hours,
  };
}

export type PageContent = ReturnType<typeof getPageContent>;

/** What still needs Brandon's sign-off. Shown in the preview only. */
export function launchChecklist(): { item: string; done: boolean }[] {
  const b = business;
  return [
    { item: "Preferred business phone number", done: b.phone.approved && nonEmpty(b.phone.value.tel) },
    { item: "Service area (cities or counties)", done: b.serviceArea.approved },
    { item: "Headline city / area", done: b.primaryArea.approved && nonEmpty(b.primaryArea.value) },
    {
      item: "Services he wants to bid (at least one approved)",
      done: b.services.some((s) => s.approved),
    },
    {
      item: "Project photos + permission to publish",
      done: b.projects.some((p) => p.approved && nonEmpty(p.image)),
    },
    { item: "License / insurance details to publish (optional)", done: b.credentials.some((c) => c.approved) },
    { item: "Business hours (optional)", done: b.hours.approved },
    { item: "Final site URL", done: b.siteUrl.approved && nonEmpty(b.siteUrl.value) },
    { item: "Estimator email for bid notifications (BID_NOTIFY_EMAIL)", done: Boolean(process.env.BID_NOTIFY_EMAIL) },
  ];
}
