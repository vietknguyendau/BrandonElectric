// Keyboard order + brand color contrast + tracker screenshots. Usage: node scripts/a11y-checks.mjs [baseUrl] [outDir]
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "screenshots";
const lum = (hex) => {
  const c = hex.match(/\w\w/g).map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ["cream on burgundy (hero text)", "f8f3ea", "5e1a28"],
  ["gold-light on burgundy (eyebrow)", "d8bd8a", "5e1a28"],
  ["burgundy on cream (buttons/links)", "5e1a28", "f8f3ea"],
  ["charcoal-600 on paper (body)", "4a4542", "fffdf8"],
  ["gold-dark on cream (eyebrows)", "7d6131", "f8f3ea"],
  ["draft tag text", "5a4420", "fbf1dc"],
  ["gold-light on charcoal (footer)", "d8bd8a", "24211f"],
  ["danger on error bg", "9b1c1c", "fdf0f0"],
  ["ok green on paper", "1f5e3a", "fffdf8"],
];
let fail = 0;
for (const [n, f, b] of pairs) { const r = ratio(f, b); if (r < 4.5) fail++; console.log(`${r >= 4.5 ? "✓" : "✗"} ${r.toFixed(2)}:1  ${n}`); }

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(base + "/");
const seen = [];
for (let i = 0; i < 14; i++) {
  await page.keyboard.press("Tab");
  seen.push(await page.evaluate(() => {
    const el = document.activeElement;
    const o = getComputedStyle(el).outlineStyle;
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} "${(el.textContent || el.getAttribute("aria-label") || el.name || "").trim().slice(0, 28)}" outline:${o}`;
  }));
}
console.log("\nTab order:\n  " + seen.join("\n  "));
await page.keyboard.press("Escape");
await page.goto(base + "/");
await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
console.log("Skip link lands at:", await page.evaluate(() => location.hash));
await browser.close();
if (fail) process.exitCode = 1;
