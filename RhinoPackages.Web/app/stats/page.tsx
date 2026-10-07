import { Suspense } from "react";
import type { Metadata } from "next";
import Spinner from "../_components/Spinner";
import StatsPageClient from "../_components/StatsPageClient";
import { openGraphDefaults, twitterDefaults } from "../_components/seo";

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
    url: "https://rhinopackages.github.io/stats",
  },
  twitter: {
    ...twitterDefaults,
    title: "Directory Stats | Rhino Packages",
    description:
      "Live summary statistics for RhinoPackages: package counts, plugin types, and latest updates from the Rhino ecosystem.",
  },
};

export default function Page() {
  // Reads ?author= and ?rising= from the query string, so it needs its own
  // boundary now that the layout no longer provides one.
  return (
    <Suspense
      fallback={
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      }
    >
      <StatsPageClient />
    </Suspense>
  );
}
