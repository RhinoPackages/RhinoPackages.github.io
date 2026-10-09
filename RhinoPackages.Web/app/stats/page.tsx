import { Suspense } from "react";
import type { Metadata } from "next";
import Spinner from "../_components/Spinner";
import StatsPageClient from "../_components/StatsPageClient";
import { authorRankings } from "../_components/authors";
import { loadPackages } from "../_components/packageData";
import { formatDate, latestRelease } from "../_components/packageModel";
import { openGraphDefaults, siteUrl, twitterDefaults } from "../_components/seo";

export const metadata: Metadata = {
  title: "Directory Stats",
  description:
    "Live summary statistics for RhinoPackages: package counts, plugin types, and latest updates from the Rhino ecosystem.",
  alternates: {
    canonical: "/stats",
  },
  openGraph: {
    ...openGraphDefaults,
    title: "Directory Stats | Rhino Packages",
    description:
      "Live summary statistics for RhinoPackages: package counts, plugin types, and latest updates from the Rhino ecosystem.",
    url: `${siteUrl}/stats`,
  },
  twitter: {
    ...twitterDefaults,
    title: "Directory Stats | Rhino Packages",
    description:
      "Live summary statistics for RhinoPackages: package counts, plugin types, and latest updates from the Rhino ecosystem.",
  },
};

export default function Page() {
  // Author numbers are the author pages' own, so they are worked out here,
  // where the data is on disk, and handed to the client table as rows.
  const authors = authorRankings();
  const latest = formatDate(Math.max(...loadPackages().map((pkg) => latestRelease(pkg).getTime())));

  // The heading is plain server markup, so the exported HTML has its h1. The
  // tables below it read ?author=, ?movers= and ?rising= from the query
  // string, which needs a boundary of its own now that the layout no longer
  // provides one. Until the boundary resolves, the exported HTML shows its
  // spinner, never the client's error state.
  return (
    <div className="flex flex-col gap-8 pb-12 pt-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Directory Stats</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Latest package release {latest}</p>
      </div>
      <Suspense
        fallback={
          // Fills the viewport so the footer is already off-screen and nothing
          // below moves when the client content replaces it (layout shift).
          <div className="flex min-h-screen justify-center pt-2">
            <Spinner />
          </div>
        }
      >
        <StatsPageClient authors={authors} />
      </Suspense>
    </div>
  );
}
