import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { siteMode } from "./site-mode";

/**
 * The redacted truck photo (private driveway) lives in /private-preview, which is
 * git-ignored and never served from /public. It is only reachable through
 * /preview-assets/truck, and only when SITE_MODE is "preview".
 * Drop the file in as-is — don't crop or edit out the redactions.
 */
export const TRUCK_CANDIDATES = ["truck.jpg", "truck.jpeg", "truck.png", "truck.webp"];

export function findTruckPhoto(): string | null {
  if (siteMode() !== "preview") return null;
  for (const name of TRUCK_CANDIDATES) {
    const p = path.join(process.cwd(), "private-preview", name);
    if (existsSync(p)) return p;
  }
  return null;
}
