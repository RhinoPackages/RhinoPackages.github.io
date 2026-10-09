import { Suspense } from "react";
import type { Metadata } from "next";
import HomePageClient from "./_components/HomePageClient";
import Spinner from "./_components/Spinner";
import { authorRefs } from "./_components/authors";
import { loadDataDate, loadPackages } from "./_components/packageData";
import { directoryHeading } from "./_components/packageInfo";
import { openGraphDefaults, siteUrl } from "./_components/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    ...openGraphDefaults,
    url: `${siteUrl}/`,
    title: "Rhino Packages — Browse & Install 1,000+ Rhino 3D & Grasshopper Plugins",
    description:
      "The most comprehensive directory of Rhino 3D and Grasshopper plugins. Browse over 1,000 packages, filter by platform and version, install with one click.",
  },
};

// Describes the directory, so it belongs to this page alone; the
// layout only carries the site-wide WebSite and Organization entries.
const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${siteUrl}/#collection`,
      name: "Rhino 3D and Grasshopper Plugin Directory",
      description: "Complete catalog of Rhino 3D plugins and Grasshopper add-ons available through the Yak package manager, with version history, platform compatibility, and direct install links.",
      url: `${siteUrl}/`,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: {
        "@type": "SoftwareApplication",
        name: "Rhinoceros 3D",
        applicationCategory: "DesignApplication",
        operatingSystem: "Windows, macOS",
      },
    }
  ],
};

export default function Page() {
  const packages = loadPackages();
  const authors = authorRefs();
  const dataDate = loadDataDate();

  return (
    <>
      {/* The list reads its state from the query string, which opts it out of
          static rendering. Keeping the boundary this tight keeps the rest of
          the page in the exported HTML. */}
      <Suspense
        fallback={
          // Fills the viewport so the footer is already off-screen and nothing
          // below moves when the client content replaces it (layout shift).
          // The exported HTML has only this, so it carries the page's h1: the
          // list's own heading while nothing is narrowed.
          <div className="min-h-screen pt-4">
            <h1 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
              {directoryHeading(packages.length)}
            </h1>
            <div className="flex justify-center pt-10">
              <Spinner />
            </div>
          </div>
        }
      >
        <HomePageClient initialCache={packages} authors={authors} dataDate={dataDate?.toISOString()} />
      </Suspense>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      {/* The FAQ used to live here; keep old /#faq links working. */}
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: "if(location.hash==='#faq')location.replace('/faq');" }}
      />
    </>
  );
}

