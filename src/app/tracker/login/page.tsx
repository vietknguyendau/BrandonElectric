import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/site/bits";
import { LoginForm } from "@/components/tracker/LoginForm";
import { getStaffUser } from "@/lib/auth";
import { SAMPLE_STAFF } from "@/lib/bids/sample-data";
import { dataBackend } from "@/lib/site-mode";

export const metadata: Metadata = { title: "Staff sign in | Bid Tracker", robots: { index: false } };

export default async function LoginPage() {
  if (await getStaffUser()) redirect("/tracker");
  const local = dataBackend() === "local";
  return (
    <main className="on-light flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Wordmark size="lg" />
        <h1 className="font-display mt-6 text-3xl font-extrabold uppercase">Bid tracker</h1>
        <p className="mt-1 text-charcoal-600">Staff only.</p>
        {local ? (
          <div className="mt-5 rounded-md border border-dashed border-gold-dark bg-[#fbf1dc] p-3 text-sm text-[#5a4420]">
            <p className="font-bold">Local preview sign-in</p>
            <p className="mt-1">
              Sample accounts: {SAMPLE_STAFF.map((s) => s.email).join(", ")}. Password is{" "}
              <code>PREVIEW_STAFF_PASSWORD</code> from <code>.env.local</code>.
            </p>
          </div>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
