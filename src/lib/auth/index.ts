import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dataBackend } from "../site-mode";
import { SAMPLE_STAFF } from "../bids/sample-data";
import type { Staff } from "../bids/types";

/**
 * Who is signed in to the tracker?
 *
 * - Supabase backend: Supabase Auth session + an active row in public.staff.
 * - Local preview backend: sample staff accounts, signed cookie, password from
 *   PREVIEW_STAFF_PASSWORD. Never used when Supabase is configured.
 */

const PREVIEW_COOKIE = "be_preview_staff";
const PREVIEW_TTL_MS = 12 * 60 * 60 * 1000;

function previewSecret() {
  return process.env.PREVIEW_SESSION_SECRET || "local-preview-session-secret";
}
const sign = (s: string) => createHmac("sha256", previewSecret()).update(s).digest("base64url");

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

export async function getStaffUser(): Promise<Staff | null> {
  if (dataBackend() === "supabase") {
    const { supabaseAsUser } = await import("../supabase/server");
    const db = await supabaseAsUser();
    const { data: userData } = await db.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data } = await db
      .from("staff")
      .select("user_id,email,display_name,role,active")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.user_id,
      email: data.email,
      displayName: data.display_name,
      role: data.role,
      active: data.active,
    };
  }

  const raw = (await cookies()).get(PREVIEW_COOKIE)?.value;
  if (!raw) return null;
  const [id, exp, sig] = raw.split(".");
  if (!id || !exp || !sig || !safeEqual(sig, sign(`${id}.${exp}`))) return null;
  if (Number(exp) < Date.now()) return null;
  return SAMPLE_STAFF.find((s) => s.id === id && s.active) ?? null;
}

export async function requireStaff(): Promise<Staff> {
  const staff = await getStaffUser();
  if (!staff) redirect("/tracker/login");
  return staff;
}

export type SignInResult = { ok: true } | { ok: false; message: string };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const generic = { ok: false as const, message: "That email and password didn't work." };

  if (dataBackend() === "supabase") {
    const { supabaseAsUser } = await import("../supabase/server");
    const db = await supabaseAsUser();
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) return generic;
    if (!(await getStaffUser())) {
      await db.auth.signOut();
      return { ok: false, message: "This account isn't on the staff list. Ask Brandon to add you." };
    }
    return { ok: true };
  }

  const expected = process.env.PREVIEW_STAFF_PASSWORD;
  if (!expected) {
    return { ok: false, message: "Preview sign-in is off. Set PREVIEW_STAFF_PASSWORD in .env.local." };
  }
  const staff = SAMPLE_STAFF.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (!staff || !safeEqual(password, expected)) return generic;
  const exp = String(Date.now() + PREVIEW_TTL_MS);
  (await cookies()).set(PREVIEW_COOKIE, `${staff.id}.${exp}.${sign(`${staff.id}.${exp}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PREVIEW_TTL_MS / 1000,
  });
  return { ok: true };
}

export async function signOut() {
  if (dataBackend() === "supabase") {
    const { supabaseAsUser } = await import("../supabase/server");
    await (await supabaseAsUser()).auth.signOut();
  }
  (await cookies()).delete(PREVIEW_COOKIE);
}
