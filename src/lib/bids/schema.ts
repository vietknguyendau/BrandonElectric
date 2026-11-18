import { z } from "zod";
import { isValidISODate } from "../dates";
import { BID_SOURCES, BID_STATUSES } from "./types";

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const required = (label: string, max: number) =>
  text(max).min(1, `${label} is required.`);

const optionalText = (max: number) =>
  text(max)
    .optional()
    .transform((v) => (v ? v : null));

const isoDate = z
  .string()
  .trim()
  .refine((v) => v === "" || isValidISODate(v), "Use a valid date.")
  .optional()
  .transform((v) => (v ? v : null));

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Paste a full link starting with https://")
  .optional()
  .transform((v) => (v ? v : null));

const phone = z
  .string()
  .trim()
  .max(40)
  .refine((v) => !v || v.replace(/\D/g, "").length >= 7, "Enter a phone number we can call.")
  .optional()
  .transform((v) => (v ? v : null));

const checkbox = z
  .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === true || v === "on" || v === "true");

/** Public "Request a Bid" form. */
export const bidRequestSchema = z
  .object({
    contactName: required("Your name", 120),
    company: required("Company", 160),
    email: z.string().trim().max(254).pipe(z.email("Enter a valid email address.")),
    phone,
    projectName: required("Project name", 200),
    projectLocation: required("Project location", 200),
    scope: required("Scope", 2000).min(10, "Add a sentence or two about the scope."),
    dueDate: isoDate,
    dueDateTbd: checkbox,
    plansUrl: httpUrl,
  })
  .superRefine((v, ctx) => {
    if (!v.dueDate && !v.dueDateTbd) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Enter the bid due date, or check “No due date yet.”",
      });
    }
  })
  .transform((v) => ({ ...v, dueDateTbd: v.dueDate ? false : v.dueDateTbd }));

export type BidRequestInput = z.infer<typeof bidRequestSchema>;

/** Staff: manual entry for invites that came in by email or phone. */
export const manualBidSchema = z.object({
  source: z.enum(BID_SOURCES),
  company: required("Company", 160),
  contactName: text(120).default(""),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email address.")
    .optional()
    .transform((v) => (v ? v : null)),
  phone,
  projectName: required("Project name", 200),
  projectLocation: text(200).default(""),
  scope: text(4000).default(""),
  plansUrl: httpUrl,
  dueDate: isoDate,
  dueDateTbd: checkbox,
  sendByDate: isoDate,
  ownerId: optionalText(64),
  notes: optionalText(4000),
});
export type ManualBidInput = z.infer<typeof manualBidSchema>;

/** Staff: update owner / status / dates / notes. */
export const bidUpdateSchema = z
  .object({
    ownerId: optionalText(64),
    status: z.enum(BID_STATUSES),
    dueDate: isoDate,
    dueDateTbd: checkbox,
    sendByDate: isoDate,
    sentDate: isoDate,
    notes: optionalText(4000),
  })
  .superRefine((v, ctx) => {
    if (v.status === "sent" && !v.sentDate) {
      ctx.addIssue({ code: "custom", path: ["sentDate"], message: "Add the date the bid was sent." });
    }
  });
export type BidUpdateInput = z.infer<typeof bidUpdateSchema>;

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
