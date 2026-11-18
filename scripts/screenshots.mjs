// Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "screenshots";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
for (const [name, vp] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1366, height: 900 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/home-${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
