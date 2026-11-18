// End-to-end test of the bid workflow against a running LOCAL PREVIEW server.
// Usage: PREVIEW_STAFF_PASSWORD=... node scripts/e2e-workflow.mjs [baseUrl]
import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:3000";
const password = process.env.PREVIEW_STAFF_PASSWORD;
if (!password) throw new Error("Set PREVIEW_STAFF_PASSWORD");

const iso = (offset) => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const results = [];
const step = async (name, fn) => {
  await fn();
  results.push(name);
  console.log("✓", name);
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const stamp = Date.now().toString().slice(-5);
const webName = `E2E website request ${stamp}`;
const mailName = `E2E emailed invite ${stamp}`;

// --- staff sign-in + reset ---------------------------------------------------
await step("Tracker redirects signed-out visitors to login", async () => {
  await page.goto(`${base}/tracker`);
  assert.match(page.url(), /\/tracker\/login$/);
});
await step("Wrong password is rejected", async () => {
  await page.fill("#email", "estimator@preview.local");
  await page.fill("#password", "wrong-password");
  await page.click("button[type=submit]");
  await page.getByText("didn't work").waitFor();
  assert.equal(await page.inputValue("#email"), "estimator@preview.local", "email kept after a failed sign-in");
});
await step("Estimator signs in and resets sample data", async () => {
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL(`${base}/tracker`, { waitUntil: "commit" });
  await page.getByRole("button", { name: "Reset sample data" }).click();
  await page.waitForLoadState("networkidle");
  await page.goto(`${base}/tracker`);
});

// --- public form -------------------------------------------------------------
const pub = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await step("Public form shows field errors for an empty submit", async () => {
  await pub.goto(base + "/#bid");
  await pub.waitForFunction(() => !document.querySelector("#bid button[type=submit]")?.hasAttribute("disabled"));
  await pub.waitForTimeout(3200); // minimum fill time
  await pub.click("#bid button[type=submit]");
  await pub.getByText("Please fix the highlighted fields.").waitFor();
  assert.equal(await pub.getAttribute("#contactName", "aria-invalid"), "true");
  assert.equal(await pub.evaluate(() => document.activeElement?.id), "contactName", "focus moves to first error");
  await pub.getByText("Enter the bid due date, or check").waitFor();
});
await step("Bad plans link is rejected on the server", async () => {
  await pub.fill("#contactName", "Pat Example");
  await pub.fill("#company", "Example Builders");
  await pub.fill("#email", "pat@example.com");
  await pub.fill("#projectName", webName);
  await pub.fill("#projectLocation", "Example City");
  await pub.fill("#scope", "Office build-out, about 5,000 sq ft. Lighting and power.");
  await pub.fill("#dueDate", iso(5));
  await pub.fill("#plansUrl", "not a link");
  await pub.click("#bid button[type=submit]");
  await pub.getByText("Paste a full link starting with https://").waitFor();
});
await step("Valid request saves and shows preview success (no email sent)", async () => {
  await pub.fill("#plansUrl", "https://example.com/plans");
  await pub.click("#bid button[type=submit]");
  await pub.getByRole("heading", { name: "Request received" }).waitFor();
  await pub.getByText("No confirmation email was sent").waitFor();
});

// --- manual entry ------------------------------------------------------------
await step("Staff enters an emailed invite manually (due tomorrow)", async () => {
  await page.goto(`${base}/tracker/new`);
  await page.selectOption("#source", "email");
  await page.fill("#projectName", mailName);
  await page.fill("#company", "Invite GC Inc.");
  await page.fill("#email", "bids@invitegc.example");
  await page.fill("#dueDate", iso(1));
  await page.fill("#plansUrl", "https://example.com/planroom/123");
  await page.click("button:has-text('Add to queue')");
  await page.waitForURL(/\/tracker\/bids\/.+\?saved=1/, { waitUntil: "commit" });
});

// --- queue + assignment ------------------------------------------------------
const rowIn = (list, name) => page.locator(`[data-testid=${list}] [data-testid=bid-row]`, { hasText: name });

await step("Both new bids show as unassigned", async () => {
  await page.goto(`${base}/tracker`);
  assert.equal(await rowIn("unassigned-list", webName).count(), 1);
  assert.equal(await rowIn("unassigned-list", mailName).count(), 1);
});
await step("Assign website request inline from the queue", async () => {
  const row = rowIn("unassigned-list", webName);
  await row.locator("select").selectOption({ label: "Brandon (sample)" });
  await row.getByRole("button", { name: "Assign" }).click();
  await page.waitForLoadState("networkidle");
  await page.reload();
  assert.equal(await rowIn("unassigned-list", webName).count(), 0);
});
await step("Assign emailed invite from its detail page", async () => {
  await rowIn("unassigned-list", mailName).getByRole("link").click();
  await page.selectOption("#ownerId", { label: "Estimator (sample)" });
  await page.selectOption("#status", "estimating");
  await page.fill("#sendByDate", iso(0));
  await page.click("button:has-text('Save changes')");
  await page.waitForURL(/saved=1/, { waitUntil: "commit" });
  await page.getByText("Estimator (sample)").first().waitFor();
});

await step("Open bids are ordered by deadline; no-date bids stay visible", async () => {
  await page.goto(`${base}/tracker`);
  assert.equal(await page.locator("[data-testid=unassigned-list] [data-testid=bid-row]", { hasText: "E2E" }).count(), 0);
  const names = await page.locator("[data-testid=open-list] > li a").allInnerTexts();
  const ids = await page.locator("[data-testid=open-list] > li").evaluateAll((els) => els.map((e) => e.dataset.bidId));
  assert.ok(ids.length >= 4, "open list has dated bids");
  // overdue sample (-1) → emailed invite (+1) → sample due soon (+3) → website (+5) → sample later (+16)
  const order = names.map((n) => n.trim());
  const expected = ["SAMPLE — Dental office TI", mailName, "SAMPLE — Warehouse LED retrofit", webName, "SAMPLE — Retail build-out, Unit 4"];
  assert.deepEqual(order, expected, `order was ${JSON.stringify(order)}`);
  const noDate = await page.locator("[data-testid=nodate-list] > li a").allInnerTexts();
  assert.deepEqual(noDate.map((n) => n.trim()), ["SAMPLE — Restaurant panel upgrade"]);
  // urgent panel = overdue + due within 7 days
  const urgent = (await page.locator("[data-testid=urgent-list] > li a").allInnerTexts()).map((n) => n.trim());
  assert.deepEqual(urgent, expected.slice(0, 4));
});

await step("Mark the emailed invite as Sent with today's date", async () => {
  await page.locator("[data-testid=open-list] a", { hasText: mailName }).click();
  await page.fill("#markSentDate", iso(0));
  await page.click("button:has-text('Mark as Sent')");
  await page.waitForURL(/sent=1/, { waitUntil: "commit" });
  await page.getByText("Marked as Sent.").waitFor();
  await page.goto(`${base}/tracker`);
  assert.equal(await page.locator("[data-testid=open-list] a", { hasText: mailName }).count(), 0);
  const closedRow = page.locator("[data-testid=closed-list] [data-testid=bid-row]", { hasText: mailName });
  assert.equal(await closedRow.count(), 1);
  assert.match(await closedRow.innerText(), /SENT/i);
});

await step("Status Sent without a sent date is refused", async () => {
  await page.locator("[data-testid=open-list] a", { hasText: webName }).click();
  await page.selectOption("#status", "sent");
  await page.fill("#sentDate", "");
  await page.click("button:has-text('Save changes')");
  await page.getByText("Add the date the bid was sent.").waitFor();
});

await step("Outbox logged estimator + receipt emails as not sent", async () => {
  await page.goto(`${base}/tracker/outbox`);
  const items = page.locator("[data-testid=outbox-list] > li", { hasText: webName });
  assert.equal(await items.count(), 2);
  assert.equal(await items.filter({ hasText: "Not sent (email off)" }).count(), 2);
  await items.filter({ hasText: "To estimator" }).getByText("Show message").click();
  const body = await items.filter({ hasText: "To estimator" }).locator("pre").innerText();
  assert.match(body, /Bid due: /);
  assert.match(body, /https:\/\/example.com\/plans/);
  const receipt = await items.filter({ hasText: "Receipt" }).locator("pre").textContent();
  assert.doesNotMatch(receipt, /within|business days|hours/i, "no turnaround promise in receipt");
});

await step("Sign out ends the session", async () => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/tracker\/login/, { waitUntil: "commit" });
  await page.goto(`${base}/tracker/outbox`);
  assert.match(page.url(), /\/tracker\/login$/);
});

await browser.close();
console.log(`\n${results.length} workflow checks passed.`);
