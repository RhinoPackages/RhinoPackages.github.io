import type { Metadata } from "next";
import { loadPackages } from "@/app/_components/packageData";
import { packagePath, pluginKind } from "@/app/_components/packageInfo";
import { Package, compactNumber } from "@/app/_components/packageModel";
import { openGraphDefaults, siteUrl, twitterDefaults } from "@/app/_components/seo";

export function generateMetadata(): Metadata {
  const count = loadPackages().length.toLocaleString("en-US");
  const title = "All Rhino & Grasshopper Plugins A–Z";
  const description = `Alphabetical index of all ${count} Rhino 3D and Grasshopper packages on the Yak package manager, each with its versions, downloads, compatibility and install instructions.`;

  return {
    title,
    description,
    alternates: { canonical: "/packages" },
    openGraph: { ...openGraphDefaults, url: `${siteUrl}/packages`, title: `${title} | Rhino Packages`, description },
    twitter: { ...twitterDefaults, title: `${title} | Rhino Packages`, description },
  };
}

/** "A".."Z" for packages starting with a letter, "0–9" for everything else. */
function groupKey(id: string) {
  const first = id.charAt(0).toUpperCase();
  return first >= "A" && first <= "Z" ? first : "0–9";
}

function anchorFor(key: string) {
  return key === "0–9" ? "digits" : key;
}

export default function PackagesIndexPage() {
  const packages = [...loadPackages()].sort((a, b) =>
    a.id.localeCompare(b.id, "en", { sensitivity: "base", numeric: true }),
  );

  const groups = new Map<string, Package[]>();
  for (const pkg of packages) {
    const key = groupKey(pkg.id);
    const group = groups.get(key);
    if (group) group.push(pkg);
    else groups.set(key, [pkg]);
  }
  // Digits first, then the alphabet, like most A–Z indexes.
  const keys = Array.from(groups.keys()).sort((a, b) => (a === "0–9" ? -1 : b === "0–9" ? 1 : a.localeCompare(b)));

  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">All Rhino &amp; Grasshopper packages</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-gray-600 dark:text-zinc-400">
        Every one of the {packages.length.toLocaleString("en-US")} packages published to Rhino&apos;s Yak package
        manager, A to Z. Each page lists the plugin&apos;s versions, downloads, supported Rhino releases and
        platforms, and how to install it. To search and filter instead, use the{" "}
        <a href="/" className="pkg-link">directory</a>.
      </p>

      <nav aria-label="Jump to letter" className="sticky top-0 z-10 -mx-4 mt-6 bg-slate-50/95 px-4 py-2 backdrop-blur-sm dark:bg-zinc-950/95">
        {/* One scrolling row below sm: wrapped, the bar is three rows (~108px) and
            covers the heading a tap jumps to. The padding keeps focus rings from
            being clipped by the scroll container; the right-edge fade (cleared by the
            end padding once scrolled) hints that more letters scroll. */}
        <ul className="-m-0.5 flex flex-nowrap gap-1 overflow-x-auto p-0.5 pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pr-0.5 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
          {keys.map((key) => (
            <li key={key} className="shrink-0">
              <a
                href={`#${anchorFor(key)}`}
                className="inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-1 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-brand-400"
              >
                {key}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {keys.map((key) => (
        <section key={key} id={anchorFor(key)} aria-labelledby={`heading-${anchorFor(key)}`} className="mt-8 scroll-mt-16 sm:scroll-mt-20">
          <h2
            id={`heading-${anchorFor(key)}`}
            className="border-b border-gray-200 pb-2 text-xl font-bold text-gray-900 dark:border-zinc-800 dark:text-zinc-100"
          >
            {key}
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {(groups.get(key) ?? []).map((pkg) => (
              <li key={pkg.id} className="min-w-0 text-sm">
                <a href={packagePath(pkg.id)} className="pkg-link break-long-words font-medium">
                  {pkg.id}
                </a>
                <span className="pkg-muted">
                  {" "}· {pluginKind(pkg)} · {compactNumber(pkg.downloads)} {pkg.downloads === 1 ? "download" : "downloads"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
