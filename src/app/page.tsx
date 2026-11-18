import { Footer, LaunchChecklist } from "@/components/site/Footer";
import { Header, MobileActionBar, PreviewBar } from "@/components/site/Header";
import { Audience, Hero } from "@/components/site/Hero";
import { RecentWork, ServiceArea, Services } from "@/components/site/Sections";
import { BidSection } from "@/components/site/BidSection";
import { getPageContent, launchChecklist } from "@/lib/content";
import { findTruckPhoto } from "@/lib/preview-photo";
import { localBusinessJsonLd, structuredDataMissing } from "@/lib/structured-data";

export default function Home() {
  const c = getPageContent();
  const jsonLd = localBusinessJsonLd();
  const truckPhoto = c.preview && findTruckPhoto() !== null;

  return (
    <>
      <a
        href="#bid"
        className="sr-only z-50 rounded-md bg-charcoal px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to bid request form
      </a>
      {c.preview ? <PreviewBar /> : null}
      <Header c={c} />
      <main className="flex-1">
        <Hero c={c} truckPhoto={truckPhoto} />
        <Audience />
        <Services c={c} />
        <RecentWork c={c} />
        <ServiceArea c={c} />
        <BidSection c={c} />
        {c.preview ? <LaunchChecklist items={launchChecklist()} structuredMissing={structuredDataMissing()} /> : null}
      </main>
      <Footer c={c} />
      <MobileActionBar c={c} />
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      ) : null}
    </>
  );
}
