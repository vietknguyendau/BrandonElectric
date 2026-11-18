import { ManualBidForm } from "@/components/tracker/forms";
import { requireStaff } from "@/lib/auth";
import { getStore } from "@/lib/bids/store";

export default async function NewBidPage() {
  await requireStaff();
  const staff = await (await getStore()).listStaff();
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold uppercase">Add a bid invite</h1>
      <p className="mt-1 text-charcoal-600">
        For invites that came in by email or phone, so every bid lives in the same queue. Company and project name are
        required — fill in the rest as you have it.
      </p>
      <div className="mt-8 rounded-md border border-line bg-paper p-5 sm:p-7">
        <ManualBidForm staff={staff} />
      </div>
    </div>
  );
}
