import type { MetadataRoute } from "next";
import { business } from "@/config/business";

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_MODE !== "live") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  const site = business.siteUrl.approved ? business.siteUrl.value : "";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/tracker", "/api", "/preview-assets"] },
    ...(site ? { sitemap: `${site.replace(/\/$/, "")}/sitemap.xml` } : {}),
  };
}
