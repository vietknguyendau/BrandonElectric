/**
 * Brandon Electric — business details.
 *
 * This is the ONE file to edit for public content. Anything with
 * `approved: false` only shows up in the private preview (labeled "Draft").
 * The live site shows approved items only, and hides any section that has
 * nothing approved in it.
 *
 * When Brandon confirms something: fill in the value and set `approved: true`.
 */

export type Approved<T> = { value: T; approved: boolean };

export type Service = {
  id: string;
  title: string;
  description: string;
  /** Brandon confirmed he wants to bid this kind of work. */
  approved: boolean;
};

export type Project = {
  id: string;
  title: string;
  /** e.g. "Tenant improvement · 6,000 sq ft office" */
  scope: string;
  /** City or area, e.g. "Bloomington, MN" — only if the client is OK with it. */
  location: string;
  /** Path under /public, e.g. "/projects/office-ti.jpg". Empty until a real photo exists. */
  image: string;
  imageAlt: string;
  /** Brandon approved the copy AND has permission to publish the photo. */
  approved: boolean;
};

export type Credential = {
  /** e.g. "Minnesota Electrical Contractor License" */
  label: string;
  /** e.g. "EA123456" */
  value: string;
  approved: boolean;
};

export type BusinessConfig = {
  name: string;
  ownerFirstName: string;
  /** Final public URL, e.g. "https://brandonelectric.com". Used for metadata + structured data. */
  siteUrl: Approved<string>;
  /** Preferred business number. `display` is what people see; `tel` is digits for the link. */
  phone: Approved<{ display: string; tel: string }>;
  /** Public contact email shown on the page (optional). Bid notifications go to BID_NOTIFY_EMAIL, not here. */
  publicEmail: Approved<string>;
  /** Short city/area for the headline eyebrow, e.g. "Twin Cities". */
  primaryArea: Approved<string>;
  /** Cities or counties served. */
  serviceArea: Approved<{ summary: string; places: string[] }>;
  /** Office hours, if Brandon wants them listed. */
  hours: Approved<{ days: string; time: string }[]>;
  services: Service[];
  projects: Project[];
  credentials: Credential[];
  /** Optional line in the requester receipt, e.g. "We review new requests within 2 business days." */
  receiptTurnaroundLine: Approved<string>;
  /** Google Business Profile link, once it exists. */
  googleBusinessProfileUrl: Approved<string>;
  /** Used for "due soon" math in the tracker. */
  timeZone: string;
  /** Open bids due within this many days are flagged "Due soon". */
  dueSoonDays: number;
};

export const business: BusinessConfig = {
  name: "Brandon Electric",
  ownerFirstName: "Brandon",

  siteUrl: { value: "", approved: false },

  // Ask Brandon which number to publish. Don't copy it off the truck.
  phone: { value: { display: "", tel: "" }, approved: false },

  publicEmail: { value: "", approved: false },

  primaryArea: { value: "", approved: false },

  serviceArea: {
    value: { summary: "", places: [] },
    approved: false,
  },

  hours: { value: [], approved: false },

  // Draft examples for the preview. Publish only what Brandon wants to bid.
  services: [
    {
      id: "tenant-improvements",
      title: "Tenant improvements",
      description:
        "Power, lighting, and data rough-in for office, retail, and restaurant build-outs. Working from your plans and schedule.",
      approved: false,
    },
    {
      id: "commercial-lighting",
      title: "Commercial lighting",
      description:
        "Interior and exterior fixtures, LED retrofits, controls, and parking-lot lighting.",
      approved: false,
    },
    {
      id: "electrical-upgrades",
      title: "Electrical upgrades",
      description:
        "Service and panel upgrades, new circuits for equipment, and corrections from inspection reports.",
      approved: false,
    },
  ],

  // Up to three. Leave empty until there are real photos with permission to publish.
  projects: [],

  // Only list license / insurance / certifications Brandon approves for publication.
  credentials: [],

  receiptTurnaroundLine: { value: "", approved: false },

  googleBusinessProfileUrl: { value: "", approved: false },

  timeZone: "America/Chicago",
  dueSoonDays: 7,
};
