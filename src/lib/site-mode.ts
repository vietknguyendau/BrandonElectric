import "server-only";

/**
 * SITE_MODE controls what the public page shows.
 *  - "preview" (default): drafts visible with labels, noindex, emails never sent.
 *  - "live": approved content only.
 */
export type SiteMode = "preview" | "live";

export function siteMode(): SiteMode {
  return process.env.SITE_MODE === "live" ? "live" : "preview";
}

export const isPreview = () => siteMode() === "preview";

/** Data backend: Supabase when configured, otherwise a local JSON file (preview only). */
export function dataBackend(): "supabase" | "local" {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_ANON_KEY) {
    return "supabase";
  }
  return "local";
}

/**
 * Outbound email is only possible in live mode with a provider key AND
 * EMAIL_DELIVERY=enabled. Preview never sends — messages go to the outbox log.
 */
export function emailDeliveryEnabled(): boolean {
  return (
    siteMode() === "live" &&
    process.env.EMAIL_DELIVERY === "enabled" &&
    Boolean(process.env.RESEND_API_KEY) &&
    Boolean(process.env.EMAIL_FROM) &&
    Boolean(process.env.BID_NOTIFY_EMAIL)
  );
}
