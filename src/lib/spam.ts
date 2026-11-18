import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteMode } from "./site-mode";

/**
 * Spam protection for the public bid form, in layers:
 *  1. Honeypot field (hidden from people, bots fill it in).
 *  2. Signed form token: must be fetched by the page, at least MIN_FILL_MS old, at most 24h.
 *  3. Per-IP rate limit (best effort — per server instance).
 *  4. Cloudflare Turnstile, if TURNSTILE_SECRET_KEY is configured.
 */

const MIN_FILL_MS = 3_000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.FORM_SIGNING_SECRET;
  if (s && s.length >= 16) return s;
  if (siteMode() === "preview") return "preview-only-form-secret-not-for-live";
  throw new Error("FORM_SIGNING_SECRET must be set (16+ characters) in live mode");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function issueFormToken(now = Date.now()): string {
  const payload = String(now);
  return `${payload}.${sign(payload)}`;
}

export function checkFormToken(token: unknown, now = Date.now()): "ok" | "invalid" | "too-fast" | "expired" {
  if (typeof token !== "string") return "invalid";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return "invalid";
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  const age = now - Number(payload);
  if (!Number.isFinite(age) || age < 0) return "invalid";
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}

const hits = new Map<string, number[]>();
export function rateLimited(ip: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
}

export const turnstileEnabled = () =>
  Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
        remoteip: ip,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
