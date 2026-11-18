import type { MetadataRoute } from "next";
import { business } from "@/config/business";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = business.siteUrl.approved ? business.siteUrl.value.replace(/\/$/, "") : "";
  if (process.env.SITE_MODE !== "live" || !site) return [];
  return [{ url: `${site}/`, changeFrequency: "monthly", priority: 1 }];
}
