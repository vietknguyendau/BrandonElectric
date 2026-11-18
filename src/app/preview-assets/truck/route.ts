import { readFile } from "node:fs/promises";
import path from "node:path";
import { findTruckPhoto } from "@/lib/preview-photo";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET() {
  const file = findTruckPhoto();
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(await readFile(file)), {
    headers: {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
