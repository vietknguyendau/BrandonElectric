import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/public-sans";
import "./globals.css";
import { business } from "@/config/business";

const live = process.env.SITE_MODE === "live";
const siteUrl = business.siteUrl.approved && business.siteUrl.value ? business.siteUrl.value : undefined;
const area = business.primaryArea.approved ? business.primaryArea.value.trim() : "";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: area
    ? `Commercial Electrical Contractor in ${area} | ${business.name}`
    : `Commercial Electrical Contractor | ${business.name}`,
  description: area
    ? `${business.name} bids commercial electrical work in ${area} for general contractors, property and facilities managers, and business owners. Send plans and your bid date.`
    : `${business.name} bids commercial electrical work for general contractors, property and facilities managers, and business owners. Send plans and your bid date.`,
  alternates: siteUrl ? { canonical: "/" } : undefined,
  robots: live ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#5e1a28",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
