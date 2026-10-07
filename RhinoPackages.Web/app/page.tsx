import { Suspense } from "react";
import type { Metadata } from "next";
import HomePageClient from "./_components/HomePageClient";
import Spinner from "./_components/Spinner";
import { loadPackages } from "./_components/packageData";
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

// Describes the directory and its FAQ, so it belongs to this page alone; the
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
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Rhino Packages?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rhino Packages is the most comprehensive directory of Rhino 3D and Grasshopper plugins. It indexes over 1,000 packages from the Yak package manager with search, filtering, version history, and one-click install links.",
          },
        },
        {
          "@type": "Question",
          name: "How do I install a Rhino plugin from this directory?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Click the 'Install' button on any package card. This opens a rhino:// protocol link that launches Rhino's built-in Package Manager and installs the plugin directly. You can also use the _PackageManager command inside Rhino.",
          },
        },
        {
          "@type": "Question",
          name: "What is the difference between a Rhino plugin and a Grasshopper plugin?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rhino plugins (.rhp) add commands and features directly to Rhinoceros 3D. Grasshopper plugins (.gha) add components to Grasshopper, Rhino's visual programming environment for parametric and computational design. Many packages include both.",
          },
        },
        {
          "@type": "Question",
          name: "Which Rhino versions are supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Packages in this directory support Rhino 6, Rhino 7, Rhino 8, and Rhino 9 (WIP). You can filter by version to find plugins compatible with your installation. Most actively maintained plugins support Rhino 7, 8, and 9.",
          },
        },
        {
          "@type": "Question",
          name: "Are these plugins available for Mac?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Many plugins support both Windows and macOS. Use the platform filter to find Mac-compatible packages. Platform support depends on the individual plugin author.",
          },
        },
        {
          "@type": "Question",
          name: "How often is the plugin directory updated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The directory is updated daily via automated GitHub Actions that sync with the official Yak package manager feed. New plugins and version updates appear within 24 hours of publication.",
          },
        },
      ],
    },
  ],
};

export default function Page() {
  const packages = loadPackages();

  return (
    <>
      {/* The list reads its state from the query string, which opts it out of
          static rendering. Keeping the boundary this tight means the section
          below still ships in the exported HTML. */}
      <Suspense
        fallback={
          // Fills the viewport so the footer is already off-screen and nothing
          // below moves when the client content replaces it (layout shift).
          <div className="flex min-h-screen justify-center pt-10">
            <Spinner />
          </div>
        }
      >
        <HomePageClient initialCache={packages} />
      </Suspense>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />

      {/* Static crawlable content for search engines. Collapsed with native
          <details> so the markup still ships in the HTML for crawlers while
          staying out of the way for readers. */}
      <section className="mt-16 border-t border-gray-200 pt-10 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl">
          <details id="faq" className="group scroll-mt-4 border-b border-gray-200 pb-4 dark:border-zinc-800">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                Frequently Asked Questions
              </h2>
              <Chevron />
            </summary>
            <dl className="divide-y divide-gray-200 pt-2 dark:divide-zinc-800">
            <div className="py-4">
              <dt className="font-medium text-gray-900 dark:text-zinc-100">
                What is Rhino Packages?
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                Rhino Packages is the most comprehensive directory of Rhino 3D
                and Grasshopper plugins. It indexes over{" "}
                {packages.length.toLocaleString()} packages from the Yak package
                manager with search, filtering, version history, and one-click
                install links.
              </dd>
            </div>
            <div className="py-4">
              <dt className="font-medium text-gray-900 dark:text-zinc-100">
                How do I install a Rhino plugin from this directory?
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                Click the &quot;Install&quot; button on any package card. This
                opens a rhino:// protocol link that launches Rhino&apos;s
                built-in Package Manager and installs the plugin directly. You
                can also use the _PackageManager command inside Rhino.
              </dd>
            </div>
            <div className="py-4">
              <dt className="font-medium text-gray-900 dark:text-zinc-100">
                What is the difference between a Rhino plugin and a Grasshopper
                plugin?
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                Rhino plugins (.rhp) add commands and features directly to
                Rhinoceros 3D. Grasshopper plugins (.gha) add components to
                Grasshopper, Rhino&apos;s visual programming environment for
                parametric and computational design. Many packages include both.
              </dd>
            </div>
            <div className="py-4">
              <dt className="font-medium text-gray-900 dark:text-zinc-100">
                Which Rhino versions are supported?
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                Packages in this directory support Rhino 6, Rhino 7, and Rhino
                8. You can filter by version to find plugins compatible with your
                installation. Most actively maintained plugins support Rhino 7
                and 8.
              </dd>
            </div>
            <div className="py-4">
              <dt className="font-medium text-gray-900 dark:text-zinc-100">
                Are these plugins available for Mac?
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                Many plugins support both Windows and macOS. Use the platform
                filter to find Mac-compatible packages. Platform support depends
                on the individual plugin author.
              </dd>
            </div>
            <div className="py-4">
              <dt className="font-medium text-gray-900 dark:text-zinc-100">
                How often is the plugin directory updated?
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                The directory is updated daily via automated GitHub Actions that
                sync with the official Yak package manager feed. New plugins and
                version updates appear within 24 hours of publication.
              </dd>
            </div>
            </dl>
          </details>
          {/* The header's FAQ link lands on /#faq: open the section it points at. */}
          <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html:
                "(function(){function o(){if(location.hash==='#faq'){var d=document.getElementById('faq');if(d){d.open=true;d.scrollIntoView();}}}o();addEventListener('hashchange',o);})();",
            }}
          />
        </div>
      </section>
    </>
  );
}

function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180 dark:text-zinc-500"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
