import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import HomePageClient from "./_components/HomePageClient";
import type { Package } from "./_components/api";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://rhinopackages.github.io/",
  },
};

function loadPackages(): Package[] {
  const dataPath = path.join(process.cwd(), "public", "data.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw) as Package[];
}

export default function Page() {
  const packages = loadPackages();

  const totalDownloads = packages.reduce((sum, p) => sum + p.downloads, 0);
  const topPackages = [...packages]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 200);

  return (
    <>
      <HomePageClient initialCache={packages} />

      {/* Static crawlable content for search engines */}
      <section className="mt-16 border-t border-gray-200 pt-10 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-zinc-100">
            Rhino 3D &amp; Grasshopper Plugin Directory
          </h2>
          <p className="mb-6 leading-relaxed text-gray-600 dark:text-zinc-400">
            Rhino Packages is the most comprehensive directory of{" "}
            <strong>Rhino 3D plugins</strong> and{" "}
            <strong>Grasshopper add-ons</strong>. Browse over{" "}
            <strong>{packages.length.toLocaleString()} packages</strong> with a
            combined <strong>{totalDownloads.toLocaleString()} downloads</strong>
            , sourced daily from the official{" "}
            <strong>Yak package manager</strong>. Filter by platform (Windows,
            Mac), Rhino version (6, 7, 8), and plugin type (Rhino plugin,
            Grasshopper component). Every package has version history, author
            info, and one-click install links.
          </p>

          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Popular Rhino &amp; Grasshopper Plugins
          </h3>
          <ul className="mb-10 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-zinc-400 sm:grid-cols-2 lg:grid-cols-3">
            {topPackages.map((pkg) => (
              <li key={pkg.id}>
                <strong>{pkg.id}</strong>
                <span className="text-gray-400 dark:text-zinc-500">
                  {" "}— {pkg.downloads.toLocaleString()} downloads
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h3>
          <dl className="mb-10 divide-y divide-gray-200 dark:divide-zinc-800">
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
      </section>
    </>
  );
}
