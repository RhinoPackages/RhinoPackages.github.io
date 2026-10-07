import type { Metadata } from "next";
import { loadPackages } from "@/app/_components/packageData";
import { openGraphDefaults, siteUrl, twitterDefaults } from "@/app/_components/seo";

const title = "Rhino Packages FAQ";
const description =
  "How to install Rhino and Grasshopper plugins from the Yak package manager, which Rhino versions and platforms are supported, and how often the directory updates.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/faq" },
  openGraph: { ...openGraphDefaults, url: `${siteUrl}/faq`, title: `${title} | Rhino Packages`, description },
  twitter: { ...twitterDefaults, title: `${title} | Rhino Packages`, description },
};

const faqStructuredData = {
  "@context": "https://schema.org",
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
};

export default function FaqPage() {
  const packages = loadPackages();

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Frequently asked questions</h1>
      <dl className="mt-6 divide-y divide-gray-200 dark:divide-zinc-800">
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
    </div>
  );
}
