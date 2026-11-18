# Brandon Electric — commercial landing page + bid tracker

One public page for general contractors, property/facilities managers, and business owners, with a
**Request a Bid** form. It also has a private **bid tracker** where the team keeps website requests and
invites that come in by email or phone in one queue.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (storage + staff sign-in) · Resend (email)

> **Private until Brandon approves.** The site defaults to `SITE_MODE=preview`: drafts are labeled, every
> page is `noindex`, and no email is ever sent. Do not set `SITE_MODE=live` or point a public domain at it
> until he signs off.

---

## Run the preview locally

```bash
npm install
cp .env.example .env.local     # then fill in the preview values below
npm run dev                    # http://localhost:3000
```

Minimum `.env.local` for the local preview:

```
SITE_MODE=preview
PREVIEW_STAFF_PASSWORD=pick-something
PREVIEW_SESSION_SECRET=any-long-random-string
FORM_SIGNING_SECRET=any-long-random-string
```

- Public page: <http://localhost:3000>
- Tracker: <http://localhost:3000/tracker>. Sign in as `brandon@preview.local` or `estimator@preview.local`
  with `PREVIEW_STAFF_PASSWORD`.

Without Supabase configured, the preview stores data in `.preview-data/store.json` (git-ignored) and
seeds **clearly labeled sample bids**. Use **Reset sample data** in the tracker to start over. Preview
"emails" show up under **Tracker → Outbox** and are never sent.

## Where to edit things

| What | Where |
| --- | --- |
| Phone, service area, hours, services, projects, license/credentials, site URL, receipt wording | `src/config/business.ts` |
| Page sections | `src/components/site/` |
| Bid form fields | `src/components/site/BidForm.tsx` + `src/lib/bids/schema.ts` |
| Email wording | `src/lib/email/templates.ts` |
| Brand colors and fonts | `src/app/globals.css` |
| Database schema + access rules | `supabase/migrations/0001_bid_tracker.sql` |

**How approvals work:** each item in `business.ts` has `approved: false` until Brandon confirms it.
In preview it shows with a "Draft" tag. On the live site, unapproved items don't appear, and a section
with nothing approved is hidden. That covers services, Recent Work, service area, hours, credentials,
and the Call button. Structured data (schema.org `Electrician`) only goes out once the site URL, phone,
and service area are all approved. A checklist at the bottom of the preview page shows what's still open.

### Photos

- **Project photos:** put them in `public/projects/` and add them to `projects` in `business.ts`, with
  `approved: true` only once there's permission to publish. Recent Work stays hidden on the live site until
  at least one approved project has a photo.
- **Truck photo (preview only):** save the redacted photo as `private-preview/truck.jpg`, exactly as is.
  That folder is git-ignored. The photo is served only through `/preview-assets/truck` while
  `SITE_MODE=preview`, and that route returns 404 in live mode. The hero looks complete without it.

## Bid request flow

1. The form posts to `/api/bid-requests`. The server checks a honeypot field, a signed form token (with a
   minimum fill time), a per-IP rate limit, and Cloudflare Turnstile if it's configured. Then it validates
   every field with zod.
2. The request is **saved first**. The success message only appears after the save works.
3. The designated estimator (`BID_NOTIFY_EMAIL`) gets the project summary, bid deadline, plans link, and a
   tracker link. The requester gets a receipt. The receipt makes no turnaround promise unless
   `receiptTurnaroundLine` is approved in `business.ts`.
4. If an email fails, the bid is still saved and gets flagged **Email issue** in the tracker. Every message
   is recorded in the Outbox.

## Tracker

- Statuses: New, Reviewing, Estimating (open) → Sent, Won, Lost, Passed.
- The queue shows unassigned bids (with an inline Assign), bids that are overdue or due within
  `dueSoonDays` (7 by default), and all open bids sorted by external due date. Bids with no due date stay
  visible in their own group.
- **+ Add invite** is for manual entry of email and phone invites.
- On each bid: owner, status, external due date, optional internal send-by date, notes, and
  **Mark as Sent** with the sent date. Status Sent requires a sent date, and the database enforces that too.
- Bids can't be deleted. Close them as Passed or Lost.

## Going live: Supabase, staff, email, Vercel

### 1. Supabase

1. Create a Supabase project.
2. In the **SQL Editor**, run `supabase/migrations/0001_bid_tracker.sql`.
3. **Authentication → Providers:** keep Email on, and turn **off** "Allow new users to sign up".
4. From **Project Settings → API**, copy the URL, the anon key, and the service_role key.

### 2. Staff access

For each person who should see the tracker:

1. **Authentication → Users → Invite user** (or Add user with a password).
2. Add them to the staff allowlist in the SQL editor:

```sql
insert into public.staff (user_id, email, display_name, role)
select id, email, 'Brandon', 'admin' from auth.users where email = 'brandon@yourdomain.com';
```

To remove access: `update public.staff set active = false where email = '…';`.
Signing in isn't enough by itself. Row Level Security only shows bids to active staff, and the anon
key can't read anything.

### 3. Email (Resend)

1. Create a Resend account, verify the sending domain, and create an API key.
2. Set `RESEND_API_KEY`, `EMAIL_FROM` (for example `Brandon Electric <bids@yourdomain.com>`), and
   `BID_NOTIFY_EMAIL` (the estimator who gets new requests).
3. Email only sends when **all** of these are true: `SITE_MODE=live`, `EMAIL_DELIVERY=enabled`, and the
   three values above are set. To change the recipient later, update `BID_NOTIFY_EMAIL` in Vercel and
   redeploy.

### 4. Spam protection (recommended)

Create a Cloudflare Turnstile widget and set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
`TURNSTILE_SECRET_KEY`. Also set a long random `FORM_SIGNING_SECRET`. Live mode requires it.

### 5. Vercel

1. Push this repo to a **private** GitHub repo.
2. In Vercel, choose **Add New → Project**, import the repo, and keep the Next.js defaults.
3. Add the environment variables from `.env.example`. Keep `SITE_MODE=preview`,
   `EMAIL_DELIVERY=disabled`, and set `PREVIEW_ACCESS_PASSWORD` so the whole site needs a password.
   Turning on Vercel **Deployment Protection** works too.
4. Deploy and share the password-protected URL with Brandon.
5. **After he approves:** update `business.ts`, set `SITE_MODE=live`, `EMAIL_DELIVERY=enabled`, and
   `APP_BASE_URL=https://yourdomain.com`, remove `PREVIEW_ACCESS_PASSWORD`, add the domain under
   **Settings → Domains**, and redeploy.
6. Use the root URL (`https://yourdomain.com`) as the website on Brandon's Google Business Profile and in
   referrals. The form is at `https://yourdomain.com/#bid`.

The local JSON store doesn't work on Vercel (read-only filesystem), so any deployment needs Supabase.
For a deployed preview, use a separate Supabase project, or mark sample rows with `is_sample = true`.

## Checks

```bash
npm run lint && npm run typecheck && npm run build
bash scripts/test-migration.sh                     # migration + RLS on a throwaway Postgres (needs postgres binaries)
# with the preview server running on :3000:
PREVIEW_STAFF_PASSWORD=… node scripts/e2e-workflow.mjs   # full bid workflow (Playwright)
node scripts/a11y-checks.mjs                       # keyboard order + contrast
node scripts/screenshots.mjs http://localhost:3000 screenshots
```

If the system Chrome is used, set `CHROME_PATH`. Otherwise run `npx playwright install chromium`.
